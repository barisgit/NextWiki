import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/lib/auth";
import { authorizationService } from "~/lib/services";
import { PermissionIdentifier } from "~/lib/permissions";

// --- Helper function to check if current path is public ---
function isPublicPath(pathname: string, publicPaths?: string[]): boolean {
  if (!publicPaths || publicPaths.length === 0) {
    return false;
  }

  return publicPaths.some((publicPath) => {
    if (publicPath.endsWith("*")) {
      // Wildcard match: check if pathname starts with the prefix
      const prefix = publicPath.slice(0, -1);
      // Ensure the prefix match is at a path segment boundary or exact match
      return pathname.startsWith(prefix);
    } else {
      // Exact match
      return pathname === publicPath;
    }
  });
}

// --- Permission Gate Component ---
interface PermissionGateServerProps {
  /**
   * The permission to check for.
   */
  permission?: PermissionIdentifier;

  /**
   * The permissions to check for, needs any to be true.
   */
  permissions?: PermissionIdentifier[];

  /**
   * The current pathname (from usePathname() in parent)
   */
  pathname: string;

  /**
   * Paths that are exempt from the permission check.
   */
  publicPaths?: string[];

  /**
   * Whether to allow guest access (non-authenticated users)
   */
  allowGuests?: boolean;

  /**
   * Content to show when user is authorized
   */
  authorized: ReactNode;

  /**
   * Content to show when user is unauthorized (but logged in)
   */
  unauthorized?: ReactNode;

  /**
   * Content to show when user is not logged in
   */
  notLoggedIn?: ReactNode;

  /**
   * Optional redirect path when unauthorized
   */
  redirectUnauthorized?: string;

  /**
   * Optional redirect path when not logged in
   */
  redirectNotLoggedIn?: string;
}

/**
 * Server-side only permission gate component that returns the appropriate
 * content based on user permissions.
 * This component completely handles permission checking on the server and
 * only returns the approved content to the client.
 */
export async function ServerPermissionGate({
  permission,
  permissions,
  pathname,
  publicPaths,
  allowGuests = false,
  authorized,
  unauthorized,
  notLoggedIn,
  redirectUnauthorized,
  redirectNotLoggedIn,
}: PermissionGateServerProps) {
  if (permission && permissions) {
    throw new Error(
      "ServerPermissionGate requires either 'permission' or 'permissions' prop, not both."
    );
  }
  if (!permission && !permissions) {
    throw new Error(
      "ServerPermissionGate requires either 'permission' or 'permissions' prop."
    );
  }

  // Check if path is public
  const isPublic = isPublicPath(pathname, publicPaths);
  if (isPublic) {
    return <>{authorized}</>;
  }

  // Get session and check auth status
  const session = await getServerAuthSession();
  const isLoggedIn = !!session?.user;
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

  // Return the appropriate content based on authorization status
  if (isAuthorized) {
    return <>{authorized}</>;
  } else if (isLoggedIn) {
    if (redirectUnauthorized) {
      redirect(redirectUnauthorized);
    }
    return unauthorized ? <>{unauthorized}</> : null;
  } else {
    if (redirectNotLoggedIn) {
      redirect(redirectNotLoggedIn);
    }
    return notLoggedIn ? <>{notLoggedIn}</> : null;
  }
}
