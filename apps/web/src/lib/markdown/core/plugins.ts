/**
 * Central configuration for all markdown plugins used in the application
 * This is the single source of truth for both client-side and server-side rendering
 */

import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkEmoji from "remark-emoji";
import remarkDirective from "remark-directive";
import remarkDirectiveRehype from "remark-directive-rehype";
import rehypeHighlight from "rehype-highlight";
import type { PluggableList } from "unified";
import { logger } from "~/lib/utils/logger";

// Import custom plugins
import { customPlugins } from "../plugins";

// Conditional server imports - only load if not in browser
const isServer = typeof window === "undefined";

/**
 * Remark plugins to be applied during markdown processing
 */
export const remarkPlugins: PluggableList = [
  remarkGfm,
  remarkBreaks,
  remarkEmoji,
  remarkDirective,
  remarkDirectiveRehype,
  ...customPlugins,
];

/**
 * Try to load a plugin from a given path
 * @param importedPlugin - The imported plugin to try to load
 * @returns The loaded plugin or null if it fails
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function tryLoadPlugin(importedPlugin: Promise<any>) {
  if (!isServer) return [];

  try {
    const pluginModule = await importedPlugin;
    if (pluginModule.default) {
      return pluginModule.default;
    }
    return null;
  } catch (error) {
    logger.error(`Failed to load plugin from ${importedPlugin}:`, error);
    return null;
  }
}

/**
 * Dynamically load all server-only rehype plugins
 * This automatically imports all plugins from the server-only directory
 */
export async function loadServerRehypePlugins(): Promise<PluggableList> {
  if (!isServer) return [];

  try {
    // Pre-defined list of server-only plugins to import
    // This avoids using fs which is not available in Next.js client bundles
    const serverPlugins: PluggableList = [];
    const plugins = await Promise.all([
      tryLoadPlugin(import("../plugins/server-only/rehypeWikiLinks")),
      tryLoadPlugin(import("../plugins/server-only/loggerPlugin")),
      // Add additional server-only plugins here as they are created
    ]);

    for (const plugin of plugins) {
      if (plugin) {
        serverPlugins.push(plugin);
      }
    }

    return serverPlugins;
  } catch (error) {
    logger.error("Failed to load server-only plugins:", error);
    return [];
  }
}

/**
 * Rehype plugins to be applied during HTML processing
 * Basic plugins that work in both client and server
 */
export const baseRehypePlugins: PluggableList = [rehypeHighlight];

/**
 * Get rehype plugins for the target environment
 * For server, this will dynamically load additional plugins
 *
 * @param target Whether this is for "client" or "server" rendering
 */
export async function getRehypePlugins(
  target: "client" | "server"
): Promise<PluggableList> {
  // Always include base plugins
  const plugins = [...baseRehypePlugins];

  // Add server-only plugins when on the server
  if (target === "server" && isServer) {
    const serverPlugins = await loadServerRehypePlugins();
    plugins.push(...serverPlugins);
  }

  return plugins;
}
