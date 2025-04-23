import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, permissionProtectedProcedure } from "~/server";
import { dbService } from "~/lib/services";
import { logger } from "@repo/logger";

export const groupsRouter = router({
  /**
   * Get all groups
   * @requires system:groups:read
   */
  getAll: permissionProtectedProcedure("system:groups:read").query(async () => {
    const groups = await dbService.groups.getAll();
    return groups;
  }),

  /**
   * Get a single group by ID
   * @requires system:groups:read
   */
  getById: permissionProtectedProcedure("system:groups:read")
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const group = await dbService.groups.getById(input.id);
      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Group not found",
        });
      }
      return group;
    }),

  /**
   * Get all users in a group
   * @requires system:groups:read
   */
  getGroupUsers: permissionProtectedProcedure("system:groups:read")
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      const users = await dbService.groups.getGroupUsers(input.groupId);
      return users;
    }),

  /**
   * Get all permissions for a group
   * @requires system:groups:read
   */
  getGroupPermissions: permissionProtectedProcedure("system:groups:read")
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      const permissions = await dbService.groups.getGroupPermissions(
        input.groupId
      );
      return permissions;
    }),

  /**
   * Create a new group
   * @requires system:groups:create
   */
  create: permissionProtectedProcedure("system:groups:create")
    .input(
      z.object({
        name: z.string().min(3).max(100),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const newGroup = await dbService.groups.create(input);
      return newGroup;
    }),

  /**
   * Update a group
   * @requires system:groups:update
   */
  update: permissionProtectedProcedure("system:groups:update")
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(3).max(100).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const group = await dbService.groups.update(id, data);
      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Group not found",
        });
      }
      return group;
    }),

  /**
   * Delete a group
   * @requires system:groups:delete
   */
  delete: permissionProtectedProcedure("system:groups:delete")
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const groupToCheck = await dbService.groups.getById(input.id);
      if (!groupToCheck) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Group not found",
        });
      }

      if (groupToCheck.isSystem) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot delete a system group.",
        });
      }

      const group = await dbService.groups.delete(input.id);
      if (!group) {
        logger.warn(
          `Attempted to delete group ${input.id} which might have failed or was already gone.`
        );
      }
      return { success: true };
    }),

  /**
   * Add users to a group
   * @requires system:groups:update
   */
  addUsers: permissionProtectedProcedure("system:groups:update")
    .input(
      z.object({
        groupId: z.number(),
        userIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const result = await dbService.groups.addUsers(
        input.groupId,
        input.userIds
      );
      return result;
    }),

  /**
   * Remove users from a group
   * @requires system:groups:update
   */
  removeUsers: permissionProtectedProcedure("system:groups:update")
    .input(
      z.object({
        groupId: z.number(),
        userIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const currentUserId = parseInt(ctx.session.user.id);

      if (input.userIds.includes(currentUserId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot remove yourself from a group.",
        });
      }

      const result = await dbService.groups.removeUsers(
        input.groupId,
        input.userIds
      );
      return result;
    }),

  /**
   * Add permissions to a group
   * @requires system:groups:update
   */
  addPermissions: permissionProtectedProcedure("system:groups:update")
    .input(
      z.object({
        groupId: z.number(),
        permissionIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const result = await dbService.groups.addPermissions(
        input.groupId,
        input.permissionIds
      );
      return result;
    }),

  /**
   * Remove permissions from a group
   * @requires system:groups:update
   */
  removePermissions: permissionProtectedProcedure("system:groups:update")
    .input(
      z.object({
        groupId: z.number(),
        permissionIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const result = await dbService.groups.removePermissions(
        input.groupId,
        input.permissionIds
      );
      return result;
    }),

  /**
   * Add module permissions to a group
   * @requires system:groups:update
   */
  addModulePermissions: permissionProtectedProcedure("system:groups:update")
    .input(
      z.object({
        groupId: z.number(),
        moduleIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const result = await dbService.groups.addModulePermissions(
        input.groupId,
        input.moduleIds
      );
      return result;
    }),

  /**
   * Add action permissions to a group
   * @requires system:groups:update
   */
  addActionPermissions: permissionProtectedProcedure("system:groups:update")
    .input(
      z.object({
        groupId: z.number(),
        actionIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const result = await dbService.groups.addActionPermissions(
        input.groupId,
        input.actionIds
      );
      return result;
    }),

  /**
   * Get module permissions for a group
   * @requires system:groups:read
   */
  getModulePermissions: permissionProtectedProcedure("system:groups:read")
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      const permissions = await dbService.groups.getModulePermissions(
        input.groupId
      );
      return permissions;
    }),

  /**
   * Get action permissions for a group
   * @requires system:groups:read
   */
  getActionPermissions: permissionProtectedProcedure("system:groups:read")
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      const permissions = await dbService.groups.getActionPermissions(
        input.groupId
      );
      return permissions;
    }),

  /**
   * Remove module permissions from a group
   * @requires system:groups:update
   */
  removeModulePermissions: permissionProtectedProcedure("system:groups:update")
    .input(
      z.object({
        groupId: z.number(),
        modules: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const allModules = await dbService.modules.getAll();
      const moduleNameToIdMap = new Map(allModules.map((m) => [m.name, m.id]));

      const moduleIdsToRemove = input.modules
        .map((name) => moduleNameToIdMap.get(name))
        .filter((id): id is number => id !== undefined);

      if (moduleIdsToRemove.length === 0 && input.modules.length > 0) {
        logger.warn(
          `Could not find any module IDs for names: ${input.modules.join(", ")}`
        );
      }

      const result = await dbService.groups.removeModulePermissions(
        input.groupId,
        moduleIdsToRemove
      );
      return result;
    }),

  /**
   * Remove action permissions from a group
   * @requires system:groups:update
   */
  removeActionPermissions: permissionProtectedProcedure("system:groups:update")
    .input(
      z.object({
        groupId: z.number(),
        actions: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const allActions = await dbService.actions.getAll();
      const actionNameToIdMap = new Map(allActions.map((a) => [a.name, a.id]));

      const actionIdsToRemove = input.actions
        .map((name) => actionNameToIdMap.get(name))
        .filter((id): id is number => id !== undefined);

      if (actionIdsToRemove.length === 0 && input.actions.length > 0) {
        logger.warn(
          `Could not find any action IDs for names: ${input.actions.join(", ")}`
        );
      }

      const result = await dbService.groups.removeActionPermissions(
        input.groupId,
        actionIdsToRemove
      );
      return result;
    }),
});
