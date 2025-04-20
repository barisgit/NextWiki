import { ReactNode } from "react";
import { getServerAuthSession } from "~/lib/auth";
import { authorizationService } from "~/lib/services";
import { PermissionIdentifier } from "~/lib/permissions";
import { isPublicPath } from "../utils/path-utils";

interface RequirePermissionProps {
  /**
   * The permission to check for.
   */
  permission: PermissionIdentifier;

  /**
   * The current pathname to check against publicPaths
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
  children: ReactNode;
}

/**
 * Simplified server-side permission component that only renders content
 * if the user is authorized. Returns null otherwise.
 */
export async function RequirePermission({
  permission,
  pathname,
  publicPaths,
  allowGuests = false,
  children,
}: RequirePermissionProps) {
  // Check if path is public
  const isPublic = isPublicPath(pathname, publicPaths);
  if (isPublic) {
    return <>{children}</>;
  }

  // Get session and check auth status
  const session = await getServerAuthSession();
  const isLoggedIn = !!session?.user;
  let isAuthorized = false;

  // If user is logged in, check permissions normally
  if (isLoggedIn && session?.user) {
    const userId = parseInt(session.user.id);
    isAuthorized = await authorizationService.hasPermission(userId, permission);
  }
  // If guests are allowed, check permissions for the guest user
  else if (allowGuests) {
    isAuthorized = await authorizationService.hasPermission(
      undefined,
      permission
    );
  }

  // Only render children if authorized
  return isAuthorized ? <>{children}</> : null;
}
