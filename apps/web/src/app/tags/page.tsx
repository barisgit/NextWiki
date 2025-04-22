import Link from "next/link";
import { MainLayout } from "~/components/layout/MainLayout";
import { dbService } from "~/lib/services";

export default async function TagsPage() {
  const tags = await dbService.tags.getAll();

  return (
    <MainLayout>
      <div className="space-y-6 p-4">
        <div>
          <h1 className="text-2xl font-bold">Tags</h1>
          <p className="text-muted-foreground mt-1">
            Browse wiki pages by tags.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.name}`}
              className="hover:border-primary hover:bg-muted/50 block rounded-lg border p-4 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">{tag.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
