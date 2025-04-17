/**
 * Server-side markdown rendering utility
 * Uses the same rendering pipeline as the client-side HighlightedMarkdown component
 */

// Use dynamic import for remark itself
// import { remark } from "remark";
import type { PluggableList } from "unified";
import { markdownPlugins as customRemarkPlugins } from "~/components/wiki/markdown/plugins";

/**
 * Renders Markdown content to HTML string
 *
 * @param content The markdown content to render
 * @returns Promise resolving to the rendered HTML string
 */
export async function renderMarkdownToHtml(content: string): Promise<string> {
  // Dynamically import necessary modules
  const [
    { remark }, // Dynamically import remark
    remarkGfm,
    remarkBreaks,
    remarkEmoji,
    remarkDirective,
    remarkDirectiveRehype,
    rehypeHighlight,
    rehypeStringify,
    remarkRehype,
  ] = await Promise.all([
    import("remark"), // Import remark
    import("remark-gfm").then((m) => m.default),
    import("remark-breaks").then((m) => m.default),
    import("remark-emoji").then((m) => m.default),
    import("remark-directive").then((m) => m.default),
    import("remark-directive-rehype").then((m) => m.default),
    import("rehype-highlight").then((m) => m.default),
    import("rehype-stringify").then((m) => m.default),
    import("remark-rehype").then((m) => m.default),
  ]);

  // Combine remark plugins
  const remarkPlugins: PluggableList = [
    remarkGfm,
    remarkBreaks,
    remarkEmoji,
    remarkDirective,
    remarkDirectiveRehype,
    ...customRemarkPlugins, // Add custom plugins
  ];

  // Combine rehype plugins
  const rehypePlugins: PluggableList = [rehypeHighlight];

  // Create the processing pipeline
  const processor = remark()
    .use(remarkPlugins)
    // Convert to rehype (HTML), allow dangerous HTML
    .use(remarkRehype, { allowDangerousHtml: true })
    // Add rehype plugins
    .use(rehypePlugins)
    // Convert to string
    .use(rehypeStringify);

  // Process the content
  const result = await processor.process(content);

  return result.toString();
}
