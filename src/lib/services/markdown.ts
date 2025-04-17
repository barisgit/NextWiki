/**
 * Markdown service for rendering and processing markdown content
 */

import { renderMarkdownToHtml as baseRenderMarkdownToHtml } from "~/lib/markdown";
import { db } from "~/lib/db";
import { wikiPages } from "~/lib/db/schema";
import { eq } from "drizzle-orm";

// Regular expression to find wiki links in markdown for pre-caching
const INTERNAL_LINK_REGEX = /\[([^\]]+)\]\(\/([^)]+)\)/g;

/**
 * Extract all internal link paths from markdown content
 *
 * @param content Markdown content to extract links from
 * @returns Array of link paths
 */
function extractInternalLinkPaths(content: string): string[] {
  const matches = Array.from(content.matchAll(INTERNAL_LINK_REGEX));
  return matches.map((match) => {
    const pagePath = match[2];
    // Remove leading slash if present
    return pagePath.startsWith("/") ? pagePath.substring(1) : pagePath;
  });
}

/**
 * Renders markdown content to HTML with enhanced wiki features
 * - Checks for internal links and marks non-existent pages (via rehype plugin)
 * - Updates the database with the rendered HTML
 *
 * @param content Markdown content to render
 * @param pageId Optional ID of the page for updating the database
 * @returns The rendered HTML string
 */
export async function renderWikiMarkdownToHtml(
  content: string,
  pageId?: number
): Promise<string> {
  // Render the markdown content to HTML (the rehype plugin will process links automatically)
  const renderedHtml = await baseRenderMarkdownToHtml(content);

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
        console.error("Error updating rendered HTML for page", pageId, error);
      });
  }

  return renderedHtml;
}

/**
 * Updates all rendered HTML for all wiki pages in the database
 * Useful for refreshing after changes to rendering logic
 */
export async function rebuildAllRenderedHtml(): Promise<void> {
  const allPages = await db.query.wikiPages.findMany({
    columns: {
      id: true,
      content: true,
    },
  });

  for (const page of allPages) {
    if (page.content) {
      console.log("Rebuilding rendered HTML for page", page.id);
      await renderWikiMarkdownToHtml(page.content, page.id);
    }
  }
}

export const markdownService = {
  renderWikiMarkdownToHtml,
  rebuildAllRenderedHtml,
};
