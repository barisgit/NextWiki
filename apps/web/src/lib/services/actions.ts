import { db } from "@repo/db";
import { actions } from "@repo/db";
import { eq } from "drizzle-orm";

/**
 * Action Service
 *
 * Handles operations related to permission actions
 */
export const actionService = {
  /**
   * Get all actions in the system
   */
  async getAll() {
    return db.query.actions.findMany({
      orderBy: (actions, { asc }) => [asc(actions.name)],
    });
  },

  /**
   * Get an action by ID
   */
  async getById(id: number) {
    return db.query.actions.findFirst({
      where: eq(actions.id, id),
    });
  },

  /**
   * Get an action by Name
   */
  async getByName(name: string) {
    return db.query.actions.findFirst({
      where: eq(actions.name, name),
    });
  },

  // Add create, update, delete methods if needed later
};
