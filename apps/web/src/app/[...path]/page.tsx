import { notFound, redirect } from "next/navigation";
import { MainLayout } from "~/components/layout/MainLayout";
import { WikiPage } from "~/components/wiki/WikiPage";
import { WikiEditor } from "~/components/wiki/WikiEditor";
import { HighlightedContent } from "~/lib/markdown/client";
import { db } from "@repo/db";
import { wikiPages } from "@repo/db";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "~/lib/auth";
import { Suspense } from "react";
import { renderWikiMarkdownToHtml } from "~/lib/services/markdown";
import { authorizationService } from "~/lib/services/authorization";
import { MovePageWrapper } from "~/components/wiki/MovePageWrapper";

export const revalidate = 900; // 15 minutes as we are dynamically telling the server to revalidate
export const fetchCache = "force-cache";
export const dynamic = "force-static";

/**
 * Generates static paths for all existing wiki pages at build time.
 * This enables SSG for these pages.
 */
export async function generateStaticParams() {
  const pages = await db.query.wikiPages.findMany({
    columns: {
      path: true,
    },
    // Filter out the 'index' path
    where: (wikiPages) => eq(wikiPages.isPublished, true),
  });

  // Filter out the 'index' path before mapping
  const filteredPages = pages.filter((page) => page.path !== "index");

  return filteredPages.map((page) => ({
    // Split the path string into segments and decode them
    path: page.path.split("/").map((segment) => decodeURIComponent(segment)),
  }));
}

export async function getWikiPageByPath(path: string[]) {
  // Decode each path segment individually
  const decodedPath = path.map((segment) => decodeURIComponent(segment));
  const joinedPath = decodedPath.join("/").replace("%20", " ");

  const page = await db.query.wikiPages.findFirst({
    where: eq(wikiPages.path, joinedPath),
    with: {
      createdBy: true,
      updatedBy: true,
      lockedBy: true,
      tags: {
        with: {
          tag: true,
        },
      },
    },
  });

  if (!page) {
    return null; // Return null if page not found
  }

  // Ensure tags are loaded even if we return early due to cached HTML
  const tags = page.tags;

  // Check if rendered HTML is up-to-date
  if (
    page.renderedHtml &&
    page.renderedHtmlUpdatedAt &&
    page.renderedHtmlUpdatedAt > (page.updatedAt ?? new Date(0)) // Use epoch if no updatedAt
  ) {
    // Return page with guaranteed tags
    return { ...page, tags };
  }

  // If page is found and has content, render the markdown to HTML
  if (page.content) {
    const renderedHtml = await renderWikiMarkdownToHtml(
      page.content,
      page.id,
      page.path
    );
    // Return page with newly rendered HTML and guaranteed tags
    return {
      ...page,
      renderedHtml,
      renderedHtmlUpdatedAt: new Date(),
      tags, // Ensure tags are included here too
    };
  }

  // If no content, return page with guaranteed tags
  return { ...page, tags };
}

type Params = Promise<{ path: string[] }>;
type SearchParams = Promise<{
  edit?: string;
  move?: string;
  highlight?: string;
}>;

export default async function WikiPageView({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id
    ? parseInt(session.user.id)
    : undefined;

  const canAccessPage = await authorizationService.hasPermission(
    currentUserId,
    "wiki:page:read"
  );

  if (!canAccessPage) {
    redirect("/");
  }

  const page = await getWikiPageByPath(resolvedParams.path);

  if (!page) {
    notFound();
  }

  // Format tags for the WikiPage component
  const formattedTags =
    page.tags?.map((relation) => ({
      id: relation.tag.id,
      name: relation.tag.name,
    })) || [];

  // Determine if the page is currently locked
  const isLocked = Boolean(
    page.lockedBy &&
      page.lockExpiresAt &&
      new Date(page.lockExpiresAt) > new Date()
  );

  // Determine if the current user is the lock owner
  const isCurrentUserLockOwner = Boolean(
    currentUserId && page.lockedBy && page.lockedBy.id === currentUserId
  );

  // Format the lockedBy data for the header
  const formattedLockedBy = page.lockedBy
    ? { id: page.lockedBy.id, name: page.lockedBy.name || "Unknown" }
    : null;

  // Check operation modes
  const isEditMode = resolvedSearchParams.edit === "true";
  const isMoveMode = resolvedSearchParams.move === "true";

  // Edit mode
  if (isEditMode) {
    const canEditPage = await authorizationService.hasPermission(
      currentUserId,
      "wiki:page:update"
    );
    if (!canEditPage) {
      redirect("/");
    }
    return (
      <WikiEditor
        mode="edit"
        pageId={page.id}
        initialTitle={page.title}
        initialContent={page.content ?? ""}
        initialTags={page.tags?.map((relation) => relation.tag.name) || []}
        pagePath={page.path}
      />
    );
  }

  // Move mode
  if (isMoveMode) {
    const canMovePage = await authorizationService.hasPermission(
      currentUserId,
      "wiki:page:move"
    );
    if (!canMovePage) {
      redirect("/");
    }
    // Instead of trying to render the PageLocationEditor directly,
    // use the MainLayout with a client component wrapper
    return (
      <MainLayout
        pageMetadata={{
          title: page.title,
          path: page.path,
          id: page.id,
          isLocked: isLocked,
          lockedBy: formattedLockedBy,
          lockExpiresAt: page.lockExpiresAt?.toISOString() || null,
          isCurrentUserLockOwner: isCurrentUserLockOwner,
        }}
      >
        <MovePageWrapper
          pageId={page.id}
          pageTitle={page.title}
          pagePath={page.path}
        />
      </MainLayout>
    );
  }

  // View mode
  return (
    <MainLayout
      pageMetadata={{
        title: page.title,
        path: page.path,
        id: page.id,
        isLocked: isLocked,
        lockedBy: formattedLockedBy,
        lockExpiresAt: page.lockExpiresAt?.toISOString() || null,
        isCurrentUserLockOwner: isCurrentUserLockOwner,
      }}
    >
      <WikiPage
        id={page.id}
        title={page.title}
        content={
          <Suspense fallback={<div>Loading...</div>}>
            <HighlightedContent
              content={page.content || ""}
              renderedHtml={page.renderedHtml}
            />
          </Suspense>
        }
        createdAt={new Date(page.createdAt ?? new Date())}
        updatedAt={new Date(page.updatedAt ?? new Date())}
        createdBy={
          page.createdBy
            ? { id: page.createdBy.id, name: page.createdBy.name || "Unknown" }
            : undefined
        }
        updatedBy={
          page.updatedBy
            ? { id: page.updatedBy.id, name: page.updatedBy.name || "Unknown" }
            : undefined
        }
        lockedBy={
          page.lockedBy
            ? { id: page.lockedBy.id, name: page.lockedBy.name || "Unknown" }
            : null
        }
        lockedAt={page.lockedAt ? new Date(page.lockedAt) : null}
        lockExpiresAt={page.lockExpiresAt ? new Date(page.lockExpiresAt) : null}
        tags={formattedTags}
        path={page.path}
        currentUserId={currentUserId}
      />
    </MainLayout>
  );
}
