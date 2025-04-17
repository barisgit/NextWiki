/**
 * Permissions system barrel file
 * This file exports all types and functions from the permissions system
 * that are safe to use in both client and server components.
 */

// Export types
export * from "./types";

// Export registry functions (client-safe)
export {
  validatePermissionId,
  getAllPermissionIds,
  getAvailableModules,
  getAvailableActions,
  getAvailableResources,
  PERMISSIONS,
  createPermissionId,
  getAllPermissions,
} from "./registry";

// Do NOT export validation functions that access the database
// Those are server-only and should be imported from ./server
