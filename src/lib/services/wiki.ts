import { db } from "~/lib/db";
import { wikiPages, wikiPageRevisions } from "~/lib/db/schema";
import { desc, eq } from "drizzle-orm";

/**
 * Wiki service - handles all wiki-related database operations
 */
export const wikiService = {
  /**
   * Get a wiki page by its path
   */
  async getByPath(path: string) {
    return db.query.wikiPages.findFirst({
      where: eq(wikiPages.path, path),
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
  },

  /**
   * Get recently updated wiki pages
   */
  async getRecentPages(limit: number = 3) {
    return db.query.wikiPages.findMany({
      orderBy: [desc(wikiPages.updatedAt)],
      limit,
    });
  },

  /**
   * Create a new wiki page
   */
  async create(data: {
    path: string;
    title: string;
    content?: string;
    isPublished?: boolean;
    userId: number;
  }) {
    const { path, title, content, isPublished, userId } = data;

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
  },

  /**
   * Update an existing wiki page
   */
  async update(
    id: number,
    data: {
      path: string;
      title: string;
      content?: string;
      isPublished?: boolean;
      userId: number;
    }
  ) {
    const { path, title, content, isPublished, userId } = data;

    // Create a page revision before updating
    const page = await this.getById(id);
    if (page) {
      await db.insert(wikiPageRevisions).values({
        pageId: id,
        content: page.content || "",
        createdById: userId,
      });
    }

    // Update the page
    const [updatedPage] = await db
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

    return updatedPage;
  },

  /**
   * Get a wiki page by ID
   */
  async getById(id: number) {
    return db.query.wikiPages.findFirst({
      where: eq(wikiPages.id, id),
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
  },

  /**
   * Delete a wiki page
   */
  async delete(id: number) {
    const [deleted] = await db
      .delete(wikiPages)
      .where(eq(wikiPages.id, id))
      .returning();

    return deleted;
  },
};
