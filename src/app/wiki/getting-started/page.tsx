import Link from "next/link";
import { MainLayout } from "~/components/layout/MainLayout";

export default function GettingStartedPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Getting Started with NextWiki</h1>

        <section className="p-6 border rounded-lg bg-background-default border-border">
          <h2 className="mb-4 text-xl font-semibold">Installation</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">1. Clone the repository</h3>
              <pre className="p-4 rounded bg-muted text-muted-foreground">
                <code>
                  git clone https://github.com/yourusername/nextwiki.git
                </code>
              </pre>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">2. Install dependencies</h3>
              <pre className="p-4 rounded bg-muted text-muted-foreground">
                <code>npm install</code>
              </pre>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">3. Configure environment</h3>
              <pre className="p-4 rounded bg-muted text-muted-foreground">
                <code>cp .env.example .env.local</code>
              </pre>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">4. Database setup</h3>
              <pre className="p-4 rounded bg-muted text-muted-foreground">
                <code>
                  pnpm run db:generate
                  <br />
                  pnpm run db:migrate
                  <br />
                  pnpm run db:setup
                </code>
              </pre>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">5. Start development server</h3>
              <pre className="p-4 rounded bg-muted text-muted-foreground">
                <code>pnpm run dev</code>
              </pre>
            </div>
          </div>
        </section>

        <div className="mt-6">
          <Link
            href="/wiki"
            className="font-medium text-primary hover:underline"
          >
            ← Back to Wiki Pages
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
