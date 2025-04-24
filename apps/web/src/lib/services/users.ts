import { db } from "@repo/db";
import { users } from "@repo/db";
import { sql, eq } from "drizzle-orm";
import { logger } from "../utils/logger";
import { TRPCError } from "@trpc/server";
import { getPaginationParams, PaginationInput } from "../utils/pagination";

/**
 * User service - handles all user-related database operations
 */
export const userService = {
  /**
   * Get total count of users in the system
   */
  async count(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(users);
    if (!result[0]?.count) {
      throw new Error("Failed to count users");
    }
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
   * @deprecated Implement pagination and search
   */
  async getAll() {
    logger.warn(
      "Deprecated procedure getAll called. Use getPaginated instead."
    );
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
   * Get a paginated list of users
   * @param page - The page number to fetch
   * @param pageSize - The number of users per page
   * @param search - Optional search query
   * @returns A paginated list of users
   */
  async getPaginated(
    pagination: PaginationInput,
    options?: { search?: string }
  ) {
    const { take, skip } = getPaginationParams(pagination);
    void take;
    void skip;
    void options;

    throw new TRPCError({
      code: "NOT_IMPLEMENTED",
      message: "getPaginated is not implemented",
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
