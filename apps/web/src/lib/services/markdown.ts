/**
 * Markdown service for rendering and processing markdown content
 */

import { renderMarkdownToHtml as baseRenderMarkdownToHtml } from "~/lib/markdown";
import { db } from "~/lib/db";
import { wikiPages } from "~/lib/db/schema";
import { eq } from "drizzle-orm";
import { invalidatePageExistenceCache } from "~/lib/markdown/plugins/server-only/rehypeWikiLinks";
import { logger } from "~/lib/utils/logger";

/**
 * Renders markdown content to HTML with enhanced wiki features
 * - Checks for internal links and marks non-existent pages (via rehype plugin)
 * - Updates the database with the rendered HTML
 *
 * @param content Markdown content to render
 * @param pageId Optional ID of the page for updating the database
 * @param pagePath Optional path of the current page for link resolution
 * @returns The rendered HTML string
 */
export async function renderWikiMarkdownToHtml(
  content: string,
  pageId?: number,
  pagePath?: string
): Promise<string> {
  // Render the markdown content to HTML (the rehype plugin will process links automatically)
  // If pagePath is provided, strip any leading slash to match database paths format
  const normalizedPagePath = pagePath?.startsWith("/")
    ? pagePath.substring(1)
    : pagePath;
  const renderedHtml = await baseRenderMarkdownToHtml(
    content,
    normalizedPagePath
  );

  // If page ID is provided, update the database with the rendered HTML
  // We do not await this as it is not needed for the function to return
  if (pageId) {
    void db
      .update(wikiPages)
      .set({
        renderedHtml,
        renderedHtmlUpdatedAt: new Date(),
      })
      .where(eq(wikiPages.id, pageId))
      .catch((error) => {
        logger.error("Error updating rendered HTML for page", pageId, error);
      });
  }

  return renderedHtml;
}

/**
 * Updates all rendered HTML for all wiki pages in the database
 * Useful for refreshing after changes to rendering logic
 */
export async function rebuildAllRenderedHtml(): Promise<void> {
  // Invalidate the page existence cache for a full refresh
  invalidatePageExistenceCache();

  logger.log("Rebuilding all rendered HTML");

  const allPages = await db.query.wikiPages.findMany({
    columns: {
      id: true,
      content: true,
      path: true,
    },
  });

  logger.log("Found", allPages.length, "pages to rebuild");

  for (const page of allPages) {
    if (page.content) {
      logger.debug("Rebuilding rendered HTML for page", page.id);
      await renderWikiMarkdownToHtml(page.content, page.id, page.path);
    }
  }
}

/**
 * Hook to invalidate wiki link cache after page creation/update/deletion
 * Call this when pages are created/updated/deleted to ensure link status is updated
 */
export function invalidateWikiLinkCache(): void {
  invalidatePageExistenceCache();
}

export const markdownService = {
  renderWikiMarkdownToHtml,
  rebuildAllRenderedHtml,
  invalidateWikiLinkCache,
};
