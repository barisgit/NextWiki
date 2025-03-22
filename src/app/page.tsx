import Link from "next/link";
import { MainLayout } from "~/components/layout/MainLayout";
import { dbService } from "~/lib/services";
import RegisterPage from "./register/page";

export default async function Home() {
  // Server-side data fetching - using our centralized service
  const userCount = await dbService.users.count();
  const recentPages = await dbService.wiki.getRecentPages(3);

  const isFirstUser = userCount === 0;

  if (isFirstUser) {
    return RegisterPage();
  }

  return (
    <MainLayout>
      <div className="max-w-6xl px-4 py-6 mx-auto space-y-10">
        <section className="max-w-3xl mx-auto text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">
            Welcome to NextWiki
          </h1>
          <p className="mb-6 text-lg text-muted-foreground">
            An open-source wiki system built with Next.js, Drizzle ORM, tRPC,
            and NextAuth. Easily create, edit, and organize your knowledge base.
          </p>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Recently Updated Pages
            </h2>
            <Link
              href="/wiki"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all pages →
            </Link>
          </div>

          <div className="overflow-hidden border rounded-lg shadow-sm bg-background">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="text-left py-3.5 px-5 text-sm font-semibold text-foreground">
                    Page Title
                  </th>
                  <th className="text-left py-3.5 px-5 text-sm font-semibold text-foreground">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentPages.map((page) => (
                  <tr
                    key={page.id}
                    className="transition-colors border-b last:border-0 hover:bg-muted/50"
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
        </section>

        <section>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="p-6 transition-shadow border rounded-lg shadow-sm border-border bg-background hover:shadow-md">
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Quick Start
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                New to NextWiki? Get started with our quick guide.
              </p>
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
            </div>

            <div className="p-6 transition-shadow border rounded-lg shadow-sm border-border bg-background hover:shadow-md">
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Create Content
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Add new knowledge to your wiki and share with your team.
              </p>
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
            </div>

            <div className="p-6 transition-shadow border rounded-lg shadow-sm border-border bg-background hover:shadow-md">
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Browse Tags
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Explore content by tags to find related information.
              </p>
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
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
