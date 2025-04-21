/**
 * Rehype plugin for processing wiki links
 * Server-side only implementation that checks link existence and adds appropriate classes
 *
 * NOTE: This plugin can only be used in a server context - it requires database access.
 * It is dynamically imported via the server-only plugin loader in core/plugins.ts.
 */

import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Element, Root } from "hast";
import { db } from "~/lib/db";
import { wikiPages } from "~/lib/db/schema";
import { inArray } from "drizzle-orm";

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minute cache lifetime

// Time-based cache implementation
interface CacheEntry {
  value: boolean;
  timestamp: number;
}

// Cache of page existence to avoid repeated queries
const pageExistenceCache = new Map<string, CacheEntry>();

/**
 * Check if multiple pages exist in a single database query
 * @param paths Array of paths to check
 * @returns Map of path to existence boolean
 */
async function bulkCheckPagesExistence(
  paths: string[]
): Promise<Map<string, boolean>> {
  // If no paths, return empty map
  if (paths.length === 0) return new Map();

  // Query the database for all paths at once
  const existingPages = await db.query.wikiPages.findMany({
    where: inArray(
      wikiPages.path,
      paths.map((path) => (path.startsWith("/") ? path.slice(1) : path))
    ),
    columns: { path: true },
  });

  // Create a map of path -> exists
  const existingPathsSet = new Set(
    existingPages.map((page) => `/${page.path}`)
  );
  const result = new Map<string, boolean>();

  // Fill the result map with existence status
  for (const path of paths) {
    result.set(path, existingPathsSet.has(path));
  }

  return result;
}

/**
 * Checks if a wiki page exists in the database by its path
 * Uses caching to reduce database queries
 *
 * @param pathsToCheck Paths to check for existence
 * @returns Map of path to existence boolean
 */
async function checkPagesExistence(
  pathsToCheck: string[]
): Promise<Map<string, boolean>> {
  const now = Date.now();
  const result = new Map<string, boolean>();
  const pathsToQuery: string[] = [];

  // Check cache first and collect uncached or expired paths
  for (const path of pathsToCheck) {
    const cacheEntry = pageExistenceCache.get(path);

    if (cacheEntry && now - cacheEntry.timestamp < CACHE_TTL_MS) {
      // Cache hit and not expired
      result.set(path, cacheEntry.value);
    } else {
      // Cache miss or expired
      pathsToQuery.push(path);
    }
  }

  // If all paths were cached, return early
  if (pathsToQuery.length === 0) return result;

  // Query database for all uncached/expired paths
  const freshData = await bulkCheckPagesExistence(pathsToQuery);

  // Update cache and merge with cached results
  for (const [path, exists] of freshData.entries()) {
    // Update cache
    pageExistenceCache.set(path, {
      value: exists,
      timestamp: now,
    });

    // Add to result
    result.set(path, exists);
  }

  return result;
}

/**
 * Clear the page existence cache
 */
export function clearPageExistenceCache(): void {
  pageExistenceCache.clear();
}

export enum LinkType {
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "audio",
  PAGE = "page",
  DOCUMENT = "document",
  EXTERNAL = "external",
  ASSET = "asset",
}

/**
 * Allowed link extensions for each link type
 */
export const allowedLinkExtensions = {
  [LinkType.IMAGE]: ["png", "jpg", "jpeg", "gif", "svg", "webp"],
  [LinkType.VIDEO]: ["mp4", "webm", "mov", "avi", "mkv"],
  [LinkType.AUDIO]: ["mp3", "wav", "ogg", "m4a", "flac"],
  [LinkType.DOCUMENT]: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"],
};

/**
 * Get the type of a link based on its href
 * @param href The href of the link
 * @returns The type of the link
 */
export function getLinkType(href: string): LinkType {
  // Check for asset links first
  if (href.startsWith("/api/assets/")) {
    return LinkType.ASSET;
  }

  // If the link doesn't contain a dot (and isn't an asset link), it can't be an external link
  if (!href.includes(".")) {
    // Treat links without extensions and not starting with /api/assets/ as internal pages
    return LinkType.PAGE;
  }

  // Check for file extensions if it contains a dot but wasn't an asset link
  const extension = href.split(".").pop()?.toLowerCase();
  if (extension) {
    if (allowedLinkExtensions[LinkType.IMAGE].includes(extension)) {
      return LinkType.IMAGE;
    }
    if (allowedLinkExtensions[LinkType.AUDIO].includes(extension)) {
      return LinkType.AUDIO;
    }
    if (allowedLinkExtensions[LinkType.VIDEO].includes(extension)) {
      return LinkType.VIDEO;
    }
    if (allowedLinkExtensions[LinkType.DOCUMENT].includes(extension)) {
      return LinkType.DOCUMENT;
    }
  }

  // If it contains a dot but doesn't match known internal types, assume external
  // Or if it doesn't have an extension but contains a dot (e.g., domain name without path)
  // Only classify as external if it contains '://' or starts with '//' or 'www.'
  if (
    href.includes("://") ||
    href.startsWith("//") ||
    href.startsWith("www.")
  ) {
    return LinkType.EXTERNAL;
  }

  // Fallback for relative paths with dots but no recognized extension (treat as page)
  // Example: ../some/other/page
  return LinkType.PAGE;
}

/**
 * Render an internal link to a full format
 * @param href The href of the link
 * @param currentPage The current page
 * @returns The rendered link
 *
 * @example: link with href: path/to/page on page original/path -> /original/path/path/to/page
 * Note: See how links are stored without leading slash but we need to add it for the href to work from the root
 */
export function renderInternalLink(href: string, currentPage: string) {
  if (href.startsWith("/")) {
    return href;
  }

  // Special case for root page
  if (currentPage === "") {
    return `/${href}`;
  }

  const path = href.substring(1).replace(/\/+$/, "");
  return `/${currentPage}/${path}`;
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

  /**
   * Class to add to internal links
   * @default 'internal-link'
   */
  internalLinksClass?: string;

  /**
   * Class to add to asset links
   * @default 'asset-link'
   */
  assetLinkClass?: string;

  /**
   * Current page path for resolving relative links
   */
  currentPagePath?: string;
}

/**
 * Creates a rehype plugin to process wiki links
 * This is an async plugin that checks page existence in the database
 */
export const rehypeWikiLinks: Plugin<[RehypeWikiLinksOptions?], Root> = (
  options = {}
) => {
  const internalLinksClass = options.internalLinksClass || "internal-link";
  const existsClass = options.existsClass || "wiki-link-exists";
  const missingClass = options.missingClass || "wiki-link-missing";
  const assetLinkClass = options.assetLinkClass || "asset-link";
  const currentPagePath = options.currentPagePath || "";

  return async function transformer(tree: Root): Promise<void> {
    // Collect all wiki links
    const wikiLinks: Array<{
      node: Element;
      path: string;
    }> = [];
    const assetLinks: Element[] = [];

    // Find all internal links and asset links
    visit(tree, "element", (node: Element) => {
      if (
        node.tagName === "a" &&
        node.properties &&
        typeof node.properties.href === "string"
        // node.properties.href.startsWith("/")
      ) {
        const href = node.properties.href;
        const type = getLinkType(href);
        if (type === LinkType.PAGE) {
          const path = renderInternalLink(href, currentPagePath);
          wikiLinks.push({ node, path });
        } else if (type === LinkType.ASSET) {
          assetLinks.push(node);
        }
      }
    });

    // If no wiki links, return early
    if (wikiLinks.length === 0 && assetLinks.length === 0) return;

    // Get unique paths to check
    const uniquePaths = Array.from(new Set(wikiLinks.map((link) => link.path)));

    // Batch check all paths in a single query
    const existenceMap = await checkPagesExistence(uniquePaths);

    // Apply classes to all links
    for (const { node, path } of wikiLinks) {
      const exists = existenceMap.get(path) || false;

      // Add class to the node
      const className = `${internalLinksClass} ${
        exists ? existsClass : missingClass
      }`;
      if (!node.properties) node.properties = {};

      if (Array.isArray(node.properties.className)) {
        node.properties.className.push(className);
      } else if (typeof node.properties.className === "string") {
        node.properties.className = [node.properties.className, className];
      } else {
        node.properties.className = [className];
      }
    }

    // Apply class to all asset links
    for (const node of assetLinks) {
      if (!node.properties) node.properties = {};
      const className = assetLinkClass;
      if (Array.isArray(node.properties.className)) {
        node.properties.className.push(className);
      } else if (typeof node.properties.className === "string") {
        node.properties.className = [node.properties.className, className];
      } else {
        node.properties.className = [className];
      }
    }
  };
};

// Re-export the cache clearing function
export { clearPageExistenceCache as invalidatePageExistenceCache };

export default rehypeWikiLinks;
