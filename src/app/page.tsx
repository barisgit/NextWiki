import { MainLayout } from "~/components/layout/MainLayout";

export default function Home() {
  // This would be fetched from your API in a real implementation
  const recentPages = [
    {
      id: 1,
      title: "Getting Started",
      path: "/wiki/getting-started",
      updatedAt: "2 hours ago",
    },
    {
      id: 2,
      title: "API Documentation",
      path: "/wiki/api-documentation",
      updatedAt: "1 day ago",
    },
    {
      id: 3,
      title: "Installation Guide",
      path: "/wiki/installation",
      updatedAt: "3 days ago",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-10 max-w-6xl mx-auto">
        <section>
          <h1 className="text-4xl font-bold mb-3 text-foreground">
            Welcome to NextWiki
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            An open-source wiki system built with Next.js, Drizzle ORM, tRPC,
            and NextAuth. Easily create, edit, and organize your knowledge base.
          </p>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Recently Updated Pages
            </h2>
            <a
              href="/wiki"
              className="text-sm text-primary hover:underline font-medium"
            >
              View all pages →
            </a>
          </div>

          <div className="border rounded-lg overflow-hidden shadow-sm bg-background">
            <table className="w-full">
              <thead>
                <tr className="bg-muted border-b">
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
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <a
                        href={page.path}
                        className="text-primary font-medium hover:underline"
                      >
                        {page.title}
                      </a>
                    </td>
                    <td className="py-3.5 px-5 text-sm text-muted-foreground">
                      {page.updatedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-border rounded-lg p-6 shadow-sm bg-background hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg mb-2 text-foreground">
                Quick Start
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                New to NextWiki? Get started with our quick guide.
              </p>
              <a
                href="/wiki/getting-started"
                className="text-sm text-primary font-medium hover:underline inline-flex items-center"
              >
                Read the guide
                <svg
                  className="ml-1 w-4 h-4"
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
              </a>
            </div>

            <div className="border border-border rounded-lg p-6 shadow-sm bg-background hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg mb-2 text-foreground">
                Create Content
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add new knowledge to your wiki and share with your team.
              </p>
              <a
                href="/wiki/create"
                className="text-sm text-primary font-medium hover:underline inline-flex items-center"
              >
                Create a page
                <svg
                  className="ml-1 w-4 h-4"
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
              </a>
            </div>

            <div className="border border-border rounded-lg p-6 shadow-sm bg-background hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg mb-2 text-foreground">
                Browse Tags
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Explore content by tags to find related information.
              </p>
              <a
                href="/tags"
                className="text-sm text-primary font-medium hover:underline inline-flex items-center"
              >
                View all tags
                <svg
                  className="ml-1 w-4 h-4"
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
              </a>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
