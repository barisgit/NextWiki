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
   * The children to render if the permission check passes.
   */
  children: ReactNode;
}

/**
 * Root component for permission checks.
 * Fetches auth session and permission status, then provides it via context
 * by using a client-side provider component.
 * Handles either a single permission or checks for any of multiple permissions.
 */
export async function PermissionRoot({
  permission,
  permissions,
  publicPaths,
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
  let isAuthorized = false;

  if (isLoggedIn) {
    const userId = parseInt(session!.user.id);
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

  return (
    <PermissionProvider
      isLoggedIn={isLoggedIn}
      isAuthorized={isAuthorized}
      publicPaths={publicPaths}
    >
      {children}
    </PermissionProvider>
  );
}
