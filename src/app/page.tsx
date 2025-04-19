import Link from "next/link";
import { MainLayout } from "~/components/layout/MainLayout";
import { dbService } from "~/lib/services";
import RegisterPage from "./register/page";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { WikiBrowser } from "~/components/wiki/WikiBrowser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { AllPagesList } from "~/components/wiki/AllPagesList";

export default async function Home() {
  // Server-side data fetching - using our centralized service
  const userCount = await dbService.users.count();
  const recentPages = await dbService.wiki.getRecentPages(7);

  const isFirstUser = userCount === 0;

  if (isFirstUser) {
    return RegisterPage();
  }

  return (
    <MainLayout>
      <div className="max-w-6xl p-6 px-4 mx-auto space-y-10">
        <section className="max-w-3xl mx-auto text-center">
          <h1 className="mb-4 text-4xl font-bold text-text-primary">
            Welcome to NextWiki
          </h1>
          <p className="mb-6 text-lg text-text-secondary">
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
          <div className="flex flex-col w-5/6 gap-4">
            <h2 className="text-lg font-semibold text-text-primary">
              Recent Pages
            </h2>
            <div className="overflow-hidden border rounded-lg shadow-sm border-border-light bg-background-paper">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-light bg-background-level1">
                    <th className="text-left py-3.5 px-5 text-sm font-semibold text-text-primary">
                      Page Title
                    </th>
                    <th className="text-left py-3.5 px-5 text-sm font-semibold text-text-primary">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentPages.map((page) => (
                    <tr
                      key={page.id}
                      className="transition-colors border-b border-border-default last:border-0 hover:bg-card-hover"
                    >
                      <td className="py-3.5 px-5">
                        <Link
                          href={page.path}
                          className="font-medium text-primary hover:underline"
                        >
                          {page.title}
                        </Link>
                      </td>
                      <td className="py-3.5 px-5 text-sm text-muted-foreground">
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
          <h2 className="mb-6 text-2xl font-semibold text-text-primary">
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
                  className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                >
                  Read the guide
                  <svg
                    className="w-4 h-4 ml-1"
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
                  className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                >
                  Create Page
                  <svg
                    className="w-4 h-4 ml-1"
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
                  className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                >
                  View all tags
                  <svg
                    className="w-4 h-4 ml-1"
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
                  className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                >
                  Go to settings
                  <svg
                    className="w-4 h-4 ml-1"
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
