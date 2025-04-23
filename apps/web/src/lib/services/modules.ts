import { db } from "@repo/db";
import { modules } from "@repo/db";
import { eq } from "drizzle-orm";

/**
 * Module Service
 *
 * Handles operations related to permission modules
 */
export const moduleService = {
  /**
   * Get all modules in the system
   */
  async getAll() {
    return db.query.modules.findMany({
      orderBy: (modules, { asc }) => [asc(modules.name)],
    });
  },

  /**
   * Get a module by ID
   */
  async getById(id: number) {
    return db.query.modules.findFirst({
      where: eq(modules.id, id),
    });
  },

  /**
   * Get a module by Name
   */
  async getByName(name: string) {
    return db.query.modules.findFirst({
      where: eq(modules.name, name),
    });
  },

  // Add create, update, delete methods if needed later
};
