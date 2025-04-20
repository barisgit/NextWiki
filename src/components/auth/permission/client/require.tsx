"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PermissionIdentifier } from "~/lib/permissions";
import { usePermissions } from "../utils/usePermissions";
import { isPublicPath } from "../utils/path-utils";

interface ClientRequirePermissionProps {
  /**
   * The permission to check for.
   */
  permission: PermissionIdentifier;

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

  /**
   * Content to show when user is not authorized
   */
  fallback?: ReactNode;
}

/**
 * Simplified client-side permission component that only renders content
 * if the user is authorized. Returns fallback or null otherwise.
 */
export function ClientRequirePermission({
  permission,
  publicPaths,
  allowGuests = false,
  children,
  fallback = null,
}: ClientRequirePermissionProps) {
  // Get permission state from context
  const { hasPermission, isGuest, isLoading } = usePermissions();
  const pathname = usePathname();

  // If still loading permissions, show nothing or fallback
  if (isLoading) {
    return fallback ? <>{fallback}</> : null;
  }

  // Check if path is public
  const isPublic = isPublicPath(pathname, publicPaths);

  // Determine if user is authorized
  let isAuthorized = false;
  if (isPublic) {
    isAuthorized = true;
  } else if (isGuest && !allowGuests) {
    isAuthorized = false;
  } else {
    isAuthorized = hasPermission(permission);
  }

  // Only render children if authorized, otherwise show fallback
  return isAuthorized ? <>{children}</> : fallback ? <>{fallback}</> : null;
}
