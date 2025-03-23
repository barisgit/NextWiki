import { db } from "~/lib/db";
import { wikiPages, wikiPageRevisions } from "~/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { lockService } from "~/lib/services";

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
        path: path.toLowerCase(),
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
        path: path.toLowerCase(),
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

  /**
   * Move multiple pages with proper locking
   */
  async movePages(params: {
    pageIds: number[];
    sourcePath: string;
    targetPath: string;
    operation: "move" | "rename";
    recursive: boolean;
    userId: number;
  }) {
    const { pageIds, sourcePath, targetPath, operation, recursive, userId } =
      params;

    try {
      // First fetch all pages to check if they exist and aren't locked by others
      const pagesToMove = await Promise.all(
        pageIds.map(async (pageId) => {
          const page = await this.getById(pageId);
          if (!page) {
            throw new Error(`Page with ID ${pageId} not found`);
          }

          // Check if page is locked by another user
          // We'll reuse dbService.locks.isLocked here to be consistent
          const { isLocked, lockedByUserId } = await lockService.isLocked(
            pageId
          );
          if (isLocked && lockedByUserId !== userId) {
            throw new Error(`Page "${page.title}" is locked by another user`);
          }

          return page;
        })
      );

      // Now use a transaction to move all pages atomically
      return await db.transaction(async (tx) => {
        // Set a reasonable timeout
        await tx.execute(sql`SET LOCAL statement_timeout = 10000`);

        const updatedPages = [];
        const acquiredLocks = [];

        try {
          // First acquire hardware locks for all pages
          for (const page of pagesToMove) {
            // Lock the page with a hardware lock
            const result = await tx.execute(
              sql`SELECT * FROM wiki_pages WHERE id = ${page.id} FOR UPDATE NOWAIT`
            );

            if (result.rows.length === 0) {
              throw new Error(
                `Failed to acquire lock for page "${page.title}"`
              );
            }

            acquiredLocks.push(page.id);
          }

          // Now safely process each page
          for (const page of pagesToMove) {
            // Calculate new path based on operation
            let newPath = page.path;

            if (operation === "move") {
              // For move, replace the source path with target path
              if (page.path.startsWith(sourcePath)) {
                newPath = page.path.replace(sourcePath, targetPath);
              }
            } else if (operation === "rename") {
              // For rename, simply update to the new path
              newPath = targetPath;
            }

            // Check if new path already exists
            const existingPage = await tx.query.wikiPages.findFirst({
              where: eq(wikiPages.path, newPath),
            });

            if (existingPage && existingPage.id !== page.id) {
              throw new Error(`A page already exists at path: ${newPath}`);
            }

            // Create a revision first
            await tx.insert(wikiPageRevisions).values({
              pageId: page.id,
              content: page.content || "",
              createdById: userId,
            });

            // Update the page and release software lock
            const [updatedPage] = await tx
              .update(wikiPages)
              .set({
                path: newPath,
                updatedById: userId,
                updatedAt: new Date(),
                lockedById: null,
                lockedAt: null,
                lockExpiresAt: null,
              })
              .where(eq(wikiPages.id, page.id))
              .returning();

            updatedPages.push(updatedPage);

            // If recursive flag is true, handle child pages
            if (recursive) {
              const childPrefix = page.path.endsWith("/")
                ? page.path
                : `${page.path}/`;

              const childPages = await tx.query.wikiPages.findMany({
                where: (wiki) => sql`${wiki.path} LIKE ${childPrefix + "%"}`,
              });

              // Lock all child pages
              for (const childPage of childPages) {
                const childResult = await tx.execute(
                  sql`SELECT * FROM wiki_pages WHERE id = ${childPage.id} FOR UPDATE NOWAIT`
                );

                if (childResult.rows.length === 0) {
                  throw new Error(
                    `Failed to acquire lock for child page at "${childPage.path}"`
                  );
                }

                acquiredLocks.push(childPage.id);
              }

              // Now process all child pages
              for (const childPage of childPages) {
                const childNewPath = childPage.path.replace(
                  childPrefix,
                  newPath.endsWith("/") ? newPath : `${newPath}/`
                );

                // Check for conflicts
                const existingChildPage = await tx.query.wikiPages.findFirst({
                  where: eq(wikiPages.path, childNewPath),
                });

                if (
                  existingChildPage &&
                  existingChildPage.id !== childPage.id
                ) {
                  throw new Error(
                    `Cannot move recursively: A page already exists at path: ${childNewPath}`
                  );
                }

                // Create revision
                await tx.insert(wikiPageRevisions).values({
                  pageId: childPage.id,
                  content: childPage.content || "",
                  createdById: userId,
                });

                // Update child page
                const [updatedChildPage] = await tx
                  .update(wikiPages)
                  .set({
                    path: childNewPath,
                    updatedById: userId,
                    updatedAt: new Date(),
                    lockedById: null,
                    lockedAt: null,
                    lockExpiresAt: null,
                  })
                  .where(eq(wikiPages.id, childPage.id))
                  .returning();

                updatedPages.push(updatedChildPage);
              }
            }
          }

          // Transaction will automatically commit and release hardware locks
          return updatedPages;
        } catch (error) {
          // In case of error, explicitly release any software locks
          // that might have been acquired outside this transaction
          for (const pageId of acquiredLocks) {
            await lockService.releaseLock(pageId, userId).catch(() => {
              // Ignore errors in cleanup
              console.warn(
                `Failed to release lock for page ${pageId} during error recovery`
              );
            });
          }

          throw error;
        }
      });
    } catch (error) {
      console.error("Error in movePages service:", error);
      throw error;
    }
  },
};
