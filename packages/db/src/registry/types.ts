/**
 * Permission system types
 */

/**
 * Valid permission modules in the system
 */
export type PermissionModule = "wiki" | "system" | "assets" | "admin";

/**
 * Valid permission actions in the system
 */
export type PermissionAction = "create" | "read" | "update" | "delete" | "move";

/**
 * Valid permission resources in the system
 */
export type PermissionResource =
  | "page"
  | "settings"
  | "permissions"
  | "users"
  | "groups"
  | "asset"
  | "general"
  | "dashboard"
  | "wiki";

/**
 * Unified permission structure
 */
export interface Permission {
  module: PermissionModule;
  resource: PermissionResource;
  action: PermissionAction;
  description: string;
}

/**
 * Type for the permission identifier string in format module:resource:action
 * Represents any possible combination based on defined modules, resources, and actions.
 * For a stricter type derived from actual registered permissions, use `PermissionIdentifier`
 * from `packages/db/src/registry/index.ts`.
 */
export type PossiblePermissionIdentifier =
  `${PermissionModule}:${PermissionResource}:${PermissionAction}`;
