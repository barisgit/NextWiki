import { MainLayout } from "~/components/layout/MainLayout";
import { WikiPageList } from "~/components/wiki/WikiPageList";
import { dbService } from "~/lib/services";

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const resolvedParams = await params;
  const { tag } = resolvedParams;

  const filteredPages = await dbService.tags.getPagesByTagName(tag);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center text-2xl font-bold">
              Pages tagged:
              <span className="px-3 py-1 ml-2 text-sm rounded-full bg-muted">
                {tag}
              </span>
            </h1>
            <p className="mt-1 text-muted-foreground">
              Found {filteredPages?.pages.length}{" "}
              {filteredPages?.pages.length === 1 ? "page" : "pages"} with this
              tag.
            </p>
          </div>
        </div>

        <WikiPageList />
      </div>
    </MainLayout>
  );
}
