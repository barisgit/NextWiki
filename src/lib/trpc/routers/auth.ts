/**
 * Auth router - Server only
 */
import "server-only";
import { z } from "zod";
import { router, protectedProcedure } from "~/lib/trpc";
import { authorizationService } from "~/lib/services";
import { PermissionIdentifier, validatePermissionId } from "~/lib/permissions";

// Create a Zod schema for permission identifier
const permissionIdentifierSchema = z.string().refine(
  (val): val is PermissionIdentifier => {
    return validatePermissionId(val);
  },
  {
    message:
      "Invalid permission identifier format. Expected format: module:resource:action",
  }
);

export const authRouter = router({
  // Get the current user's permissions
  getMyPermissions: protectedProcedure.query(async ({ ctx }) => {
    const userId = parseInt(ctx.session.user.id);

    // Get all permissions for the current user
    const permissions = await authorizationService.getUserPermissions(userId);

    // Return permissions in a convenient format for the frontend
    return {
      // Return the full permission objects
      permissions,

      // Return an array of permission names (e.g. ["wiki:page:read", "wiki:page:create"])
      permissionNames: permissions.map((p) => p.name as PermissionIdentifier),

      // Return a map of permissions for easy checking (e.g. {"wiki:page:read": true})
      permissionMap: permissions.reduce((acc, p) => {
        if (validatePermissionId(p.name)) {
          acc[p.name] = true;
        }
        return acc;
      }, {} as Record<PermissionIdentifier, boolean>),
    };
  }),

  // Check if the current user has a specific permission
  hasPermission: protectedProcedure
    .input(z.object({ permission: permissionIdentifierSchema }))
    .query(async ({ ctx, input }) => {
      const userId = parseInt(ctx.session.user.id);
      const hasPermission = await authorizationService.hasPermission(
        userId,
        input.permission
      );
      return hasPermission;
    }),

  // Check if the current user has access to a specific page
  hasPagePermission: protectedProcedure
    .input(
      z.object({
        pageId: z.number(),
        permission: permissionIdentifierSchema,
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = parseInt(ctx.session.user.id);
      const hasPermission = await authorizationService.hasPagePermission(
        userId,
        input.pageId,
        input.permission
      );
      return hasPermission;
    }),
});
