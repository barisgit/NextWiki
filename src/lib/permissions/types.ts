/**
 * Permission system types
 */

/**
 * Valid permission modules in the system
 */
export type PermissionModule = "wiki" | "system" | "assets";

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
  | "asset";

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
 */
export type PermissionIdentifier =
  `${PermissionModule}:${PermissionResource}:${PermissionAction}`;
