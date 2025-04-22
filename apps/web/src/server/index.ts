import { initTRPC, TRPCError } from "@trpc/server";
import type { Session } from "next-auth";
import { authorizationService } from "~/lib/services/authorization";
import { PermissionIdentifier, validatePermissionId } from "@repo/db";
import type { TRPCPanelMeta } from "trpc-ui";
import { Context } from "./context";
import { logger } from "~/lib/utils/logger";

// Initialize tRPC server instance
const t = initTRPC.context<Context>().meta<TRPCPanelMeta>().create();

// Create middlewares, procedures, and routers
export const middleware = t.middleware;
export const router = t.router;
export const mergeRouters = t.mergeRouters;
export const publicProcedure = t.procedure;

// Create protected procedure that requires authentication
const isAuthenticated = middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  return next({
    ctx: {
      session: ctx.session as Session,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthenticated);

// Allow guest access middleware
// This middleware doesn't throw if user isn't logged in, but passes undefined userId to permission checks
const allowGuests = middleware(async ({ ctx, next }) => {
  if (ctx.session?.user) {
    // User is logged in, use their session
    return next({
      ctx: {
        session: ctx.session as Session,
      },
    });
  }

  // User is not logged in (guest), continue with empty session
  return next({
    ctx: {
      // Pass undefined session so that the permission middleware will check guest group
      guestAccess: true,
    },
  });
});

export const guestProcedure = t.procedure.use(allowGuests);

// Create middleware that checks for a specific permission
// allowGuests parameter controls whether to allow guest access
export function withPermission(
  permissionName: PermissionIdentifier,
  allowGuests = false
) {
  if (!validatePermissionId(permissionName)) {
    logger.error(`Invalid permission identifier: ${permissionName}`);
    throw new Error(`Invalid permission identifier: ${permissionName}`);
  }

  return middleware(async ({ ctx, next }) => {
    // Handle guest access differently - userId will be undefined
    const userId = ctx.session?.user
      ? parseInt(ctx.session.user.id)
      : undefined;

    // If guest access is not allowed and user is not logged in
    if (!allowGuests && userId === undefined) {
      logger.error("User is not logged in");
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to perform this action",
      });
    }

    const hasPermission = await authorizationService.hasPermission(
      userId,
      permissionName
    );

    if (!hasPermission) {
      logger.error(`User does not have permission: ${permissionName}`);
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `You don't have the required permission: ${permissionName}`,
      });
    }

    if (allowGuests && userId === undefined) {
      return next({
        ctx: {
          guestAccess: true,
        },
      });
    }

    return next({
      ctx: {
        session: ctx.session as Session,
      },
    });
  });
}

// Create middleware that checks for any of the specified permissions
// allowGuests parameter controls whether to allow guest access
export function withAnyPermission(
  permissionNames: PermissionIdentifier[],
  allowGuests = false
) {
  // Validate all permission IDs
  const invalidPermissions = permissionNames.filter(
    (p) => !validatePermissionId(p)
  );
  if (invalidPermissions.length > 0) {
    throw new Error(
      `Invalid permission identifiers: ${invalidPermissions.join(", ")}`
    );
  }

  if (permissionNames.length === 0) {
    throw new Error(
      "No permissions specified for withAnyPermission middleware"
    );
  }

  return middleware(async ({ ctx, next }) => {
    // Handle guest access differently - userId will be undefined
    const userId = ctx.session?.user
      ? parseInt(ctx.session.user.id)
      : undefined;

    // If guest access is not allowed and user is not logged in
    if (!allowGuests && userId === undefined) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to perform this action",
      });
    }

    const hasAnyPermission = await authorizationService.hasAnyPermission(
      userId,
      permissionNames
    );

    if (!hasAnyPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `You don't have any of the required permissions: ${permissionNames.join(
          ", "
        )}`,
      });
    }

    return next({
      ctx: ctx.session
        ? {
            session: ctx.session as Session,
          }
        : {
            guestAccess: true,
          },
    });
  });
}

// Create a procedure that requires a specific permission
export function permissionProtectedProcedure(
  permissionName: PermissionIdentifier,
  allowGuests = false
) {
  return protectedProcedure.use(withPermission(permissionName, allowGuests));
}

// Create a procedure that requires any of the specified permissions
export function permissionAnyProtectedProcedure(
  permissionNames: PermissionIdentifier[],
  allowGuests = false
) {
  return protectedProcedure.use(
    withAnyPermission(permissionNames, allowGuests)
  );
}

// Create a procedure that allows guest access and checks permission against guest group
export function permissionGuestProcedure(permissionName: PermissionIdentifier) {
  return guestProcedure.use(withPermission(permissionName, true));
}

// Create a procedure that allows guest access and checks any of the permissions
export function permissionAnyGuestProcedure(
  permissionNames: PermissionIdentifier[]
) {
  return guestProcedure.use(withAnyPermission(permissionNames, true));
}
