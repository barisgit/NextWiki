import { db } from "~/lib/db";
import { users } from "~/lib/db/schema";
import { sql, eq } from "drizzle-orm";
/**
 * User service - handles all user-related database operations
 */
export const userService = {
  /**
   * Get total count of users in the system
   */
  async count(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(users);
    return Number(result[0].count);
  },

  /**
   * Get a user by their ID
   */
  async getById(id: number) {
    return db.query.users.findFirst({
      where: (users) => eq(users.id, id),
    });
  },

  /**
   * Get a list of all users
   */
  async getAll() {
    return db.query.users.findMany();
  },
};
