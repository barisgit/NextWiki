import { ReactNode } from "react";
import { getServerAuthSession } from "~/lib/auth";
import { authorizationService } from "~/lib/services";
import { PermissionIdentifier } from "~/lib/permissions";
import { PermissionProvider } from "./provider-client";

interface PermissionRootProps {
  /**
   * The permission to check for.
   */
  permission?: PermissionIdentifier;

  /**
   * The permissions to check for, needs any to be true.
   */
  permissions?: PermissionIdentifier[];

  /**
   * Paths that are exempt from the permission check.
   */
  publicPaths?: string[];

  /**
   * Whether to allow guest access (non-authenticated users)
   */
  allowGuests?: boolean;

  /**
   * The children to render if the permission check passes.
   */
  children: ReactNode;
}

/**
 * Root component for permission checks.
 * Fetches auth session and permission status, then provides it via context
 * by using a client-side provider component.
 * Handles either a single permission or checks for any of multiple permissions.
 * Can also handle guest users (non-authenticated) when allowGuests is true.
 */
export async function PermissionRoot({
  permission,
  permissions,
  publicPaths,
  allowGuests = false,
  children,
}: PermissionRootProps) {
  if (permission && permissions) {
    throw new Error(
      "Permission.Root requires either 'permission' or 'permissions' prop, not both."
    );
  }
  if (!permission && !permissions) {
    throw new Error(
      "Permission.Root requires either 'permission' or 'permissions' prop."
    );
  }

  const session = await getServerAuthSession();
  const isLoggedIn = !!session?.user;
  const isGuest = !isLoggedIn;
  let isAuthorized = false;

  // If user is logged in, check permissions normally
  if (isLoggedIn && session?.user) {
    const userId = parseInt(session.user.id);
    if (permission) {
      isAuthorized = await authorizationService.hasPermission(
        userId,
        permission
      );
    } else if (permissions) {
      isAuthorized = await authorizationService.hasAnyPermission(
        userId,
        permissions
      );
    }
  }
  // If guests are allowed, check permissions for the guest user (undefined userId)
  else if (allowGuests) {
    // Check permissions for guest user (undefined userId)
    if (permission) {
      isAuthorized = await authorizationService.hasPermission(
        undefined,
        permission
      );
    } else if (permissions) {
      isAuthorized = await authorizationService.hasAnyPermission(
        undefined,
        permissions
      );
    }
  }

  return (
    <PermissionProvider
      isLoggedIn={isLoggedIn}
      isAuthorized={isAuthorized}
      isGuest={isGuest}
      publicPaths={publicPaths}
    >
      {children}
    </PermissionProvider>
  );
}
