import { userService } from "./users";
import { wikiService } from "./wiki";
import { tagService } from "./tags";
import { searchService } from "./search";
import { lockService } from "./locks";

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
};
