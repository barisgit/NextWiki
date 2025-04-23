import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, permissionProtectedProcedure } from "~/server";
import { dbService } from "~/lib/services";

export const permissionsRouter = router({
  /**
   * Get all permissions
   */
  getAll: permissionProtectedProcedure("system:permissions:read").query(
    async () => {
      const permissions = await dbService.permissions.getAll();
      return permissions;
    }
  ),

  /**
   * Get all unique modules
   */
  getModules: permissionProtectedProcedure("system:permissions:read").query(
    async () => {
      const modules = await dbService.modules.getAll();
      return modules;
    }
  ),

  /**
   * Get all unique actions
   */
  getActions: permissionProtectedProcedure("system:permissions:read").query(
    async () => {
      const actions = await dbService.actions.getAll();
      return actions;
    }
  ),

  /**
   * Get a permission by ID
   */
  getById: permissionProtectedProcedure("system:settings:read")
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const permission = await dbService.permissions.getById(input.id);
      if (!permission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Permission not found",
        });
      }
      return permission;
    }),

  /**
   * Create a new permission (very restricted operation)
   */
  create: permissionProtectedProcedure("system:settings:update")
    .input(
      z.object({
        moduleId: z.number(),
        resource: z.string().min(1).max(50),
        actionId: z.number(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const newPermission = await dbService.permissions.create(input);
      return newPermission;
    }),

  /**
   * Update a permission
   */
  update: permissionProtectedProcedure("system:settings:update")
    .input(
      z.object({
        id: z.number(),
        moduleId: z.number().optional(),
        resource: z.string().min(1).max(50).optional(),
        actionId: z.number().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const permission = await dbService.permissions.update(id, data);
      if (!permission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Permission not found",
        });
      }
      return permission;
    }),

  /**
   * Delete a permission
   */
  delete: permissionProtectedProcedure("system:settings:update")
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const permission = await dbService.permissions.delete(input.id);
      if (!permission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Permission not found",
        });
      }
      return { success: true };
    }),
});
