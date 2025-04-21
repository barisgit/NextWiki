"use client";

/**
 * Client utilities for permissions
 * These utilities should be safe to use in client components
 */
import {
  PermissionIdentifier,
  validatePermissionId,
  getAllPermissionIds,
} from "./index";
import { logger } from "~/lib/utils/logger";

/**
 * Client-side function to check if a permission identifier is valid
 */
export function isValidPermissionId(id: string): id is PermissionIdentifier {
  return validatePermissionId(id);
}

/**
 * Get a list of all permission identifiers (client-safe)
 */
export function getPermissionList(): PermissionIdentifier[] {
  return getAllPermissionIds();
}

/**
 * Client-side helper to check permission map
 */
export function checkPermission(
  permissionMap: Record<PermissionIdentifier, boolean> | undefined,
  permission: PermissionIdentifier
): boolean {
  if (!permissionMap) return false;

  if (!validatePermissionId(permission)) {
    logger.warn(`Invalid permission identifier: ${permission}`);
    return false;
  }

  return !!permissionMap[permission];
}

/**
 * Client-side helper to check if user has any of the specified permissions
 */
export function checkAnyPermission(
  permissionMap: Record<PermissionIdentifier, boolean> | undefined,
  permissions: PermissionIdentifier[]
): boolean {
  if (!permissionMap || permissions.length === 0) return false;

  // Check if any invalid permissions
  const invalidPermissions = permissions.filter(
    (p) => !validatePermissionId(p)
  );
  if (invalidPermissions.length > 0) {
    logger.warn(
      `Invalid permission identifiers: ${invalidPermissions.join(", ")}`
    );
    return false;
  }

  // Return true if any permission is found in the map
  return permissions.some((permission) => !!permissionMap[permission]);
}
