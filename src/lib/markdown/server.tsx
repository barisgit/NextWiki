/**
 * Server-side markdown rendering utility
 * Uses the same rendering pipeline as the client-side HighlightedMarkdown component
 */

import { remark } from "remark";
import rehypeStringify from "rehype-stringify";
import remarkRehype from "remark-rehype";
import { createMarkdownProcessor } from "./factory";

// Get server-side markdown configuration
const serverMarkdownConfig = createMarkdownProcessor("server");

/**
 * Renders Markdown content to HTML string for server-side rendering
 *
 * @param content The markdown content to render
 * @returns The rendered HTML string
 */
export function renderMarkdownToHtml(content: string): string {
  // Create the processing pipeline
  const processor = remark()
    .use(serverMarkdownConfig.remarkPlugins)
    // Convert to rehype (HTML), allow dangerous HTML
    .use(remarkRehype, {
      allowDangerousHtml: serverMarkdownConfig.allowDangerousHtml,
    })
    // Add rehype plugins
    .use(serverMarkdownConfig.rehypePlugins)
    // Convert to string
    .use(rehypeStringify, {
      allowDangerousHtml: serverMarkdownConfig.allowDangerousHtml,
    });

  // Process the content synchronously
  const result = processor.processSync(content);

  return result.toString();
}
