"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import { PermissionIdentifier } from "@repo/db/client";
import { usePermissions } from "../utils/usePermissions";
import { isPublicPath } from "../utils/path-utils";
import { logger } from "@repo/logger";

interface ClientRequirePermissionProps {
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

  /**
   * Content to show when user is not authorized
   */
  fallback?: ReactNode;
}

/**
 * Simplified client-side permission component that only renders content
 * if the user is authorized (based on single permission or any in a list).
 * Returns fallback or null otherwise.
 */
export function ClientRequirePermission({
  permission,
  permissions,
  publicPaths,
  allowGuests = false,
  children,
  fallback = null,
}: ClientRequirePermissionProps) {
  // --- Validation (Client-side warning) ---
  useEffect(() => {
    if (permission && permissions) {
      logger.warn(
        "ClientRequirePermission received both 'permission' and 'permissions' props. Use only one."
      );
    }
    if (!permission && !permissions) {
      logger.warn(
        "ClientRequirePermission requires either 'permission' or 'permissions' prop."
      );
    }
  }, [permission, permissions]);

  // --- Get Context Data ---
  const { hasPermission, hasAnyPermission, isGuest, isLoading } =
    usePermissions();
  const pathname = usePathname();

  // --- Loading State ---
  if (isLoading) {
    return fallback ? <>{fallback}</> : null;
  }

  // --- Path Check ---
  const isPublic = isPublicPath(pathname, publicPaths);

  // --- Authorization Check ---
  let isAuthorized = false;
  if (isPublic) {
    isAuthorized = true;
  } else if (isGuest && !allowGuests) {
    isAuthorized = false;
  } else {
    // Check based on provided props
    if (permission) {
      isAuthorized = hasPermission(permission);
    } else if (permissions) {
      isAuthorized = hasAnyPermission(permissions);
    } else {
      // Should not happen due to validation, but default to false
      isAuthorized = false;
    }
  }

  // --- Rendering ---
  // Only render children if authorized, otherwise show fallback
  return isAuthorized ? <>{children}</> : fallback ? <>{fallback}</> : null;
}
