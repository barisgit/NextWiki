import { db } from "@repo/db";
import { permissions } from "@repo/db";
import { eq } from "drizzle-orm";

/**
 * Permission Service
 *
 * Handles operations related to system permissions
 */
export const permissionService = {
  /**
   * Get all permissions in the system including related module and action names
   */
  async getAll() {
    return db.query.permissions.findMany({
      orderBy: (permissions, { asc }) => [
        asc(permissions.moduleId),
        asc(permissions.resource),
        asc(permissions.actionId),
      ],
      with: {
        module: {
          columns: {
            name: true,
          },
        },
        action: {
          columns: {
            name: true,
          },
        },
      },
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
   * Note: Expects IDs for module and action
   */
  async create({
    description,
    moduleId,
    resource,
    actionId,
  }: {
    description?: string;
    moduleId: number;
    resource: string;
    actionId: number;
  }) {
    const result = await db
      .insert(permissions)
      .values({
        description,
        moduleId,
        resource,
        actionId,
      })
      .returning();

    return result[0];
  },

  /**
   * Update an existing permission
   * Note: Expects IDs for module and action if provided
   */
  async update(
    id: number,
    {
      description,
      moduleId,
      resource,
      actionId,
    }: {
      description?: string;
      moduleId?: number;
      resource?: string;
      actionId?: number;
    }
  ) {
    const result = await db
      .update(permissions)
      .set({
        description,
        moduleId,
        resource,
        actionId,
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
