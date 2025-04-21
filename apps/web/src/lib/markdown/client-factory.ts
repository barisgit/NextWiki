/**
 * Client-only markdown processor factory
 * This file is specifically for client-side use and avoids any server-only imports
 */

import type { Components } from "react-markdown";
import type { PluggableList } from "unified";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkEmoji from "remark-emoji";
import remarkDirective from "remark-directive";
import remarkDirectiveRehype from "remark-directive-rehype";
import rehypeHighlight from "rehype-highlight";
import { customPlugins } from "./plugins";
import { markdownOptions } from "./core/config";
import { markdownComponents } from "./components";

/**
 * Remark plugins safe for client-side use
 */
export const clientRemarkPlugins: PluggableList = [
  remarkGfm,
  remarkBreaks,
  remarkEmoji,
  remarkDirective,
  remarkDirectiveRehype,
  ...customPlugins,
];

/**
 * Rehype plugins safe for client-side use
 */
export const clientRehypePlugins: PluggableList = [
  rehypeHighlight,
  // Add other client-safe rehype plugins here
];

export interface ClientMarkdownProcessorOptions {
  /**
   * Remark plugins to use
   */
  remarkPlugins: PluggableList;

  /**
   * Rehype plugins to use
   */
  rehypePlugins: PluggableList;

  /**
   * React components for client-side rendering
   */
  components: Components;

  /**
   * Whether to allow HTML in markdown
   */
  allowDangerousHtml: boolean;

  /**
   * Whether to use breaks
   */
  breaks: boolean;

  /**
   * Sanitization level
   */
  sanitizationLevel: "permissive" | "standard" | "strict";

  /**
   * Whether emoji shortcodes are enabled
   */
  enableEmojis: boolean;
}

/**
 * Creates a client-side only markdown processor configuration
 * @returns Configuration object with client-safe options
 */
export function createClientMarkdownProcessor(): ClientMarkdownProcessorOptions {
  return {
    remarkPlugins: clientRemarkPlugins,
    rehypePlugins: clientRehypePlugins,
    components: markdownComponents,
    allowDangerousHtml: markdownOptions.allowHtml,
    breaks: markdownOptions.breaks,
    sanitizationLevel: markdownOptions.sanitizationLevel,
    enableEmojis: markdownOptions.enableEmojis,
  };
}
