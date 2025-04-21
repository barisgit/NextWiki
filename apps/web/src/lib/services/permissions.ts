import { db } from "~/lib/db";
import { permissions } from "~/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Permission Service
 *
 * Handles operations related to system permissions
 */
export const permissionService = {
  /**
   * Get all permissions in the system
   */
  async getAll() {
    return db.query.permissions.findMany({
      orderBy: (permissions, { asc }) => [
        asc(permissions.module),
        asc(permissions.action),
      ],
    });
  },

  /**
   * Get a permission by ID
   */
  async getById(id: number) {
    return db.query.permissions.findFirst({
      where: eq(permissions.id, id),
    });
  },

  /**
   * Create a new permission
   */
  async create({
    description,
    module,
    resource,
    action,
  }: {
    description?: string;
    module: string;
    resource: string;
    action: string;
  }) {
    const result = await db
      .insert(permissions)
      .values({
        description,
        module,
        resource,
        action,
      })
      .returning();

    return result[0];
  },

  /**
   * Update an existing permission
   */
  async update(
    id: number,
    {
      description,
      module,
      resource,
      action,
    }: {
      description?: string;
      module?: string;
      resource?: string;
      action?: string;
    }
  ) {
    const result = await db
      .update(permissions)
      .set({
        description,
        module,
        resource,
        action,
      })
      .where(eq(permissions.id, id))
      .returning();

    return result[0];
  },

  /**
   * Delete a permission by ID
   */
  async delete(id: number) {
    const result = await db
      .delete(permissions)
      .where(eq(permissions.id, id))
      .returning();

    return result[0];
  },
};
