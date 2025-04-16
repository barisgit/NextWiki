import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, permissionProtectedProcedure } from "~/lib/trpc";
import { dbService } from "~/lib/services";

export const groupsRouter = router({
  // Get all groups
  getAll: permissionProtectedProcedure("system:groups:read").query(async () => {
    const groups = await dbService.groups.getAll();
    return groups;
  }),

  // Get a single group by ID
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

  // Get all users in a group
  getGroupUsers: permissionProtectedProcedure("system:groups:read")
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      const users = await dbService.groups.getGroupUsers(input.groupId);
      return users;
    }),

  // Get all permissions for a group
  getGroupPermissions: permissionProtectedProcedure("system:groups:read")
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      const permissions = await dbService.groups.getGroupPermissions(
        input.groupId
      );
      return permissions;
    }),

  // Create a new group
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

  // Update a group
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

  // Delete a group
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
      if (groupToCheck.isLocked) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot delete a locked group.",
        });
      }

      const group = await dbService.groups.delete(input.id);
      if (!group) {
        console.warn(
          `Attempted to delete group ${input.id} which might have failed or was already gone.`
        );
      }
      return { success: true };
    }),

  // Add users to a group
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

  // Remove users from a group
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

  // Add permissions to a group
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

  // Remove permissions from a group
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

  // Add module restrictions to a group
  addModuleRestrictions: permissionProtectedProcedure("system:groups:update")
    .input(
      z.object({
        groupId: z.number(),
        restrictions: z.array(
          z.object({
            module: z.string(),
            isAllowed: z.boolean(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const result = await dbService.groups.addModuleRestrictions(
        input.groupId,
        input.restrictions.map((r) => r.module)
      );
      return result;
    }),

  // Add action restrictions to a group
  addActionRestrictions: permissionProtectedProcedure("system:groups:update")
    .input(
      z.object({
        groupId: z.number(),
        restrictions: z.array(
          z.object({
            action: z.string(),
            isAllowed: z.boolean(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const result = await dbService.groups.addActionRestrictions(
        input.groupId,
        input.restrictions.map((r) => r.action)
      );
      return result;
    }),

  // Get module restrictions for a group
  getModuleRestrictions: permissionProtectedProcedure("system:groups:read")
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      const restrictions = await dbService.groups.getModuleRestrictions(
        input.groupId
      );
      return restrictions;
    }),

  // Get action restrictions for a group
  getActionRestrictions: permissionProtectedProcedure("system:groups:read")
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      const restrictions = await dbService.groups.getActionRestrictions(
        input.groupId
      );
      return restrictions;
    }),

  // Remove module restrictions from a group
  removeModuleRestrictions: permissionProtectedProcedure("system:groups:update")
    .input(
      z.object({
        groupId: z.number(),
        modules: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const result = await dbService.groups.removeModuleRestrictions(
        input.groupId,
        input.modules
      );
      return result;
    }),

  // Remove action restrictions from a group
  removeActionRestrictions: permissionProtectedProcedure("system:groups:update")
    .input(
      z.object({
        groupId: z.number(),
        actions: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const result = await dbService.groups.removeActionRestrictions(
        input.groupId,
        input.actions
      );
      return result;
    }),
});
