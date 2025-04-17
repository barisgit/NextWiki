import { userService } from "./users";
import { wikiService } from "./wiki";
import { tagService } from "./tags";
import { searchService } from "./search";
import { lockService } from "./locks";
import { assetService } from "./assets";
import { permissionService } from "./permissions";
import { groupService } from "./groups";
import { authorizationService } from "./authorization";
import { markdownService } from "./markdown";

/**
 * Database Services
 *
 * This object provides a unified interface for all database operations.
 * Import this in components and server-side code to access the database.
 *
 * Example usage:
 * ```
 * import { dbService } from '~/lib/services';
 *
 * // In a server component:
 * const userCount = await dbService.users.count();
 * const recentPages = await dbService.wiki.getRecentPages(5);
 * ```
 */
export const dbService = {
  /**
   * User-related database operations
   */
  users: userService,

  /**
   * Wiki-related database operations
   */
  wiki: wikiService,

  /**
   * Tag-related database operations
   */
  tags: tagService,

  /**
   * Search-related database operations
   */
  search: searchService,

  /**
   * Database locking operations
   */
  locks: lockService,

  /**
   * Asset management operations
   */
  assets: assetService,

  /**
   * Permission management operations
   */
  permissions: permissionService,

  /**
   * Group management operations
   */
  groups: groupService,

  /**
   * Authorization operations
   */
  auth: authorizationService,

  /**
   * Markdown processing operations
   */
  markdown: markdownService,
};

// Export individual services for direct use
export {
  wikiService,
  userService,
  tagService,
  searchService,
  lockService,
  assetService,
  permissionService,
  groupService,
  authorizationService,
  markdownService,
};
