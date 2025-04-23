// Client-safe exports for the @repo/db package

// Re-export all types from the schema index
// These are stripped by the build process and safe for client import
export type * from "./schema/index.js";

// Re-export types from the registry
export type {
  Permission,
  PermissionModule,
  PermissionAction,
  PermissionResource,
  PermissionIdentifier,
  PossiblePermissionIdentifier,
} from "./registry/index.js";

// Re-export specific functions from the registry that are client-safe
export {
  validatePermissionId,
  getAllPermissionIds,
  getAllPermissions,
} from "./registry/permissions.js";

// DO NOT export the db instance, seed function, or server-only functions here.
