import { ReactNode } from "react";
import { headers } from "next/headers";
import { getServerAuthSession } from "~/lib/auth";
import { authorizationService } from "~/lib/services";
import { PermissionIdentifier } from "~/lib/permissions";
import { isPublicPath } from "../utils/path-utils";

interface RequirePermissionProps {
  /**
   * The single permission to check for.
   * Use either this or `permissions`, not both.
   */
  permission?: PermissionIdentifier;

  /**
   * An array of permissions to check for. Access is granted if the user has *any* of these.
   * Use either this or `permission`, not both.
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
   * Content to show when user is authorized
   */
  children: ReactNode;
}

/**
 * Simplified server-side permission component that only renders content
 * if the user is authorized (based on single permission or any in a list).
 * Returns null otherwise.
 */
export async function RequirePermission({
  permission,
  permissions,
  publicPaths,
  allowGuests = false,
  children,
}: RequirePermissionProps) {
  // --- Validation ---
  if (permission && permissions) {
    throw new Error(
      "RequirePermission requires either 'permission' or 'permissions' prop, not both."
    );
  }
  if (!permission && !permissions) {
    throw new Error(
      "RequirePermission requires either 'permission' or 'permissions' prop."
    );
  }

  // --- Path Check ---
  let isPublic = false;
  if (publicPaths) {
    const headersList = await headers();
    // Try various headers to get the path
    const referer = headersList.get("referer") || "";
    const xUrl = headersList.get("x-url") || "";
    const pathname = referer ? new URL(referer).pathname : xUrl ? xUrl : "/";
    isPublic = isPublicPath(pathname, publicPaths);
  }

  // If path is public, always render children
  if (isPublic) {
    return <>{children}</>;
  }

  // --- Authorization Check ---
  const session = await getServerAuthSession();
  const isLoggedIn = !!session?.user;
  let isAuthorized = false;
  const userId = session?.user ? parseInt(session.user.id) : undefined;

  // Check permissions based on whether user is logged in or guest access is allowed
  if (isLoggedIn || (allowGuests && userId === undefined)) {
    if (permission) {
      isAuthorized = await authorizationService.hasPermission(
        userId, // undefined for guests if allowGuests is true
        permission
      );
    } else if (permissions) {
      isAuthorized = await authorizationService.hasAnyPermission(
        userId, // undefined for guests if allowGuests is true
        permissions
      );
    }
  }

  // --- Rendering ---
  // Only render children if authorized (and not public, handled above)
  return isAuthorized ? <>{children}</> : null;
}
