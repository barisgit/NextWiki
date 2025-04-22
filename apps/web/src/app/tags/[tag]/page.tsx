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

  // Extract the actual page data from the relations
  // Need to ensure the shape matches WikiPageListItem (dates might need conversion if inconsistent)
  const pagesToDisplay =
    filteredPages?.pages
      .map((relation) => relation.page)
      .filter(Boolean) // Filter out any potentially null pages
      .map((page) => ({
        ...page,
        // Convert Date objects to ISO strings to match the expected type
        createdAt: page.createdAt?.toISOString() || null,
        updatedAt: page.updatedAt?.toISOString() || null,
        lockedAt: page.lockedAt?.toISOString() || null, // Add conversion for lockedAt
        lockExpiresAt: page.lockExpiresAt?.toISOString() || null, // Add conversion for lockExpiresAt
        // Convert dates within the nested tags array
        tags:
          page.tags?.map((tagRelation) => ({
            ...tagRelation,
            tag: {
              ...tagRelation.tag,
              createdAt: tagRelation.tag.createdAt?.toISOString() || null,
            },
          })) || [],
      })) || [];

  return (
    <MainLayout>
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center text-2xl font-bold">
              Pages tagged:
              <span className="bg-muted ml-2 rounded-full px-3 py-1 text-sm">
                {tag}
              </span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Found {filteredPages?.pages.length}{" "}
              {filteredPages?.pages.length === 1 ? "page" : "pages"} with this
              tag.
            </p>
          </div>
        </div>

        <WikiPageList pages={pagesToDisplay} isLoading={false} />
      </div>
    </MainLayout>
  );
}
