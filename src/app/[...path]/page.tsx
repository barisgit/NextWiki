import { notFound } from "next/navigation";
import { MainLayout } from "~/components/layout/MainLayout";
import { WikiPage } from "~/components/wiki/WikiPage";
import { WikiEditor } from "~/components/wiki/WikiEditor";
import { HighlightedMarkdown } from "~/components/wiki/HighlightedMarkdown";
import { db } from "~/lib/db";
import { wikiPages } from "~/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "~/lib/auth";
import { Suspense } from "react";

async function getWikiPageByPath(path: string[]) {
  const joinedPath = `${path.join("/")}`;

  // FIXME: Use dbService to get the page
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

  // Return null if page is not found
  return page;
}

type Params = Promise<{ path: string[] }>;
type SearchParams = Promise<{ edit?: string; highlight?: string }>;

export default async function WikiPageView({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const page = await getWikiPageByPath(resolvedParams.path);
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id
    ? parseInt(session.user.id)
    : undefined;

  if (!page) {
    notFound();
  }

  // Check if we're in edit mode
  const isEditMode = resolvedSearchParams.edit === "true";

  if (isEditMode) {
    // Return the editor directly without MainLayout wrapper
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

  // Format tags for the WikiPage component
  const formattedTags =
    page.tags?.map((relation) => ({
      id: relation.tag.id,
      name: relation.tag.name,
    })) || [];

  // View mode
  return (
    <MainLayout>
      <WikiPage
        id={page.id}
        title={page.title}
        content={
          <Suspense fallback={<div>Loading...</div>}>
            <HighlightedMarkdown content={page.content || ""} />
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
