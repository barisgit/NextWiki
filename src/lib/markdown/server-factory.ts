/**
 * Server-only markdown processor factory
 * This file can import server-only modules and plugins
 */

import type { PluggableList } from "unified";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkEmoji from "remark-emoji";
import remarkDirective from "remark-directive";
import remarkDirectiveRehype from "remark-directive-rehype";
import rehypeHighlight from "rehype-highlight";
import { customPlugins } from "./plugins";
import { markdownOptions } from "./core/config";

/**
 * Remark plugins for server-side use
 */
export const serverRemarkPlugins: PluggableList = [
  remarkGfm,
  remarkBreaks,
  remarkEmoji,
  remarkDirective,
  remarkDirectiveRehype,
  ...customPlugins,
];

/**
 * Base rehype plugins for server-side use
 */
export const baseRehypePlugins: PluggableList = [
  rehypeHighlight,
  // Add other base rehype plugins here
];

export interface ServerMarkdownProcessorOptions {
  /**
   * Remark plugins to use
   */
  remarkPlugins: PluggableList;

  /**
   * Rehype plugins to use
   */
  rehypePlugins: PluggableList;

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
 * Load server-only rehype plugins
 * These might depend on database access or other server features
 */
export async function loadServerRehypePlugins(): Promise<PluggableList> {
  try {
    // Pre-defined list of server-only plugins to import
    const serverPlugins: PluggableList = [];

    // Dynamic imports using Promise.all
    const plugins = await Promise.all([
      import("./plugins/server-only/rehypeWikiLinks")
        .then((m) => m.default)
        .catch(() => null),
      import("./plugins/server-only/loggerPlugin")
        .then((m) => m.default)
        .catch(() => null),
      // Add additional server-only plugins here as they are created
    ]);

    // Add loaded plugins to the list
    for (const plugin of plugins) {
      if (plugin) {
        serverPlugins.push(plugin);
      }
    }

    return serverPlugins;
  } catch (error) {
    console.error("Failed to load server-only plugins:", error);
    return [];
  }
}

/**
 * Creates a server-side markdown processor configuration
 * @returns Configuration object with server plugins
 */
export async function createServerMarkdownProcessor(): Promise<ServerMarkdownProcessorOptions> {
  // Load server-only plugins
  const serverPlugins = await loadServerRehypePlugins();

  return {
    remarkPlugins: serverRemarkPlugins,
    rehypePlugins: [...baseRehypePlugins, ...serverPlugins],
    allowDangerousHtml: markdownOptions.allowHtml,
    breaks: markdownOptions.breaks,
    sanitizationLevel: markdownOptions.sanitizationLevel,
    enableEmojis: markdownOptions.enableEmojis,
  };
}
