import { UserMenu } from "../auth/UserMenu";
import { Suspense } from "react";
import { ThemeToggle } from "~/components/layout/theme-toggle";
import { AdminButton } from "~/components/layout/AdminButton";
import { PageMetadata } from "./MainLayout";
import Link from "next/link";
import { WikiLockInfo } from "~/components/wiki/WikiLockInfo";
import { MoveIcon, PencilIcon } from "lucide-react";
import { ClientRequirePermission } from "~/components/auth/permission/client";
import { getSettingValue } from "~/lib/utils/settings";

export async function Header({
  pageMetadata,
}: {
  pageMetadata?: PageMetadata;
}) {
  const isHomePage = pageMetadata?.path === "index";

  // Get site title from settings
  const siteTitle = await getSettingValue("site.title");

  return (
    <header
      className={
        "border-border-default flex h-16 items-center justify-between border-b px-4 shadow-md"
      }
    >
      <div className="flex items-center">
        {isHomePage && (
          <div className="mr-3 hidden md:block">
            <Link href="/" className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary h-8 w-8"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            </Link>
          </div>
        )}

        {pageMetadata?.title && (
          <div>
            <h1
              className={`font-medium ${isHomePage ? "text-text-primary text-xl" : "text-text-primary text-lg"}`}
            >
              {siteTitle}
            </h1>
          </div>
        )}

        {/* Page action buttons - moved closer to title */}
        {pageMetadata?.path && pageMetadata.id && (
          <div className="ml-4 flex items-center space-x-2">
            <ClientRequirePermission permission="wiki:page:update">
              <Link
                href={`/${pageMetadata.path}?edit=true`}
                className="text-text-secondary hover:text-primary hover:border-accent/20 flex items-center rounded border border-transparent px-2 py-1 text-xs"
              >
                <PencilIcon className="mr-1 h-3.5 w-3.5" />
                Edit
              </Link>
              {!isHomePage && (
                <Link
                  href={`/${pageMetadata.path}?move=true`}
                  className="text-text-secondary hover:text-primary hover:border-accent/20 flex items-center rounded border border-transparent px-2 py-1 text-xs"
                >
                  <MoveIcon className="mr-1 h-3.5 w-3.5" />
                  Move
                </Link>
              )}
              {pageMetadata.lockedBy && (
                <WikiLockInfo
                  pageId={pageMetadata.id}
                  isLocked={!!pageMetadata.isLocked}
                  lockedByName={pageMetadata.lockedBy?.name || null}
                  lockedUntil={pageMetadata.lockExpiresAt || null}
                  isCurrentUserLockOwner={
                    pageMetadata.isCurrentUserLockOwner || false
                  }
                  editPath={`/${pageMetadata.path}?edit=true`}
                  displayMode="header"
                />
              )}
            </ClientRequirePermission>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {/* Tags removed from here */}
        {/* {env.NODE_ENV === "development" && <RandomNumberDisplay />} */}
        <ThemeToggle />
        {/* Wrap client components needing session in Suspense */}
        <Suspense
          fallback={
            <div className="h-9 w-20 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"></div>
          }
        >
          <AdminButton />
        </Suspense>
        <Suspense
          fallback={
            <div className="h-9 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
          }
        >
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}
