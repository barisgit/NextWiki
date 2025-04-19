/**
 * Unified markdown processing library
 * Provides both server-side and client-side rendering with the same plugins
 */

// Export core configuration
export * from "./core/plugins";
export * from "./core/config";
export * from "./client-factory";

// Export renderers
export { HighlightedMarkdown, HighlightedContent } from "./client";
export { renderMarkdownToHtml } from "./server";

// Export components and utilities
export { markdownComponents } from "./components";
export { highlightTextInDOM, clearHighlightsFromDOM } from "./utils/highlight";
