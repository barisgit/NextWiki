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
 * @returns Promise resolving to the rendered HTML string
 */
export async function renderMarkdownToHtml(content: string): Promise<string> {
  // Get all plugins including async server plugins
  const rehypePlugins =
    (await serverMarkdownConfig.getAsyncRehypePlugins?.()) ||
    serverMarkdownConfig.rehypePlugins;

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
