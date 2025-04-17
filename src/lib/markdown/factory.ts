/**
 * Unified markdown processor factory
 * Ensures client and server renderers use identical configuration
 */

import type { Components } from "react-markdown";
import type { PluggableList } from "unified";
import {
  remarkPlugins,
  getRehypePlugins,
  baseRehypePlugins,
} from "./core/plugins";
import { markdownOptions } from "./core/config";
import { markdownComponents } from "./components";

export interface MarkdownProcessorOptions {
  /**
   * Remark plugins to use
   */
  remarkPlugins: PluggableList;

  /**
   * Rehype plugins to use
   */
  rehypePlugins: PluggableList;

  /**
   * Async function to get rehype plugins
   * Used for server-side plugins that need to be loaded dynamically
   */
  getAsyncRehypePlugins?: () => Promise<PluggableList>;

  /**
   * React components for client-side rendering
   */
  components?: Components;

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
 * Creates a standardized configuration for markdown processing
 * @param target Whether this is for "client" or "server" rendering
 * @returns Configuration object with all necessary options
 */
export function createMarkdownProcessor(
  target: "client" | "server"
): MarkdownProcessorOptions {
  return {
    remarkPlugins,
    // Always include base rehype plugins for immediate use
    rehypePlugins: baseRehypePlugins,
    // Provide async function to get full rehype plugins including server-only ones
    getAsyncRehypePlugins: () => getRehypePlugins(target),
    components: target === "client" ? markdownComponents : undefined,
    allowDangerousHtml: markdownOptions.allowHtml,
    breaks: markdownOptions.breaks,
    sanitizationLevel: markdownOptions.sanitizationLevel,
    enableEmojis: markdownOptions.enableEmojis,
  };
}
