import Link from "next/link";
import { MainLayout } from "~/components/layout/MainLayout";
import { dbService } from "~/lib/services";

export default async function TagsPage() {
  const tags = await dbService.tags.getAll();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tags</h1>
          <p className="mt-1 text-muted-foreground">
            Browse wiki pages by tags.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-6 sm:grid-cols-2 md:grid-cols-3">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.name}`}
              className="block p-4 transition-colors border rounded-lg hover:border-primary hover:bg-muted/50"
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
