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
    console.warn(`Invalid permission identifier: ${permission}`);
    return false;
  }

  return !!permissionMap[permission];
}
