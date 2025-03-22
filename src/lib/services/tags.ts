import { db } from "~/lib/db";
import { wikiTags, wikiPageToTag } from "~/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Tag service - handles all tag-related database operations
 */
export const tagService = {
  /**
   * Get all tags
   */
  async getAll() {
    return db.query.wikiTags.findMany({
      orderBy: (tags, { asc }) => [asc(tags.name)],
    });
  },

  /**
   * Get a tag by ID
   */
  async getById(id: number) {
    return db.query.wikiTags.findFirst({
      where: eq(wikiTags.id, id),
    });
  },

  /**
   * Get pages that have a specific tag
   */
  async getPagesByTagId(tagId: number) {
    return db.query.wikiTags.findFirst({
      where: eq(wikiTags.id, tagId),
      with: {
        pages: {
          with: {
            page: true,
          },
        },
      },
    });
  },

  /**
   * Get pages that have a specific tag
   */
  async getPagesByTagName(tagName: string) {
    return db.query.wikiTags.findFirst({
      where: eq(wikiTags.name, tagName),
      with: {
        pages: {
          with: {
            page: true,
          },
        },
      },
    });
  },

  /**
   * Create a new tag
   */
  async create(name: string) {
    const [tag] = await db.insert(wikiTags).values({ name }).returning();

    return tag;
  },

  /**
   * Associate a tag with a page
   */
  async addTagToPage(tagId: number, pageId: number) {
    const [relation] = await db
      .insert(wikiPageToTag)
      .values({ tagId, pageId })
      .returning();

    return relation;
  },

  /**
   * Remove a tag from a page
   */
  async removeTagFromPage(tagId: number, pageId: number) {
    return db
      .delete(wikiPageToTag)
      .where(
        eq(wikiPageToTag.tagId, tagId) && eq(wikiPageToTag.pageId, pageId)
      );
  },
};
