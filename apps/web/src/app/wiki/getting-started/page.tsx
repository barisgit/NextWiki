import Link from "next/link";
import { MainLayout } from "~/components/layout/MainLayout";
import { CodeBlock } from "@repo/ui";

export default function GettingStartedPage() {
  return (
    <MainLayout>
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold">Getting Started with NextWiki</h1>

        <section className="p-6 border rounded-lg shadow-lg bg-background-paper border-border-default">
          <h2 className="mb-4 text-xl font-semibold">Installation</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">1. Clone the repository</h3>
              <CodeBlock language="bash">
                git clone https://github.com/barisgit/nextwiki.git
              </CodeBlock>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">2. Install dependencies</h3>
              <CodeBlock language="bash">pnpm install</CodeBlock>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">3. Configure environment</h3>
              <CodeBlock language="bash">cp .env.example .env.local</CodeBlock>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">4. Database setup</h3>
              <CodeBlock language="bash" className="my-4">
                pnpm run db:generate
                <br />
                pnpm run db:migrate
                <br />
                pnpm run db:setup
              </CodeBlock>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">5. Start development server</h3>
              <CodeBlock language="bash">pnpm run dev</CodeBlock>
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
