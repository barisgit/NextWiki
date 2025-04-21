/**
 * Server-side markdown rendering utility
 * Uses the same rendering pipeline as the client-side HighlightedMarkdown component
 */

import { unified } from "unified";
import remarkParse from "remark-parse";
import rehypeStringify from "rehype-stringify";
import remarkRehype from "remark-rehype";
import { createServerMarkdownProcessor } from "./server-factory";
import { logger } from "~/lib/utils/logger";

/**
 * Renders Markdown content to HTML string for server-side rendering
 *
 * @param content The markdown content to render
 * @param pagePath The path of the page to render the markdown for
 * @returns Promise resolving to the rendered HTML string
 */
export async function renderMarkdownToHtml(
  content: string,
  pagePath?: string
): Promise<string> {
  // Await the server configuration first
  const serverConfig = await createServerMarkdownProcessor();

  // Access the already loaded plugins from the resolved config
  let rehypePlugins = serverConfig.rehypePlugins;

  // If we have a page path, configure any wiki link plugins with the path
  if (pagePath) {
    try {
      // Try to load the rehypeWikiLinks module dynamically
      const rehypeWikiLinksModule = await import(
        "./plugins/server-only/rehypeWikiLinks"
      ).catch((e) => {
        logger.error("Failed to import rehypeWikiLinks:", e);
        return { default: null };
      });

      if (rehypeWikiLinksModule.default) {
        // Replace any existing wiki links plugin with configured version
        rehypePlugins = rehypePlugins.map((plugin) => {
          // Skip non-array items and plugins that aren't wikilinks
          if (
            !Array.isArray(plugin) &&
            plugin === rehypeWikiLinksModule.default
          ) {
            // Replace with configured version
            return [
              rehypeWikiLinksModule.default,
              { currentPagePath: pagePath },
            ];
          }
          // Also check array plugins
          if (
            Array.isArray(plugin) &&
            plugin[0] === rehypeWikiLinksModule.default
          ) {
            // Merge existing options with the page path
            return [
              rehypeWikiLinksModule.default,
              { ...(plugin[1] || {}), currentPagePath: pagePath },
            ];
          }
          return plugin;
        });
      }
    } catch (error) {
      logger.error("Failed to load rehypeWikiLinks plugin:", error);
    }
  }

  // Create the processing pipeline
  const processor = unified()
    .use(remarkParse)
    .use(serverConfig.remarkPlugins)
    // Convert to rehype (HTML), allow dangerous HTML
    .use(remarkRehype, {
      allowDangerousHtml: serverConfig.allowDangerousHtml,
    })
    // Add rehype plugins
    .use(rehypePlugins)
    // Convert to string
    .use(rehypeStringify, {
      allowDangerousHtml: serverConfig.allowDangerousHtml,
    });

  // Process the content asynchronously
  const file = await processor.process(content);
  return String(file);
}
