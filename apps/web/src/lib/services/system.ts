import { db, users, wikiTags, wikiPages, assets, groups } from "@repo/db";
import { sql } from "drizzle-orm";

/**
 * Tag service - handles all tag-related database operations
 */
export const systemService = {
  getStats: async () => {
    const [userCount, pageCount, tagCount, assetCount, groupCount] =
      await Promise.all([
        db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(users),
        db
          .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
          .from(wikiPages),
        db
          .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
          .from(wikiTags),
        db
          .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
          .from(assets),
        db
          .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
          .from(groups),
      ]);

    const stats = {
      userCount: userCount[0]?.count ?? 0,
      pageCount: pageCount[0]?.count ?? 0,
      tagCount: tagCount[0]?.count ?? 0,
      assetCount: assetCount[0]?.count ?? 0,
      groupCount: groupCount[0]?.count ?? 0,
    };
    return stats;
  },
};
