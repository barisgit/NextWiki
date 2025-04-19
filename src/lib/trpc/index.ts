import { initTRPC, TRPCError } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getServerAuthSession } from "~/lib/auth";
import type { Session } from "next-auth";
import { authorizationService } from "../services/authorization";
import { PermissionIdentifier, validatePermissionId } from "~/lib/permissions";
import type { TRPCPanelMeta } from "trpc-ui";

// Initialize context for tRPC
export async function createContext(opts: FetchCreateContextFnOptions) {
  void opts;
  // Get user session from NextAuth
  const session = await getServerAuthSession();

  return {
    session,
  };
}

// Context type
export type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC server instance
const t = initTRPC.context<Context>().meta<TRPCPanelMeta>().create();

// Create middlewares, procedures, and routers
export const middleware = t.middleware;
export const router = t.router;
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

// Create middleware that checks for a specific permission
export function withPermission(permissionName: PermissionIdentifier) {
  if (!validatePermissionId(permissionName)) {
    throw new Error(`Invalid permission identifier: ${permissionName}`);
  }

  return middleware(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to perform this action",
      });
    }

    const userId = parseInt(ctx.session.user.id);
    const hasPermission = await authorizationService.hasPermission(
      userId,
      permissionName
    );

    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `You don't have the required permission: ${permissionName}`,
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
export function withAnyPermission(permissionNames: PermissionIdentifier[]) {
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
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to perform this action",
      });
    }

    const userId = parseInt(ctx.session.user.id);
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
      ctx: {
        session: ctx.session as Session,
      },
    });
  });
}

// Create a procedure that requires a specific permission
export function permissionProtectedProcedure(
  permissionName: PermissionIdentifier
) {
  return protectedProcedure.use(withPermission(permissionName));
}

// Create a procedure that requires any of the specified permissions
export function permissionAnyProtectedProcedure(
  permissionNames: PermissionIdentifier[]
) {
  return protectedProcedure.use(withAnyPermission(permissionNames));
}
