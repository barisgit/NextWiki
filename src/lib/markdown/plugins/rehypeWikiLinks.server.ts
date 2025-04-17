/**
 * Rehype plugin for processing wiki links
 * Server-side only implementation that checks link existence and adds appropriate classes
 */

import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Element } from "hast";
import { db } from "~/lib/db";
import { wikiPages } from "~/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Checks if a wiki page exists in the database by its path
 * @param path Path of the page to check
 * @returns Boolean indicating if the page exists
 */
async function doesPageExist(path: string): Promise<boolean> {
  const page = await db.query.wikiPages.findFirst({
    where: eq(wikiPages.path, path),
    columns: { id: true },
  });

  return !!page;
}

/**
 * Plugin options
 */
export interface RehypeWikiLinksOptions {
  /**
   * Class to add to links that point to existing pages
   * @default 'wiki-link-exists'
   */
  existsClass?: string;

  /**
   * Class to add to links that point to non-existing pages
   * @default 'wiki-link-missing'
   */
  missingClass?: string;
}

/**
 * Creates a rehype plugin to process wiki links
 * This is an async plugin that checks page existence in the database
 */
export const rehypeWikiLinks: Plugin<[RehypeWikiLinksOptions?], any> = (
  options = {}
) => {
  const existsClass = options.existsClass || "wiki-link-exists";
  const missingClass = options.missingClass || "wiki-link-missing";

  return async function transformer(tree: any): Promise<void> {
    // Collect all wiki links
    const wikiLinks: Array<{
      node: Element;
      path: string;
    }> = [];

    // Find all internal links
    visit(tree, "element", (node: Element) => {
      if (
        node.tagName === "a" &&
        node.properties &&
        typeof node.properties.href === "string" &&
        node.properties.href.startsWith("/")
      ) {
        const href = node.properties.href;
        // Remove leading slash and remove any trailing slashes
        const path = href.substring(1).replace(/\/+$/, "");
        wikiLinks.push({ node, path });
      }
    });

    // Process all links in parallel
    await Promise.all(
      wikiLinks.map(async ({ node, path }) => {
        const exists = await doesPageExist(path);

        // Add class to the node
        const className = exists ? existsClass : missingClass;
        if (!node.properties) node.properties = {};

        if (Array.isArray(node.properties.className)) {
          node.properties.className.push(className);
        } else if (typeof node.properties.className === "string") {
          node.properties.className = [node.properties.className, className];
        } else {
          node.properties.className = [className];
        }
      })
    );
  };
};

// Add export here to ensure it's properly accessible
export default rehypeWikiLinks;
