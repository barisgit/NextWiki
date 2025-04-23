import {
  Permission,
  PossiblePermissionIdentifier,
  PermissionModule,
  PermissionAction,
  PermissionResource,
} from "./types.js";

/**
 * Define all system permissions
 */
const PERMISSION_LIST: Permission[] = [
  // Wiki module permissions
  {
    module: "wiki",
    resource: "page",
    action: "create",
    description: "Create new wiki pages",
  },
  {
    module: "wiki",
    resource: "page",
    action: "read",
    description: "Read wiki pages",
  },
  {
    module: "wiki",
    resource: "page",
    action: "update",
    description: "Update wiki pages",
  },
  {
    module: "wiki",
    resource: "page",
    action: "delete",
    description: "Delete wiki pages",
  },
  {
    module: "wiki",
    resource: "page",
    action: "move",
    description: "Move or rename wiki pages",
  },

  // System module permissions
  {
    module: "system",
    resource: "settings",
    action: "read",
    description: "View system settings",
  },
  {
    module: "system",
    resource: "settings",
    action: "update",
    description: "Update system settings",
  },
  {
    module: "system",
    resource: "permissions",
    action: "read",
    description: "View system permissions",
  },
  {
    module: "system",
    resource: "permissions",
    action: "update",
    description: "Update system permissions",
  },
  {
    module: "system",
    resource: "users",
    action: "read",
    description: "View user list",
  },
  {
    module: "system",
    resource: "users",
    action: "create",
    description: "Create new users",
  },
  {
    module: "system",
    resource: "users",
    action: "update",
    description: "Update existing users",
  },
  {
    module: "system",
    resource: "users",
    action: "delete",
    description: "Delete users",
  },
  {
    module: "system",
    resource: "groups",
    action: "read",
    description: "View group list",
  },
  {
    module: "system",
    resource: "groups",
    action: "create",
    description: "Create new groups",
  },
  {
    module: "system",
    resource: "groups",
    action: "update",
    description: "Update existing groups",
  },
  {
    module: "system",
    resource: "groups",
    action: "delete",
    description: "Delete groups",
  },

  // Assets module permissions
  {
    module: "assets",
    resource: "asset",
    action: "create",
    description: "Upload assets (images, files, etc.)",
  },
  {
    module: "assets",
    resource: "asset",
    action: "read",
    description: "View assets",
  },
  {
    module: "assets",
    resource: "asset",
    action: "update",
    description: "Update assets",
  },
  {
    module: "assets",
    resource: "asset",
    action: "delete",
    description: "Delete assets",
  },
];

/**
 * Creates a permission identifier from a permission object
 */
export function createPermissionId(
  permission: Permission
): PossiblePermissionIdentifier {
  return `${permission.module}:${permission.resource}:${permission.action}`;
}

/**
 * Build the permissions record from the list
 */
export const PERMISSIONS: Record<PossiblePermissionIdentifier, Permission> =
  PERMISSION_LIST.reduce<Record<PossiblePermissionIdentifier, Permission>>(
    (acc, permission) => {
      const id = createPermissionId(permission);
      acc[id] = permission;
      return acc;
    },
    {} as Record<PossiblePermissionIdentifier, Permission>
  );

/**
 * Validates if a string is a valid permission identifier by checking against the generated PERMISSIONS object.
 */
export function validatePermissionId(
  id: string
): id is PossiblePermissionIdentifier {
  return id in PERMISSIONS;
}

/**
 * Gets all permissions from the registry
 */
export function getAllPermissions(): Permission[] {
  return PERMISSION_LIST;
}

/**
 * Gets all permission identifiers
 */
export function getAllPermissionIds(): PossiblePermissionIdentifier[] {
  return Object.keys(PERMISSIONS) as PossiblePermissionIdentifier[];
}

/**
 * Gets all available permission modules
 */
export function getAvailableModules(): PermissionModule[] {
  const modules = new Set<PermissionModule>();
  getAllPermissions().forEach((permission) => {
    modules.add(permission.module);
  });
  return Array.from(modules);
}

/**
 * Gets all available permission actions
 */
export function getAvailableActions(): PermissionAction[] {
  const actions = new Set<PermissionAction>();
  getAllPermissions().forEach((permission) => {
    actions.add(permission.action);
  });
  return Array.from(actions);
}

/**
 * Gets all available permission resources
 */
export function getAvailableResources(): PermissionResource[] {
  const resources = new Set<PermissionResource>();
  getAllPermissions().forEach((permission) => {
    resources.add(permission.resource);
  });
  return Array.from(resources);
}
