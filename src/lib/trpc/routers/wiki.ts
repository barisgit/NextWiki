import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { desc, eq, like, gt, and, or, SQL, sql } from 'drizzle-orm';
import { db, wikiPages, wikiTags, wikiPageToTag } from '~/lib/db';
import { publicProcedure, protectedProcedure, router } from '..';

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
          tags: {
            with: {
              tag: true,
            },
          },
        },
      });

      if (!page) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Page not found',
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

      const [page] = await db
        .update(wikiPages)
        .set({
          path,
          title,
          content,
          isPublished,
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(wikiPages.id, id))
        .returning();

      if (!page) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Page not found',
        });
      }

      return page;
    }),

  // List pages (paginated)
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.number().optional(),
        search: z.string().optional(),
        sortBy: z.enum(['title', 'updatedAt']).optional().default('updatedAt'),
        sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
      })
    )
    .query(async ({ input }) => {
      const { limit, cursor, search, sortBy, sortOrder } = input;
      
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
      
      // Dynamic ordering based on sortBy and sortOrder
      const orderByColumn = sortBy === 'title' ? wikiPages.title : wikiPages.updatedAt;
      const orderBy = sortOrder === 'asc' 
        ? orderByColumn 
        : desc(orderByColumn);
      
      // Execute query with conditions, ordering, and limit
      const results = await db.query.wikiPages.findMany({
        where: whereConditions,
        orderBy: [orderBy],
        limit: limit + 1,
        with: {
          updatedBy: true,
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
    .mutation(async ({ input }) => {
      const { id } = input;
      
      const [deleted] = await db
        .delete(wikiPages)
        .where(eq(wikiPages.id, id))
        .returning();
        
      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Page not found',
        });
      }
      
      return deleted;
    }),
}); 