/**
 * Server-side markdown rendering utility
 * Uses the same rendering pipeline as the client-side HighlightedMarkdown component
 */

// Static imports
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkEmoji from "remark-emoji";
import remarkDirective from "remark-directive";
import remarkDirectiveRehype from "remark-directive-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import remarkRehype from "remark-rehype";
import type { PluggableList } from "unified";
import { markdownPlugins as customRemarkPlugins } from "~/components/wiki/markdown/plugins";

// Define plugin arrays directly
const remarkPlugins: PluggableList = [
  remarkGfm,
  remarkBreaks,
  remarkEmoji,
  remarkDirective,
  remarkDirectiveRehype,
  ...customRemarkPlugins, // Add custom plugins
];

const rehypePlugins: PluggableList = [rehypeHighlight];

/**
 * Renders Markdown content to HTML string
 *
 * @param content The markdown content to render
 * @returns The rendered HTML string
 */
// Make function synchronous
export function renderMarkdownToHtml(content: string): string {
  // Create the processing pipeline
  const processor = remark()
    .use(remarkPlugins)
    // Convert to rehype (HTML), allow dangerous HTML
    .use(remarkRehype, { allowDangerousHtml: true })
    // Add rehype plugins
    .use(rehypePlugins)
    // Convert to string
    .use(rehypeStringify);

  // Process the content synchronously
  const result = processor.processSync(content);

  return result.toString();
}
