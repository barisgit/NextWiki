import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { desc, eq, like, gt, and, sql } from "drizzle-orm";
import { db, wikiPages, wikiPageRevisions } from "~/lib/db";
import { publicProcedure, protectedProcedure, router } from "..";
import { dbService } from "~/lib/services";

// Wiki page input validation schema
const pageInputSchema = z.object({
  path: z.string().min(1).max(1000),
  title: z.string().min(1).max(255),
  content: z.string().optional(),
  isPublished: z.boolean().optional(),
});

export const wikiRouter = router({
  // Get a page by path
  getByPath: publicProcedure
    .input(z.object({ path: z.string() }))
    .query(async ({ input }) => {
      const page = await db.query.wikiPages.findFirst({
        where: eq(wikiPages.path, input.path),
        with: {
          createdBy: true,
          updatedBy: true,
          lockedBy: true,
          tags: {
            with: {
              tag: true,
            },
          },
        },
      });

      if (!page) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page not found",
        });
      }

      return page;
    }),

  // Create a new page
  create: protectedProcedure
    .input(pageInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { path, title, content, isPublished } = input;
      const userId = parseInt(ctx.session.user.id);

      const [page] = await db
        .insert(wikiPages)
        .values({
          path,
          title,
          content,
          isPublished: isPublished ?? false,
          createdById: userId,
          updatedById: userId,
        })
        .returning();

      return page;
    }),

  // Acquire a lock on a page for editing
  acquireLock: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const userId = parseInt(ctx.session.user.id);

      // Try to acquire a lock - this will use hardware locks briefly
      // but will set up a software lock with timeout for the editing session
      const { success, page } = await dbService.locks.acquireLock(id, userId);

      if (!success) {
        // If page is null, it doesn't exist
        if (!page) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Page not found",
          });
        }

        // Get current lock owner info from UI metadata
        const lockedByUser = page.lockedById
          ? await dbService.users.getById(page.lockedById)
          : null;

        // Instead of throwing an error, return the unsuccessful result with page info
        // This allows the client to handle the case more gracefully
        return {
          success: false,
          page,
          lockOwner: lockedByUser?.name || "another user",
        };
      }

      // Return the page with the software lock
      return {
        success: true,
        page,
      };
    }),

  // Release a software lock on a page
  releaseLock: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const userId = parseInt(ctx.session.user.id);

      // Release the software lock if owned by this user
      const success = await dbService.locks.releaseLock(id, userId);

      if (!success) {
        console.warn(
          `Lock for page ${id} could not be released - may be held by a different user`
        );
      }

      // Get the updated page
      const page = await db.query.wikiPages.findFirst({
        where: eq(wikiPages.id, id),
      });

      if (!page) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page not found",
        });
      }

      return page;
    }),

  // Refresh a software lock to prevent timeout
  refreshLock: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const userId = parseInt(ctx.session.user.id);

      // Check if the lock is still valid and refresh it
      const { success, page } = await dbService.locks.refreshLock(id, userId);

      if (!success) {
        if (!page) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Page not found",
          });
        }

        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You no longer hold the lock on this page",
        });
      }

      return {
        page,
      };
    }),

  // Update an existing page
  update: protectedProcedure
    .input(
      pageInputSchema.extend({
        id: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, path, title, content, isPublished } = input;
      const userId = parseInt(ctx.session.user.id);

      // First, check if the user has a valid software lock
      const { isLocked, lockedByUserId } = await dbService.locks.isLocked(id);

      if (isLocked && lockedByUserId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This page is currently being edited by another user",
        });
      }

      // Use a transaction with a hardware lock for the update operation
      try {
        return await db.transaction(async (tx) => {
          // Set a short timeout for the hardware lock operation
          await tx.execute(sql`SET LOCAL statement_timeout = 3000`);

          // Acquire a hardware lock for the update
          const result = await tx.execute(
            sql`SELECT * FROM wiki_pages WHERE id = ${id} FOR UPDATE NOWAIT`
          );

          if (result.rows.length === 0) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Page not found",
            });
          }

          const page = result.rows[0] as typeof wikiPages.$inferSelect;

          // Create a page revision
          await tx.insert(wikiPageRevisions).values({
            pageId: id,
            content: page.content || "",
            createdById: userId,
          });

          // Update the page and clear the software lock
          const [updatedPage] = await tx
            .update(wikiPages)
            .set({
              path,
              title,
              content,
              isPublished,
              updatedById: userId,
              updatedAt: new Date(),
              lockedById: null,
              lockedAt: null,
              lockExpiresAt: null,
            })
            .where(eq(wikiPages.id, id))
            .returning();

          return updatedPage;
        });
      } catch (error) {
        console.error("Failed to update page:", error);

        if (
          error instanceof Error &&
          error.message.includes("could not obtain lock")
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Could not update page because it's locked by another process",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update page",
        });
      }
    }),

  // List pages (paginated) with lock information
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.number().optional(),
        search: z.string().optional(),
        sortBy: z.enum(["title", "updatedAt"]).optional().default("updatedAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
        showLockedOnly: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input }) => {
      const { limit, cursor, search, sortBy, sortOrder, showLockedOnly } =
        input;

      // Build conditions
      let whereConditions = undefined;

      // Handle cursor pagination
      if (cursor) {
        whereConditions = gt(wikiPages.id, cursor);
      }

      // Handle search
      if (search) {
        const searchCondition = like(wikiPages.title, `%${search}%`);
        whereConditions = whereConditions
          ? and(whereConditions, searchCondition)
          : searchCondition;
      }

      // Handle locked pages filter - note this will now just show UI locks
      // not the actual advisory locks
      if (showLockedOnly) {
        const lockCondition = sql`${wikiPages.lockedById} IS NOT NULL`;
        whereConditions = whereConditions
          ? and(whereConditions, lockCondition)
          : lockCondition;
      }

      // Dynamic ordering based on sortBy and sortOrder
      const orderByColumn =
        sortBy === "title" ? wikiPages.title : wikiPages.updatedAt;
      const orderBy = sortOrder === "asc" ? orderByColumn : desc(orderByColumn);

      // Execute query with conditions, ordering, and limit
      const results = await db.query.wikiPages.findMany({
        where: whereConditions,
        orderBy: [orderBy],
        limit: limit + 1,
        with: {
          updatedBy: true,
          lockedBy: true,
          tags: {
            with: {
              tag: true,
            },
          },
        },
      });

      // Handle pagination
      let nextCursor: typeof cursor | undefined = undefined;
      const pages = [...results];

      if (pages.length > limit) {
        const nextPage = pages.pop();
        nextCursor = nextPage?.id;
      }

      return {
        pages,
        nextCursor,
      };
    }),

  // Delete a page
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const userId = parseInt(ctx.session.user.id);

      // First, check if the user has a valid software lock
      const { isLocked, lockedByUserId } = await dbService.locks.isLocked(id);

      if (isLocked && lockedByUserId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This page is currently being edited by another user",
        });
      }

      // Use a transaction with a hardware lock for the delete operation
      try {
        return await db.transaction(async (tx) => {
          // Set a short timeout for the hardware lock operation
          await tx.execute(sql`SET LOCAL statement_timeout = 3000`);

          // Acquire a hardware lock for the deletion
          const result = await tx.execute(
            sql`SELECT * FROM wiki_pages WHERE id = ${id} FOR UPDATE NOWAIT`
          );

          if (result.rows.length === 0) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Page not found",
            });
          }

          // Delete the page
          const [deleted] = await tx
            .delete(wikiPages)
            .where(eq(wikiPages.id, id))
            .returning();

          return deleted;
        });
      } catch (error) {
        console.error("Failed to delete page:", error);

        if (
          error instanceof Error &&
          error.message.includes("could not obtain lock")
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Could not delete page because it's locked by another process",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete page",
        });
      }
    }),
});
