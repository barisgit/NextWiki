/**
 * Example server-only plugin that logs when content is processed
 * This demonstrates how server-only plugins are automatically loaded
 */

import { visit } from "unist-util-visit";
import type { Plugin } from "unified";

interface LoggerPluginOptions {
  /**
   * Log level to use
   * @default 'info'
   */
  level?: "info" | "debug" | "warn";

  /**
   * Whether to log detailed statistics
   * @default false
   */
  detailed?: boolean;
}

/**
 * Server-only plugin that logs information about processed markdown
 */
const loggerPlugin: Plugin<[LoggerPluginOptions?], undefined> = (
  options = {}
) => {
  const { level = "info", detailed = false } = options;

  return (tree) => {
    // Count different node types
    const counts: Record<string, number> = {};

    visit(tree, (node) => {
      if (!node.type) return;
      counts[node.type] = (counts[node.type] || 0) + 1;
    });

    // Log the results
    const logMethod =
      level === "warn"
        ? console.warn
        : level === "debug"
        ? console.debug
        : console.info;

    const totalNodes = Object.values(counts).reduce(
      (sum, count) => sum + count,
      0
    );

    logMethod(`[Server Markdown] Processed document with ${totalNodes} nodes`);

    if (detailed) {
      logMethod("[Server Markdown] Node type breakdown:", counts);
    }
  };
};

export default loggerPlugin;
