/**
 * Auth router - Server only
 */
import { z } from "zod";
import {
  router,
  protectedProcedure,
  guestProcedure,
  publicProcedure,
} from "~/server";
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
  getMyPermissions: publicProcedure.query(async ({ ctx }) => {
    let userId = undefined;
    if (ctx.session) {
      userId = parseInt(ctx.session.user.id);
    }

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

  // Check if the current user has any of the specified permissions
  hasAnyPermission: protectedProcedure
    .input(z.object({ permissions: z.array(permissionIdentifierSchema) }))
    .query(async ({ ctx, input }) => {
      const userId = parseInt(ctx.session.user.id);
      const hasAnyPermission = await authorizationService.hasAnyPermission(
        userId,
        input.permissions
      );
      return hasAnyPermission;
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

  // Create a procedure to get guest permissions
  getGuestPermissions: guestProcedure
    .meta({
      description: "Get permissions for guest users",
    })
    .query(async () => {
      // Get guest permissions using the authorization service
      const guestGroupId = await authorizationService.getGuestGroupId();

      if (!guestGroupId) {
        // Return empty permissions if no guest group defined
        return {
          permissions: [],
          permissionNames: [],
          permissionMap: {},
        };
      }

      // Guest users have userId undefined
      const permissions = await authorizationService.getUserPermissions(
        undefined
      );

      // Collect permission names
      const permissionNames = permissions.map(
        (p) => `${p.module}:${p.resource}:${p.action}` as PermissionIdentifier
      );

      // Create a map for easy lookup
      const permissionMap = permissions.reduce((acc, permission) => {
        const id =
          `${permission.module}:${permission.resource}:${permission.action}` as PermissionIdentifier;
        acc[id] = true;
        return acc;
      }, {} as Record<PermissionIdentifier, boolean>);

      return {
        permissions,
        permissionNames,
        permissionMap,
      };
    }),
});
