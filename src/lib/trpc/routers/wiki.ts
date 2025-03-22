import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { desc, eq, like, gt, and, sql } from "drizzle-orm";
import { db, wikiPages, wikiPageRevisions } from "~/lib/db";
import { publicProcedure, protectedProcedure, router } from "..";

// Lock duration in minutes
const LOCK_DURATION_MINUTES = 1;

// Helper function to check if a page is locked by someone else
const isPageLockedByOther = (
  page: typeof wikiPages.$inferSelect,
  userId: number
) => {
  if (!page.lockedById || !page.lockExpiresAt) {
    return false;
  }

  const now = new Date();
  return page.lockedById !== userId && page.lockExpiresAt > now;
};

// Helper function to create a lock on a page
const createLock = async (pageId: number, userId: number) => {
  const now = new Date();
  const lockExpiresAt = new Date(
    now.getTime() + LOCK_DURATION_MINUTES * 60 * 1000
  );

  const [updatedPage] = await db
    .update(wikiPages)
    .set({
      lockedById: userId,
      lockedAt: now,
      lockExpiresAt,
    })
    .where(eq(wikiPages.id, pageId))
    .returning();

  return updatedPage;
};

// Helper function to release a lock
const releaseLock = async (pageId: number, userId: number) => {
  // Only allow the lock owner to release the lock
  const [page] = await db
    .select()
    .from(wikiPages)
    .where(eq(wikiPages.id, pageId));

  if (page && page.lockedById === userId) {
    const [updatedPage] = await db
      .update(wikiPages)
      .set({
        lockedById: null,
        lockedAt: null,
        lockExpiresAt: null,
      })
      .where(eq(wikiPages.id, pageId))
      .returning();

    return updatedPage;
  }

  return page;
};

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

      // First, get the current page with lock information
      const page = await db.query.wikiPages.findFirst({
        where: eq(wikiPages.id, id),
        with: {
          lockedBy: true,
        },
      });

      if (!page) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page not found",
        });
      }

      // Check if the page is locked by someone else
      if (isPageLockedByOther(page, userId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Page is currently being edited by ${
            page.lockedBy?.name || "another user"
          } until ${page.lockExpiresAt?.toLocaleTimeString()}`,
        });
      }

      // If the page is not locked, or locked by the current user
      // or the lock has expired, acquire/refresh the lock
      const updatedPage = await createLock(id, userId);

      return updatedPage;
    }),

  // Release a lock on a page
  releaseLock: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const userId = parseInt(ctx.session.user.id);

      const updatedPage = await releaseLock(id, userId);

      return updatedPage;
    }),

  // Refresh a lock on a page
  refreshLock: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const userId = parseInt(ctx.session.user.id);

      // First, get the current page with lock information
      const page = await db.query.wikiPages.findFirst({
        where: eq(wikiPages.id, id),
      });

      if (!page) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page not found",
        });
      }

      // Check if the page is locked by someone else
      if (isPageLockedByOther(page, userId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot refresh a lock owned by another user",
        });
      }

      // Refresh the lock
      const updatedPage = await createLock(id, userId);

      return updatedPage;
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

      // First, get the current page with lock information
      const page = await db.query.wikiPages.findFirst({
        where: eq(wikiPages.id, id),
      });

      if (!page) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page not found",
        });
      }

      // Check if the page is locked by someone else
      if (isPageLockedByOther(page, userId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This page is currently being edited by another user",
        });
      }

      // Create a page revision before updating
      await db.insert(wikiPageRevisions).values({
        pageId: id,
        content: page.content || "",
        createdById: userId,
      });

      // Update the page and release the lock in one transaction
      const [updatedPage] = await db
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

      if (!updatedPage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page not found",
        });
      }

      return updatedPage;
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

      // Handle locked pages filter
      if (showLockedOnly) {
        const now = new Date();
        const lockCondition = and(
          sql`${wikiPages.lockedById} IS NOT NULL`,
          sql`${wikiPages.lockExpiresAt} > ${now}`
        );

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

      // First, get the current page with lock information
      const page = await db.query.wikiPages.findFirst({
        where: eq(wikiPages.id, id),
      });

      if (!page) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page not found",
        });
      }

      // Check if the page is locked by someone else
      if (isPageLockedByOther(page, userId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This page is currently being edited by another user",
        });
      }

      const [deleted] = await db
        .delete(wikiPages)
        .where(eq(wikiPages.id, id))
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page not found",
        });
      }

      return deleted;
    }),
});
