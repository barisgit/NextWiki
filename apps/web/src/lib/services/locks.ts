import { db } from "~/lib/db";
import { wikiPages } from "~/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { logger } from "~/lib/utils/logger";

// Software lock timeout in minutes
const LOCK_TIMEOUT_MINUTES = 5;

/**
 * Lock service - handles database-level locking for concurrent wiki editing
 * Uses a hybrid approach:
 * 1. Short-lived hardware locks (FOR UPDATE) for atomic operations
 * 2. Longer software locks with timeout for user editing sessions
 */
export const lockService = {
  /**
   * Acquire a lock on a wiki page
   * Uses hardware lock (FOR UPDATE) briefly, then sets software lock with timeout
   *
   * @param pageId The ID of the page to lock
   * @param userId The ID of the user acquiring the lock
   * @returns Success status and page data
   */
  async acquireLock(
    pageId: number,
    userId: number
  ): Promise<{ success: boolean; page: typeof wikiPages.$inferSelect | null }> {
    try {
      // First check if the page exists and if it has a valid software lock
      const [page] = await db
        .select()
        .from(wikiPages)
        .where(eq(wikiPages.id, pageId));

      if (!page) {
        return { success: false, page: null };
      }

      // Check if page is software-locked by someone else and the lock is still valid
      const now = new Date();
      if (
        page.lockedById &&
        page.lockedById !== userId &&
        page.lockExpiresAt &&
        page.lockExpiresAt > now
      ) {
        // The page is already locked by another user with a valid software lock
        return { success: false, page };
      }

      // Check if page is already locked by this user with a valid lock
      if (
        page.lockedById === userId &&
        page.lockExpiresAt &&
        page.lockExpiresAt > now
      ) {
        // The page is already locked by this user with a valid lock
        // Just refresh the lock expiration time
        const lockExpiresAt = new Date();
        lockExpiresAt.setMinutes(
          lockExpiresAt.getMinutes() + LOCK_TIMEOUT_MINUTES
        );

        const [updatedPage] = await db
          .update(wikiPages)
          .set({
            lockExpiresAt: lockExpiresAt,
          })
          .where(eq(wikiPages.id, pageId))
          .returning();

        if (!updatedPage) {
          // If the update didn't return a page (e.g., concurrent delete)
          return { success: false, page: null };
        }

        return { success: true, page: updatedPage };
      }

      // Now use a transaction for the hardware lock operation
      try {
        return await db.transaction(async (tx) => {
          try {
            // Set statement timeout to prevent indefinite waiting (3 seconds)
            await tx.execute(sql`SET LOCAL statement_timeout = 3000`);

            // Try to acquire a hardware lock with NOWAIT
            const result = await tx.execute(
              sql`SELECT * FROM wiki_pages WHERE id = ${pageId} FOR UPDATE NOWAIT`
            );

            if (result.rows.length === 0) {
              return { success: false, page: null };
            }

            // Set a software lock with timeout
            const lockExpiresAt = new Date();
            lockExpiresAt.setMinutes(
              lockExpiresAt.getMinutes() + LOCK_TIMEOUT_MINUTES
            );

            // Update the page with software lock information
            const [updatedPage] = await tx
              .update(wikiPages)
              .set({
                lockedById: userId,
                lockedAt: now,
                lockExpiresAt: lockExpiresAt,
              })
              .where(eq(wikiPages.id, pageId))
              .returning();

            if (!updatedPage) {
              // If the update didn't return a page (e.g., concurrent delete)
              return { success: false, page: null };
            }

            // Return success - hardware lock will be released when transaction commits
            return { success: true, page: updatedPage };
          } catch (err) {
            // If we get an error with NOWAIT, it means the row is hardware-locked
            logger.log("Failed to acquire hardware lock:", err);

            // We need to throw here to properly abort this transaction
            // but still allow outer catch block to handle it
            throw err;
          }
        });
      } catch (txError) {
        logger.log("Transaction error during lock acquisition:", txError);

        // Recheck the page state after transaction failure
        try {
          const [pageAfterTx] = await db
            .select()
            .from(wikiPages)
            .where(eq(wikiPages.id, pageId));

          if (!pageAfterTx) {
            return { success: false, page: null };
          }

          // If this user now owns the lock, return success
          if (pageAfterTx.lockedById === userId) {
            return { success: true, page: pageAfterTx };
          }

          // Return the current page state
          return { success: false, page: pageAfterTx };
        } catch (finalError) {
          logger.error("Final error checking lock state:", finalError);
          return { success: false, page: page };
        }
      }
    } catch (error) {
      logger.error("Error during lock acquisition:", error);
      return { success: false, page: null };
    }
  },

  /**
   * Check if a page is currently locked
   * @param pageId The ID of the page to check
   * @returns True if the page is locked, false otherwise
   */
  async isLocked(
    pageId: number
  ): Promise<{ isLocked: boolean; lockedByUserId: number | null }> {
    try {
      const [page] = await db
        .select()
        .from(wikiPages)
        .where(eq(wikiPages.id, pageId));

      if (!page) {
        return { isLocked: false, lockedByUserId: null };
      }

      // Check if the software lock is valid (not expired)
      const now = new Date();
      if (page.lockedById && page.lockExpiresAt && page.lockExpiresAt > now) {
        return { isLocked: true, lockedByUserId: page.lockedById };
      }

      // Try a hardware lock check
      try {
        await db.transaction(async (tx) => {
          // Set statement timeout to prevent indefinite waiting (1 second)
          await tx.execute(sql`SET LOCAL statement_timeout = 1000`);

          // Try to acquire a hardware lock with NOWAIT
          await tx.execute(
            sql`SELECT * FROM wiki_pages WHERE id = ${pageId} FOR UPDATE NOWAIT`
          );

          // If we get here, the hardware lock was acquired
          // Release it immediately by ending the transaction
        });

        // If we get here, the hardware lock was acquired and released
        return { isLocked: false, lockedByUserId: null };
      } catch {
        // If we get an error, the hardware lock could not be acquired
        return { isLocked: true, lockedByUserId: null };
      }
    } catch (error) {
      logger.error("Error checking lock status:", error);
      return { isLocked: true, lockedByUserId: null }; // Assume locked on error for safety
    }
  },

  /**
   * Refresh a software lock to prevent timeout
   * @param pageId The ID of the page to refresh the lock for
   * @param userId The ID of the user refreshing the lock
   * @returns Success status and updated page
   */
  async refreshLock(
    pageId: number,
    userId: number
  ): Promise<{ success: boolean; page: typeof wikiPages.$inferSelect | null }> {
    try {
      return await db.transaction(async (tx) => {
        // Check if the current user owns the software lock
        const [page] = await tx
          .select()
          .from(wikiPages)
          .where(eq(wikiPages.id, pageId));

        if (!page) {
          return { success: false, page: null };
        }

        // Check if this user owns the lock
        if (page.lockedById !== userId) {
          return { success: false, page };
        }

        // Update the lock expiration time
        const lockExpiresAt = new Date();
        lockExpiresAt.setMinutes(
          lockExpiresAt.getMinutes() + LOCK_TIMEOUT_MINUTES
        );

        const [updatedPage] = await tx
          .update(wikiPages)
          .set({
            lockExpiresAt: lockExpiresAt,
          })
          .where(eq(wikiPages.id, pageId))
          .returning();

        if (!updatedPage) {
          // If the update didn't return a page
          return { success: false, page: null };
        }

        return { success: true, page: updatedPage };
      });
    } catch (error) {
      logger.error("Failed to refresh lock:", error);
      return { success: false, page: null };
    }
  },

  /**
   * Release the software lock on a page
   * @param pageId The ID of the page to release the lock for
   * @param userId The ID of the user releasing the lock
   * @returns Success status
   */
  async releaseLock(pageId: number, userId: number): Promise<boolean> {
    try {
      const result = await db.transaction(async (tx) => {
        // Verify that this user owns the lock
        const [page] = await tx
          .select()
          .from(wikiPages)
          .where(eq(wikiPages.id, pageId));

        if (!page || page.lockedById !== userId) {
          return false;
        }

        // Clear the lock
        await tx
          .update(wikiPages)
          .set({
            lockedById: null,
            lockedAt: null,
            lockExpiresAt: null,
          })
          .where(eq(wikiPages.id, pageId));

        return true;
      });

      return result;
    } catch (error) {
      logger.error("Failed to release lock:", error);
      return false;
    }
  },
};
