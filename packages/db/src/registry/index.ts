import { PERMISSIONS } from "./permissions.js";

// Re-export types and functions from other registry files
export * from "./types.js";
export * from "./permissions.js";

/**
 * Type for the strict permission identifier string derived from the actual registry.
 * Ensures only valid, registered permission identifiers are included.
 */
export type PermissionIdentifier = keyof typeof PERMISSIONS;

/**
 * Function to assert that a string is a valid PermissionIdentifier.
 * Useful for type narrowing.
 * @param id The string to check.
 * @returns True if the string is a valid PermissionIdentifier, false otherwise.
 */
export function isPermissionIdentifier(id: string): id is PermissionIdentifier {
  // Get the actual keys from the PERMISSIONS object and check for inclusion
  const validIds = Object.keys(PERMISSIONS) as PermissionIdentifier[];
  return validIds.includes(id as PermissionIdentifier);
}
