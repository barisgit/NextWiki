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
    return db.query.users.findMany({
      with: {
        userGroups: {
          with: {
            group: true,
          },
        },
      },
    });
  },

  /**
   * Get user groups by ID
   */
  async getUserGroups(id: number) {
    return db.query.users.findFirst({
      where: (users) => eq(users.id, id),
      with: {
        userGroups: {
          with: {
            group: true,
          },
        },
      },
    });
  },

  /**
   * Find a user by their email address.
   * @param email - The email address to search for.
   * @returns The user object or undefined if not found.
   */
  async findByEmail(email: string) {
    return db.query.users.findFirst({
      where: eq(users.email, email),
    });
  },

  /**
   * Create a new user.
   * @param data - User data (name, email, hashedPassword).
   * @returns The newly created user object.
   */
  async create(
    data: Omit<
      typeof users.$inferInsert,
      "id" | "createdAt" | "updatedAt" | "emailVerified"
    >
  ) {
    const result = await db
      .insert(users)
      .values({
        ...data,
        // No need for isAdmin default anymore as it's determined by group membership
      })
      .returning(); // Return the created user

    return result[0]; // Drizzle returns an array
  },
};

export type User = typeof users.$inferSelect;
