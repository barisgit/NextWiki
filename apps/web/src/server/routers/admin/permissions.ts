import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, permissionProtectedProcedure } from "~/server";
import { dbService } from "~/lib/services";
// Import validation functions
import {
  validatePermissionsDatabase,
  fixPermissionsDatabase,
  logValidationResults,
} from "~/lib/permissions/validation";
import { logger } from "@repo/logger";

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
   * Update a permission (very restricted operation)
   */
  update: permissionProtectedProcedure("system:settings:update")
    .input(
      z.object({
        id: z.number(),
        moduleId: z.number().optional(),
        resource: z.string().min(1).max(50).optional(),
        actionId: z.number().optional(),
        description: z.string().nullish(), // Allow null or undefined from client
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      // Convert null description to undefined for the service call
      const serviceUpdateData = {
        ...updateData,
        description:
          updateData.description === null ? undefined : updateData.description,
      };
      const updatedPermission = await dbService.permissions.update(
        id,
        serviceUpdateData // Pass the corrected data
      );
      if (!updatedPermission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Permission not found for update",
        });
      }
      return updatedPermission;
    }),

  /**
   * Delete a permission (very restricted operation)
   */
  delete: permissionProtectedProcedure("system:settings:update")
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const deletedPermission = await dbService.permissions.delete(input.id);
      if (!deletedPermission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Permission not found for deletion",
        });
      }
      return deletedPermission;
    }),

  /**
   * Validate permissions registry against database
   */
  validate: permissionProtectedProcedure("system:settings:read").mutation(
    async () => {
      logger.info("Running permissions validation...");
      const validationResult = await validatePermissionsDatabase();
      logValidationResults(validationResult); // Log details on the server
      // Return a summary to the client
      return {
        isValid: validationResult.isValid,
        missingCount: validationResult.missing.length,
        extrasCount: validationResult.extras.length,
        mismatchedCount: validationResult.mismatched.length,
      };
    }
  ),

  /**
   * Fix permissions in the database based on the registry
   */
  fix: permissionProtectedProcedure("system:settings:update")
    .input(
      z.object({
        removeExtras: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      logger.info(
        `Running permissions fix (removeExtras: ${input.removeExtras})...`
      );
      const fixResult = await fixPermissionsDatabase(input.removeExtras);
      logger.info(
        `Permissions fix completed: ${fixResult.added} added, ${fixResult.updated} updated, ${fixResult.removed} removed.`
      );
      return fixResult; // Return counts to the client
    }),
});
