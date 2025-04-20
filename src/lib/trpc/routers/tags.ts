import { z } from "zod";
import { tagService } from "~/lib/services";
import { protectedProcedure, router } from "~/lib/trpc";
import { TRPCError } from "@trpc/server";

/**
 * tRPC router for tag-related operations.
 */
export const tagsRouter = router({
  /**
   * Search for tags by name.
   * Requires authentication.
   */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().int().positive().optional().default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        if (!input.query.trim()) {
          // Return empty array if query is empty or whitespace
          return [];
        }
        const tags = await tagService.searchByName(input.query, input.limit);
        return tags;
      } catch (error) {
        console.error("[TAG SEARCH ERROR]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search for tags",
          cause: error,
        });
      }
    }),
});
