import {
  db,
  users,
  wikiTags,
  wikiPages,
  assets,
  groups,
  sessions,
} from "@repo/db";
import { sql, isNotNull, gt } from "drizzle-orm";

/**
 * System service - handles system-related operations
 */
export const systemService = {
  getStats: async () => {
    let dbStatus: "healthy" | "unhealthy" | "error" | "pending" = "pending";
    let dbError: string | null = null;

    try {
      // Simple query to check DB connection
      await db.execute(sql`SELECT 1`);
      dbStatus = "healthy";
    } catch (error) {
      console.error("Database health check failed:", error);
      dbStatus = "unhealthy";
      dbError =
        error instanceof Error ? error.message : "Unknown database error";
    }

    const results = await Promise.allSettled([
      db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(users),
      db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(wikiPages),
      db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(wikiTags),
      db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(assets),
      db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(groups),
      db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(wikiPages)
        .where(isNotNull(wikiPages.lockedById)),
      db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(sessions)
        .where(gt(sessions.expires, new Date())),
    ]);

    // Simplified helper to extract count directly from the result array
    const getCountFromResult = (
      result: PromiseSettledResult<{ count: number }[]>
    ) => {
      if (
        result.status === "fulfilled" &&
        result.value &&
        result.value.length > 0 &&
        result.value[0]
      ) {
        return result.value[0].count ?? 0;
      }
      if (result.status === "rejected") {
        console.error("Failed to fetch count:", result.reason);
      }
      return 0;
    };

    const [
      userCountResult,
      pageCountResult,
      tagCountResult,
      assetCountResult,
      groupCountResult,
      lockedPagesCountResult,
      activeSessionCountResult,
    ] = results;

    const stats = {
      dbStatus,
      dbError,
      userCount: getCountFromResult(userCountResult),
      pageCount: getCountFromResult(pageCountResult),
      tagCount: getCountFromResult(tagCountResult),
      assetCount: getCountFromResult(assetCountResult),
      groupCount: getCountFromResult(groupCountResult),
      lockedPagesCount: getCountFromResult(lockedPagesCountResult),
      activeSessionCount: getCountFromResult(activeSessionCountResult),
    };
    return stats;
  },
};
