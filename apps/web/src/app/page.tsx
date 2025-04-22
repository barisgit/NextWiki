import Link from "next/link";
import { MainLayout } from "~/components/layout/MainLayout";
import { dbService } from "~/lib/services";
import { Card, CardContent, CardTitle } from "@repo/ui";
import { HighlightedContent } from "~/lib/markdown/client";
import { Suspense } from "react";
import { formatDistanceToNow } from "date-fns";
import { getWikiPageByPath } from "./[...path]/page";
import { WikiFolderTree } from "~/components/wiki/WikiFolderTree";

export default async function Home() {
  const recentPages = await dbService.wiki.getRecentPages(5);

  // Fetch the root page ("index")
  const rootPage = await getWikiPageByPath(["index"]);

  const renderedHtml = rootPage?.renderedHtml;

  return (
    <MainLayout>
      <div className="flex flex-col gap-3 p-3">
        {/* Grid layout for content and dashboard */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content Area (Left Column) */}
          <section className="flex flex-col gap-6 lg:col-span-2">
            {/* Index Page Content (No Card) */}
            <div className="mb-6">
              {rootPage ? (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-text-primary text-2xl font-bold">
                      {rootPage.title}
                    </h2>
                    <Link
                      href={`/index?edit=true`}
                      className="text-primary inline-flex items-center text-sm font-medium hover:underline"
                    >
                      Edit
                      <svg
                        className="ml-1 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </Link>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <Suspense fallback={<div>Loading content...</div>}>
                      <HighlightedContent
                        content={rootPage.content || ""}
                        renderedHtml={renderedHtml}
                      />
                    </Suspense>
                  </div>
                </>
              ) : (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
                  <h2 className="text-text-primary mb-4 text-xl font-semibold">
                    No Homepage Content Yet
                  </h2>
                  <p className="text-text-secondary mb-6">
                    Create an index page to display welcome information here.
                  </p>
                  <Link
                    href="/create?path=index"
                    className="bg-primary hover:bg-primary/90 focus:ring-primary/90 rounded-md px-4 py-2 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                  >
                    Create Homepage
                  </Link>
                </div>
              )}
            </div>

            {/* Wiki Browser Section (Removed) */}
            {/* 
            <div>
              <h2 className="mb-4 text-lg font-semibold text-text-primary">
                Browse Wiki
              </h2>
              <WikiBrowser />
            </div>
            */}
          </section>

          {/* Right Column: Dashboard Cards */}
          <section className="flex flex-col gap-3 self-start lg:sticky lg:top-2 lg:col-span-1">
            {/* Combined Dashboard Card */}
            <Card className="border-border-light dark:bg-background-paper bg-background-default">
              <CardContent className="p-2">
                {/* Recently Updated Section */}
                <CardTitle className="mb-1 text-lg font-semibold">
                  Recently Updated
                </CardTitle>
                <ul
                  className="space-y-0.5 pl-0"
                  style={{
                    listStyleType: "none",
                    paddingLeft: 0,
                    marginLeft: 0,
                  }}
                >
                  {recentPages.map((page) => (
                    <li
                      key={page.id}
                      style={{
                        paddingLeft: 0,
                        marginLeft: 0,
                        listStyleType: "none",
                        listStylePosition: "inside",
                      }}
                    >
                      <Link
                        href={`/${page.path}`}
                        className="dark:bg-background-level1 bg-background-paper hover:bg-accent/10 flex items-center justify-between rounded-md py-1 text-xs"
                      >
                        <span className="text-primary-600 dark:text-primary-400 ml-2 font-medium">
                          {page.title}
                        </span>
                        <span className="text-text-secondary mr-2 shrink-0">
                          {page.updatedAt
                            ? `${formatDistanceToNow(page.updatedAt, {
                                addSuffix: true,
                              })}`
                            : "No date"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {recentPages.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    No pages updated recently.
                  </p>
                )}
                <Link
                  href="/wiki"
                  className="text-primary mt-2 inline-block text-xs font-medium hover:underline"
                >
                  View All
                </Link>

                {/* Divider */}
                <hr className="border-border-light my-3" />

                {/* Wiki Features Section */}
                <CardTitle className="mb-2 text-lg font-semibold">
                  Wiki Features
                </CardTitle>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/wiki/getting-started"
                    className="text-primary hover:bg-accent/10 flex flex-col items-center rounded-md p-1.5 text-center text-xs"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mb-1 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Quick Start
                  </Link>
                  <Link
                    href="/create"
                    className="text-primary hover:bg-accent/10 flex flex-col items-center rounded-md p-1.5 text-center text-xs"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mb-1 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Create Page
                  </Link>
                  <Link
                    href="/tags"
                    className="text-primary hover:bg-accent/10 flex flex-col items-center rounded-md p-1.5 text-center text-xs"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mb-1 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    Browse Tags
                  </Link>
                  <Link
                    href="/profile"
                    className="text-primary hover:bg-accent/10 flex flex-col items-center rounded-md p-1.5 text-center text-xs"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mb-1 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Settings
                  </Link>
                </div>

                {/* Divider */}
                <hr className="border-border-light my-3" />

                {/* Compact Wiki Browser */}
                <CardTitle className="mb-2 text-lg font-semibold">
                  Quick Actions
                </CardTitle>
                <WikiFolderTree
                  showRoot={false}
                  hideHeader={true}
                  card={false}
                />
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
