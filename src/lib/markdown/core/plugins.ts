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

// Import custom plugins
import { customPlugins } from "../plugins";

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
 * Rehype plugins to be applied during HTML processing
 */
export const rehypePlugins: PluggableList = [rehypeHighlight];
