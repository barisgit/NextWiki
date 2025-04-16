import { db } from "~/lib/db";
import {
  groups,
  userGroups,
  groupPermissions,
  groupModuleRestrictions,
  groupActionRestrictions,
} from "~/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { groups as groupsTable } from "~/lib/db/schema";
type Group = typeof groupsTable.$inferSelect;

/**
 * Group Service
 *
 * Handles operations related to user groups and their permissions
 */
export const groupService = {
  /**
   * Get all groups
   */
  async getAll() {
    return db.query.groups.findMany({
      orderBy: (groups, { asc }) => [asc(groups.name)],
    });
  },

  /**
   * Get a group by ID
   */
  async getById(id: number) {
    return db.query.groups.findFirst({
      where: eq(groups.id, id),
    });
  },

  /**
   * Get all users in a group
   */
  async getGroupUsers(groupId: number) {
    const results = await db.query.userGroups.findMany({
      where: eq(userGroups.groupId, groupId),
      with: {
        user: true,
      },
    });

    return results.map((result) => result.user);
  },

  /**
   * Get all permissions for a group
   */
  async getGroupPermissions(groupId: number) {
    const results = await db.query.groupPermissions.findMany({
      where: eq(groupPermissions.groupId, groupId),
      with: {
        permission: true,
      },
    });

    return results.map((result) => result.permission);
  },

  /**
   * Create a new group
   */
  async create({ name, description }: { name: string; description?: string }) {
    const result = await db
      .insert(groups)
      .values({
        name,
        description,
      })
      .returning();

    return result[0];
  },

  /**
   * Update an existing group
   */
  async update(
    id: number,
    {
      name,
      description,
    }: {
      name?: string;
      description?: string;
    }
  ) {
    const result = await db
      .update(groups)
      .set({
        name,
        description,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, id))
      .returning();

    return result[0];
  },

  /**
   * Delete a group
   */
  async delete(id: number) {
    // Delete associated records first
    await db.delete(userGroups).where(eq(userGroups.groupId, id));
    await db.delete(groupPermissions).where(eq(groupPermissions.groupId, id));

    const result = await db.delete(groups).where(eq(groups.id, id)).returning();

    return result[0];
  },

  /**
   * Add users to a group
   */
  async addUsers(groupId: number, userIds: number[]) {
    // Ensure the group exists
    const group = await this.getById(groupId);
    if (!group) {
      throw new Error(`Group with id ${groupId} not found`);
    }

    // Get existing user-group associations
    const existingAssociations = await db.query.userGroups.findMany({
      where: and(
        eq(userGroups.groupId, groupId),
        inArray(userGroups.userId, userIds)
      ),
    });

    const existingUserIds = existingAssociations.map((assoc) => assoc.userId);

    // Filter out users already in the group
    const newUserIds = userIds.filter(
      (userId) => !existingUserIds.includes(userId)
    );

    if (newUserIds.length === 0) {
      return { added: 0 };
    }

    // Add users to the group
    await db.insert(userGroups).values(
      newUserIds.map((userId) => ({
        userId,
        groupId,
      }))
    );

    return { added: newUserIds.length };
  },

  /**
   * Remove users from a group
   */
  async removeUsers(groupId: number, userIds: number[]) {
    await db
      .delete(userGroups)
      .where(
        and(
          eq(userGroups.groupId, groupId),
          inArray(userGroups.userId, userIds)
        )
      );

    return { removed: userIds.length };
  },

  /**
   * Add permissions to a group
   */
  async addPermissions(groupId: number, permissionIds: number[]) {
    // Ensure the group exists
    const group = await this.getById(groupId);
    if (!group) {
      throw new Error(`Group with id ${groupId} not found`);
    }

    // Get existing group-permission associations
    const existingAssociations = await db.query.groupPermissions.findMany({
      where: and(
        eq(groupPermissions.groupId, groupId),
        inArray(groupPermissions.permissionId, permissionIds)
      ),
    });

    const existingPermissionIds = existingAssociations.map(
      (assoc) => assoc.permissionId
    );

    // Filter out permissions already assigned to the group
    const newPermissionIds = permissionIds.filter(
      (permissionId) => !existingPermissionIds.includes(permissionId)
    );

    if (newPermissionIds.length === 0) {
      return { added: 0 };
    }

    // Add permissions to the group
    await db.insert(groupPermissions).values(
      newPermissionIds.map((permissionId) => ({
        permissionId,
        groupId,
      }))
    );

    return { added: newPermissionIds.length };
  },

  /**
   * Remove permissions from a group
   */
  async removePermissions(groupId: number, permissionIds: number[]) {
    await db
      .delete(groupPermissions)
      .where(
        and(
          eq(groupPermissions.groupId, groupId),
          inArray(groupPermissions.permissionId, permissionIds)
        )
      );

    return { removed: permissionIds.length };
  },

  /**
   * Finds a group by its name.
   * @param name - The name of the group.
   * @returns The group object or null if not found.
   */
  async findByName(name: string) {
    const result = await db.query.groups.findFirst({
      where: eq(groups.name, name),
    });
    return result ?? null;
  },

  /**
   * Adds a user to a specific group.
   * Uses the 'userGroups' table.
   * @param userId - The ID of the user (assuming number type based on userGroups schema).
   * @param groupId - The ID of the group.
   * @returns True if the user was added, false otherwise (e.g., already exists).
   */
  async addUserToGroup(userId: number, groupId: number): Promise<boolean> {
    try {
      await db
        .insert(userGroups)
        .values({ userId, groupId })
        .onConflictDoNothing();
      return true;
    } catch (error) {
      console.error(`Error adding user ${userId} to group ${groupId}:`, error);
      return false;
    }
  },

  /**
   * Removes a user from a specific group.
   * Uses the 'userGroups' table.
   * @param userId - The ID of the user (assuming number type).
   * @param groupId - The ID of the group.
   * @returns True if the user was removed, false otherwise.
   */
  async removeUserFromGroup(userId: number, groupId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(userGroups)
        .where(
          and(eq(userGroups.userId, userId), eq(userGroups.groupId, groupId))
        );
      return (result?.rowCount ?? 0) > 0;
    } catch (error) {
      console.error(
        `Error removing user ${userId} from group ${groupId}:`,
        error
      );
      return false;
    }
  },

  /**
   * Gets all groups a user belongs to.
   * Uses the 'userGroups' table.
   * @param userId - The ID of the user (assuming number type).
   * @returns An array of group objects.
   */
  async getUserGroups(userId: number): Promise<Group[]> {
    const userGroupRelations = await db.query.userGroups.findMany({
      where: eq(userGroups.userId, userId),
      with: {
        group: true,
      },
    });
    return userGroupRelations.map((ug) => ug.group as Group);
  },

  /**
   * Add module restrictions to a group
   */
  async addModuleRestrictions(groupId: number, modules: string[]) {
    // Ensure the group exists
    const group = await this.getById(groupId);
    if (!group) {
      throw new Error(`Group with id ${groupId} not found`);
    }

    // Add module restrictions
    await db.insert(groupModuleRestrictions).values(
      modules.map((module) => ({
        groupId,
        module,
      }))
    );

    return { added: modules.length };
  },

  /**
   * Add action restrictions to a group
   */
  async addActionRestrictions(groupId: number, actions: string[]) {
    // Ensure the group exists
    const group = await this.getById(groupId);
    if (!group) {
      throw new Error(`Group with id ${groupId} not found`);
    }

    // Add action restrictions
    await db.insert(groupActionRestrictions).values(
      actions.map((action) => ({
        groupId,
        action,
      }))
    );

    return { added: actions.length };
  },

  /**
   * Get module restrictions for a group
   */
  async getModuleRestrictions(groupId: number) {
    return db.query.groupModuleRestrictions.findMany({
      where: eq(groupModuleRestrictions.groupId, groupId),
    });
  },

  /**
   * Get action restrictions for a group
   */
  async getActionRestrictions(groupId: number) {
    return db.query.groupActionRestrictions.findMany({
      where: eq(groupActionRestrictions.groupId, groupId),
    });
  },

  /**
   * Remove module restrictions from a group
   */
  async removeModuleRestrictions(groupId: number, modules: string[]) {
    await db
      .delete(groupModuleRestrictions)
      .where(
        and(
          eq(groupModuleRestrictions.groupId, groupId),
          inArray(groupModuleRestrictions.module, modules)
        )
      );

    return { removed: modules.length };
  },

  /**
   * Remove action restrictions from a group
   */
  async removeActionRestrictions(groupId: number, actions: string[]) {
    await db
      .delete(groupActionRestrictions)
      .where(
        and(
          eq(groupActionRestrictions.groupId, groupId),
          inArray(groupActionRestrictions.action, actions)
        )
      );

    return { removed: actions.length };
  },
};
