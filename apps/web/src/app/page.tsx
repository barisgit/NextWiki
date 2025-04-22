import Link from "next/link";
import { MainLayout } from "~/components/layout/MainLayout";
import { dbService } from "~/lib/services";
import RegisterPage from "./(auth)/register/page";
import { Card, CardContent, CardTitle, CardDescription } from "@repo/ui";
import { WikiBrowser } from "~/components/wiki/WikiBrowser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
import { AllPagesList } from "~/components/wiki/AllPagesList";

export default async function Home() {
  // Server-side data fetching - using our centralized service
  const userCount = await dbService.users.count();
  const recentPages = await dbService.wiki.getRecentPages(7);

  const isFirstUser = userCount === 0;

  if (isFirstUser) {
    return RegisterPage({});
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl space-y-10 p-6 px-4">
        <section className="mx-auto max-w-3xl text-center">
          <h1 className="text-text-primary mb-4 text-4xl font-bold">
            Welcome to NextWiki
          </h1>
          <p className="text-text-secondary mb-6 text-lg">
            An open-source wiki system built with Next.js, Drizzle ORM, tRPC,
            and NextAuth. Easily create, edit, and organize your knowledge base.
          </p>
        </section>

        {/* Wiki Browser and Recent Pages Tabs */}
        <section className="flex flex-row gap-4">
          <Tabs defaultValue="browser" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="browser">Wiki Browser</TabsTrigger>
              <TabsTrigger value="all">All Pages</TabsTrigger>
            </TabsList>

            <TabsContent value="browser">
              <WikiBrowser />
            </TabsContent>

            <TabsContent value="all">
              <AllPagesList />
            </TabsContent>
          </Tabs>

          {/* Recent Pages Table */}
          <div className="flex w-5/6 flex-col gap-4">
            <h2 className="text-text-primary text-lg font-semibold">
              Recent Pages
            </h2>
            <div className="border-border-light bg-background-paper overflow-hidden rounded-lg border shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-border-light bg-background-level1 border-b">
                    <th className="text-text-primary px-5 py-3.5 text-left text-sm font-semibold">
                      Page Title
                    </th>
                    <th className="text-text-primary px-5 py-3.5 text-left text-sm font-semibold">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentPages.map((page) => (
                    <tr
                      key={page.id}
                      className="border-border-default hover:bg-card-hover border-b transition-colors last:border-0"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={page.path}
                          className="text-primary font-medium hover:underline"
                        >
                          {page.title}
                        </Link>
                      </td>
                      <td className="text-muted-foreground px-5 py-3.5 text-sm">
                        {page.updatedAt?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section>
          <h2 className="text-text-primary mb-6 text-2xl font-semibold">
            Wiki Features
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <Card hover className="border-border-light">
              <CardContent className="p-6">
                <CardTitle className="mb-2">Quick Start</CardTitle>
                <CardDescription className="mb-4">
                  New to NextWiki? Get started with our quick guide.
                </CardDescription>
                <Link
                  href="/wiki/getting-started"
                  className="text-primary inline-flex items-center text-sm font-medium hover:underline"
                >
                  Read the guide
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
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </Link>
              </CardContent>
            </Card>

            <Card hover className="border-border-light">
              <CardContent className="p-6">
                <CardTitle className="mb-2">Create Content</CardTitle>
                <CardDescription className="mb-4">
                  Add new knowledge to your wiki and share with your team.
                </CardDescription>
                <Link
                  href="/create"
                  className="text-primary inline-flex items-center text-sm font-medium hover:underline"
                >
                  Create Page
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
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </Link>
              </CardContent>
            </Card>

            <Card hover className="border-border-light">
              <CardContent className="p-6">
                <CardTitle className="mb-2">Browse Tags</CardTitle>
                <CardDescription className="mb-4">
                  Explore content by tags to find related information.
                </CardDescription>
                <Link
                  href="/tags"
                  className="text-primary inline-flex items-center text-sm font-medium hover:underline"
                >
                  View all tags
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
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </Link>
              </CardContent>
            </Card>

            <Card hover className="border-border-light">
              <CardContent className="p-6">
                <CardTitle className="mb-2">User Settings</CardTitle>
                <CardDescription className="mb-4">
                  Customize your experience and manage account preferences.
                </CardDescription>
                <Link
                  href="/settings"
                  className="text-primary inline-flex items-center text-sm font-medium hover:underline"
                >
                  Go to settings
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
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
