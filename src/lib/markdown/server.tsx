/**
 * Server-side markdown rendering utility
 * Uses the same rendering pipeline as the client-side HighlightedMarkdown component
 */

import { unified } from "unified";
import remarkParse from "remark-parse";
import rehypeStringify from "rehype-stringify";
import remarkRehype from "remark-rehype";
import rehypeWikiLinks from "./plugins/rehypeWikiLinks.server";
import { createMarkdownProcessor } from "./factory";

// Get server-side markdown configuration
const serverMarkdownConfig = createMarkdownProcessor("server");

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
  // Get all plugins including async server plugins
  let rehypePlugins =
    (await serverMarkdownConfig.getAsyncRehypePlugins?.()) ||
    serverMarkdownConfig.rehypePlugins;

  // If we have a page path and rehypeWikiLinks plugin exists, configure it
  if (pagePath) {
    // Load the rehypeWikiLinks module dynamically
    const rehypeWikiLinksModule = await import(
      "./plugins/rehypeWikiLinks.server"
    );
    // Replace the default plugin with one that has the pagePath configured
    rehypePlugins = rehypePlugins.filter(
      (plugin) => plugin !== rehypeWikiLinksModule.default
    );
    // Add the configured plugin
    rehypePlugins.push([
      rehypeWikiLinksModule.default,
      { currentPagePath: pagePath },
    ]);
  }

  // Create the processing pipeline
  const processor = unified()
    .use(remarkParse)
    .use(serverMarkdownConfig.remarkPlugins)
    // Convert to rehype (HTML), allow dangerous HTML
    .use(remarkRehype, {
      allowDangerousHtml: serverMarkdownConfig.allowDangerousHtml,
    })
    // Add rehype plugins
    .use(rehypePlugins)
    // Convert to string
    .use(rehypeStringify, {
      allowDangerousHtml: serverMarkdownConfig.allowDangerousHtml,
    });

  // Process the content asynchronously
  const file = await processor.process(content);
  return String(file);
}
