import { z } from "zod";
import { permissionProtectedProcedure, router } from "~/server";
import { db, wikiPages } from "@repo/db";
import { dbService } from "~/lib/services";
import { logger } from "@repo/logger";
import { formatDistanceToNow } from "date-fns";
import { TRPCError } from "@trpc/server";
import { desc, gt, ilike, or, and, isNotNull } from "drizzle-orm";

export const adminWikiRouter = router({
  /**
   * Get recently updated wiki pages for the admin dashboard.
   */
  getRecent: permissionProtectedProcedure("admin:wiki:read")
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(5),
      })
    )
    .query(async ({ input }) => {
      try {
        const recentPages = await dbService.wiki.getRecentPages(input.limit);
        const formattedPages = recentPages.map((page) => ({
          ...page,
          updatedAtRelative: page.updatedAt
            ? formatDistanceToNow(page.updatedAt, { addSuffix: true })
            : "Never",
        }));
        return formattedPages;
      } catch (error) {
        logger.error("Failed to fetch recent wiki pages for admin:", error);
        return [];
      }
    }),

  /**
   * List wiki pages for the admin management table.
   */
  list: permissionProtectedProcedure("admin:wiki:read")
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.number().nullish(), // page ID cursor for pagination
        search: z.string().optional(),
        sortBy: z
          .enum(["title", "path", "updatedAt", "createdAt"])
          .optional()
          .default("updatedAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
      })
    )
    .query(async ({ input }) => {
      const { limit, cursor, search, sortBy, sortOrder } = input;

      // Determine the sort column and order
      let orderByColumn;
      switch (sortBy) {
        case "title":
          orderByColumn = wikiPages.title;
          break;
        case "path":
          orderByColumn = wikiPages.path;
          break;
        case "createdAt":
          orderByColumn = wikiPages.createdAt;
          break;
        case "updatedAt":
        default:
          orderByColumn = wikiPages.updatedAt;
          break;
      }
      const orderBy = sortOrder === "asc" ? orderByColumn : desc(orderByColumn);

      // Build conditions: cursor-based pagination
      let whereConditions = cursor ? gt(wikiPages.id, cursor) : undefined;

      // Add search condition if provided
      if (search) {
        const searchCondition = or(
          ilike(wikiPages.title, `%${search}%`),
          ilike(wikiPages.path, `%${search}%`)
          // Add more fields to search if needed (e.g., content, tags)
        );
        whereConditions = whereConditions
          ? and(whereConditions, searchCondition)
          : searchCondition;
      }

      try {
        const items = await db.query.wikiPages.findMany({
          columns: {
            id: true,
            path: true,
            title: true,
            isPublished: true,
            createdAt: true,
            updatedAt: true,
            lockedById: true, // Include to check lock status
            lockExpiresAt: true,
            // Exclude large fields unless specifically needed
            content: false,
            renderedHtml: false,
            search: false,
          },
          where: whereConditions,
          orderBy: [orderBy, desc(wikiPages.id)], // Secondary sort by ID for stable pagination
          limit: limit + 1, // Fetch one extra to determine if there's a next page
          with: {
            createdBy: {
              columns: { id: true, name: true },
            },
            updatedBy: {
              columns: { id: true, name: true },
            },
            lockedBy: {
              columns: { id: true, name: true }, // Include lock owner info
            },
          },
        });

        let nextCursor: typeof cursor | undefined = undefined;
        if (items.length > limit) {
          const nextItem = items.pop(); // Remove the extra item
          nextCursor = nextItem!.id; // Use its ID as the next cursor
        }

        // Format dates and add relative time
        const formattedItems = items.map((item) => ({
          ...item,
          createdAtRelative: item.createdAt
            ? formatDistanceToNow(item.createdAt, { addSuffix: true })
            : "Unknown",
          updatedAtRelative: item.updatedAt
            ? formatDistanceToNow(item.updatedAt, { addSuffix: true })
            : "Never",
        }));

        return {
          items: formattedItems,
          nextCursor,
        };
      } catch (error) {
        logger.error("Failed to list wiki pages for admin:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch wiki pages",
        });
      }
    }),

  /**
   * Get currently locked wiki pages for the admin dashboard.
   */
  listLocked: permissionProtectedProcedure("admin:wiki:read")
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(5),
      })
    )
    .query(async ({ input }) => {
      const { limit } = input;
      try {
        const lockedPages = await db.query.wikiPages.findMany({
          columns: {
            id: true,
            path: true,
            title: true,
            lockedAt: true, // Include lock timestamp
          },
          where: isNotNull(wikiPages.lockedById), // Filter for locked pages
          orderBy: [desc(wikiPages.lockedAt)], // Order by most recently locked
          limit: limit,
          with: {
            lockedBy: {
              // Eager load the user who locked the page
              columns: { id: true, name: true },
            },
          },
        });

        // Format dates and add relative time
        const formattedPages = lockedPages.map((page) => ({
          ...page,
          // Ensure lockedAt is not null before formatting
          lockedAtRelative: page.lockedAt
            ? formatDistanceToNow(page.lockedAt, { addSuffix: true })
            : "Unknown",
        }));

        return formattedPages;
      } catch (error) {
        logger.error("Failed to fetch locked wiki pages for admin:", error);
        // Return empty array on error for dashboard resilience
        return [];
      }
    }),
});
