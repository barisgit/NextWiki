import { db } from "@repo/db";
import {
  userGroups,
  groupPermissions,
  permissions,
  pagePermissions,
  groups,
  modules,
  actions,
} from "@repo/db";
import { eq, and, inArray, or, isNull } from "drizzle-orm";
import { PermissionIdentifier, validatePermissionId } from "@repo/db";
import { logger } from "@repo/logger";

/**
 * Authorization Service
 *
 * Provides functions for checking user permissions
 */
export const authorizationService = {
  /**
   * Get guest group ID from the database
   * This is cached to avoid repeated database lookups
   */
  _cachedGuestGroupId: null as number | null,

  async getGuestGroupId(): Promise<number | null> {
    // If we already have the ID cached, return it
    if (this._cachedGuestGroupId !== null) {
      return this._cachedGuestGroupId;
    }

    // Look up the "Guests" group in the database
    const guestGroup = await db.query.groups.findFirst({
      where: eq(groups.name, "Guests"),
      columns: { id: true },
    });

    // Cache the result (even if null)
    this._cachedGuestGroupId = guestGroup?.id ?? null;
    return this._cachedGuestGroupId;
  },

  /**
   * Reset the cached guest group ID (useful after seeding)
   */
  resetGuestGroupCache() {
    this._cachedGuestGroupId = null;
  },

  /**
   * Get all groups for a user
   */
  async getUserGroups(userId: number | undefined) {
    // If userId is undefined, return the guest group if available
    if (userId === undefined) {
      const guestGroupId = await this.getGuestGroupId();
      if (guestGroupId) {
        const guestGroup = await db.query.groups.findFirst({
          where: eq(groups.id, guestGroupId),
        });
        return guestGroup ? [guestGroup] : [];
      }
      return [];
    }

    const userGroupsData = await db.query.userGroups.findMany({
      where: eq(userGroups.userId, userId),
      with: {
        group: true,
      },
    });

    return userGroupsData.map((ug) => ug.group);
  },

  /**
   * Get all permission IDs for a user based on their group memberships
   * Note: This only considers direct group permissions, not module/action permissions.
   * For comprehensive checks, use hasPermission.
   */
  async getUserPermissionIds(userId: number | undefined) {
    // If userId is undefined, use the guest group
    if (userId === undefined) {
      const guestGroupId = await this.getGuestGroupId();
      if (!guestGroupId) {
        return [];
      }

      // Get permissions for the guest group
      const guestGroupPermissions = await db.query.groupPermissions.findMany({
        where: eq(groupPermissions.groupId, guestGroupId),
        columns: { permissionId: true },
      });

      return guestGroupPermissions.map((gp) => gp.permissionId);
    }

    // Get all groups the user belongs to
    const userGroupsData = await db.query.userGroups.findMany({
      where: eq(userGroups.userId, userId),
      columns: { groupId: true }, // Only need group IDs
    });

    if (userGroupsData.length === 0) {
      return [];
    }

    const groupIds = userGroupsData.map((ug) => ug.groupId);

    // Get all permissions for those groups
    const groupPermissionsData = await db.query.groupPermissions.findMany({
      where: inArray(groupPermissions.groupId, groupIds),
      columns: { permissionId: true }, // Only need permission IDs
    });

    // Return unique permission IDs
    return [...new Set(groupPermissionsData.map((gp) => gp.permissionId))];
  },

  /**
   * Get all permissions for a user based on their group memberships
   * Note: This only considers direct group permissions, not module/action permissions.
   * For comprehensive checks, use hasPermission.
   */
  async getUserPermissions(userId: number | undefined) {
    const permissionIds = await this.getUserPermissionIds(userId);

    if (permissionIds.length === 0) {
      return [];
    }

    // Get permission details, including related module and action names
    return db.query.permissions.findMany({
      where: inArray(permissions.id, permissionIds),
      with: {
        module: { columns: { name: true } }, // Include module name
        action: { columns: { name: true } }, // Include action name
      },
    });
  },

  /**
   * Check if a user has a specific permission.
   * This function considers group memberships, specific permissions assigned
   * to those groups, and any module/action permissions applied to those groups.
   * Permission is granted if *at least one* of the user's groups grants the
   * permission AND does not have a relevant module or action permission.
   *
   * For non-authenticated users (userId is undefined), it checks the guest group.
   */
  async hasPermission(
    userId: number | undefined,
    permissionName: PermissionIdentifier
  ): Promise<boolean> {
    // Validate permission format
    if (!validatePermissionId(permissionName)) {
      logger.error(`Invalid permission format: ${permissionName}`);
      return false;
    }

    // 1. Parse permission name and find the corresponding Module, Action, and Permission IDs
    const [moduleName, resource, actionName] = permissionName.split(":");
    if (!moduleName || !resource || !actionName) {
      logger.error(`Invalid permission format: ${permissionName}`);
      return false; // Invalid format
    }

    // Fetch Module and Action IDs first
    const [moduleRecord, actionRecord] = await Promise.all([
      db.query.modules.findFirst({
        where: eq(modules.name, moduleName),
        columns: { id: true },
      }),
      db.query.actions.findFirst({
        where: eq(actions.name, actionName),
        columns: { id: true },
      }),
    ]);

    if (!moduleRecord || !actionRecord) {
      logger.warn(
        `Module ('${moduleName}') or Action ('${actionName}') not found for permission: ${permissionName}`
      );
      return false; // Module or Action doesn't exist
    }
    const moduleId = moduleRecord.id;
    const actionId = actionRecord.id;

    // Now find the permission using IDs and resource
    const permission = await db.query.permissions.findFirst({
      where: and(
        eq(permissions.moduleId, moduleId),
        eq(permissions.resource, resource),
        eq(permissions.actionId, actionId)
      ),
      columns: { id: true }, // Only need the ID
    });

    if (!permission) {
      logger.warn(
        `Permission not found in DB for components: module=${moduleId}, resource=${resource}, action=${actionId}`
      );
      return false; // Permission doesn't exist in the system
    }
    const permissionId = permission.id;

    // For non-authenticated users (userId is undefined), check the guest group
    if (userId === undefined) {
      const guestGroupId = await this.getGuestGroupId();
      if (!guestGroupId) {
        return false; // No guest group defined
      }

      // Get the guest group with its permissions
      const guestGroup = await db.query.groups.findFirst({
        where: eq(groups.id, guestGroupId),
        with: {
          groupPermissions: {
            columns: { permissionId: true },
          },
          groupModulePermissions: {
            columns: { moduleId: true },
          },
          groupActionPermissions: {
            columns: { actionId: true },
          },
        },
      });

      if (!guestGroup) {
        return false;
      }

      // Check if the guest group has this permission
      const hasGroupPermission = guestGroup.groupPermissions.some(
        (gp) => gp.permissionId === permissionId
      );

      if (!hasGroupPermission) {
        return false;
      }

      // Check module permissions
      const hasModulePermission = guestGroup.groupModulePermissions.some(
        (mp) => mp.moduleId === moduleId
      );
      if (
        !hasModulePermission &&
        guestGroup.groupModulePermissions.length > 0
      ) {
        return false;
      }

      // Check action permissions
      const hasActionPermission = guestGroup.groupActionPermissions.some(
        (ap) => ap.actionId === actionId
      );
      if (
        !hasActionPermission &&
        guestGroup.groupActionPermissions.length > 0
      ) {
        return false;
      }

      // If we get here, the guest has permission
      return true;
    }

    // 2. Get all groups the user belongs to, including their relevant permissions
    const userGroupsData = await db.query.userGroups.findMany({
      where: eq(userGroups.userId, userId),
      with: {
        group: {
          with: {
            // Eagerly load necessary related data for checking
            groupPermissions: {
              columns: { permissionId: true }, // Only need permissionId
            },
            groupModulePermissions: {
              columns: { moduleId: true },
            },
            groupActionPermissions: {
              columns: { actionId: true },
            },
          },
        },
      },
    });

    if (userGroupsData.length === 0) {
      return false; // User belongs to no groups
    }

    // 3. Iterate through the user's groups and apply logic
    for (const ug of userGroupsData) {
      const group = ug.group;
      // Should always have group due to inner join nature of 'with', but check defensively
      if (!group) continue;

      // Does this group grant the specific permission?
      const hasGroupPermission = group.groupPermissions.some(
        (gp) => gp.permissionId === permissionId
      );

      if (!hasGroupPermission) {
        continue; // This group doesn't grant the required permission, try next group
      }

      // Is this group restricted for the required module?
      // If the group has no module permissions, it is unrestricted
      const hasModulePermission = group.groupModulePermissions.some(
        (mp) => mp.moduleId === moduleId
      );
      if (!hasModulePermission && group.groupModulePermissions.length > 0) {
        continue; // Module restricted for this group, try next group
      }

      // Is this group restricted for the required action?
      // If the group has no action permissions, it is unrestricted
      const hasActionPermission = group.groupActionPermissions.some(
        (ap) => ap.actionId === actionId
      );
      if (!hasActionPermission && group.groupActionPermissions.length > 0) {
        continue; // Action restricted for this group, try next group
      }

      // If we reach here:
      // - The user is in this group.
      // - This group has the required permission.
      // - This group does have a module permission for the required module or no module permissions.
      // - This group does have an action permission for the required action or no action permissions.
      // Therefore, the user has the permission via this group.
      return true;
    }

    // 4. If loop completes, no group grants the permission without permissions
    return false;
  },

  /**
   * Check if a user has any of the specified permissions.
   * Returns true if the user has at least one of the permissions.
   * For non-authenticated users (userId is undefined), it checks the guest group.
   */
  async hasAnyPermission(
    userId: number | undefined,
    permissionNames: PermissionIdentifier[]
  ): Promise<boolean> {
    if (!permissionNames.length) {
      return false;
    }

    // Check each permission and return true on the first match
    for (const permission of permissionNames) {
      const hasPermission = await this.hasPermission(userId, permission);
      if (hasPermission) {
        return true;
      }
    }

    return false;
  },

  /**
   * Check if a user has permission to access a specific page
   * For non-authenticated users (userId is undefined), it checks the guest group.
   */
  async hasPagePermission(
    userId: number | undefined,
    pageId: number,
    permissionName: PermissionIdentifier
  ) {
    // Input validation remains the same
    if (!validatePermissionId(permissionName)) {
      logger.error(`Invalid permission format: ${permissionName}`);
      return false;
    }

    // Parse the permission name to get module, resource, and action
    const [moduleName, resource, actionName] = permissionName.split(":");

    if (!moduleName || !resource || !actionName) {
      return false;
    }

    // Fetch Module and Action IDs first
    const [moduleRecord, actionRecord] = await Promise.all([
      db.query.modules.findFirst({
        where: eq(modules.name, moduleName),
        columns: { id: true },
      }),
      db.query.actions.findFirst({
        where: eq(actions.name, actionName),
        columns: { id: true },
      }),
    ]);

    if (!moduleRecord || !actionRecord) {
      logger.warn(
        `Module ('${moduleName}') or Action ('${actionName}') not found for permission: ${permissionName}`
      );
      return false; // Module or Action doesn't exist
    }
    const moduleId = moduleRecord.id;
    const actionId = actionRecord.id;

    // Find the permission ID using fetched IDs and resource
    const permission = await db.query.permissions.findFirst({
      where: and(
        eq(permissions.moduleId, moduleId),
        eq(permissions.resource, resource),
        eq(permissions.actionId, actionId)
      ),
      columns: { id: true }, // Only need the ID
    });

    if (!permission) {
      logger.warn(
        `Permission not found in DB for components: module=${moduleId}, resource=${resource}, action=${actionId}`
      );
      return false;
    }
    const permissionId = permission.id;

    // Special handling for non-authenticated users
    if (userId === undefined) {
      const guestGroupId = await this.getGuestGroupId();
      if (!guestGroupId) {
        return false; // No guest group defined
      }

      // Check for explicit page permissions for guest group
      const pagePermissionData = await db.query.pagePermissions.findMany({
        where: and(
          eq(pagePermissions.pageId, pageId),
          eq(pagePermissions.permissionId, permissionId),
          or(
            eq(pagePermissions.groupId, guestGroupId),
            isNull(pagePermissions.groupId)
          )
        ),
        columns: { permissionType: true },
      });

      // If there are explicit page permissions, use those
      if (pagePermissionData.length > 0) {
        const hasDenyPermission = pagePermissionData.some(
          (pp) => pp.permissionType === "deny"
        );

        if (hasDenyPermission) {
          return false; // Explicit deny takes precedence
        }

        const hasAllowPermission = pagePermissionData.some(
          (pp) => pp.permissionType === "allow"
        );
        if (hasAllowPermission) {
          return true; // Explicit allow
        }
      }

      // Otherwise, check regular guest permissions
      return this.hasPermission(undefined, permissionName);
    }

    // Get all groups the user belongs to (only need IDs here)
    const userGroupsData = await db.query.userGroups.findMany({
      where: eq(userGroups.userId, userId),
      columns: { groupId: true },
    });

    const groupIds = userGroupsData.map((ug) => ug.groupId);

    // Check for explicit page permissions first (they override group permissions)
    // Query needs to check for permissions specific to the user's groups OR global page permissions (groupId is null)
    const pagePermissionData = await db.query.pagePermissions.findMany({
      where: and(
        eq(pagePermissions.pageId, pageId),
        eq(pagePermissions.permissionId, permissionId),
        groupIds.length > 0 // Only include group-specific check if user is in groups
          ? or(
              inArray(pagePermissions.groupId, groupIds),
              isNull(pagePermissions.groupId) // null group ID means it applies to all users
            )
          : isNull(pagePermissions.groupId) // If user has no groups, only check global page perms
      ),
      columns: { permissionType: true }, // Only need type
    });

    // If there are explicit page permissions, use those
    if (pagePermissionData.length > 0) {
      // Check if any is a "deny" permission
      const hasDenyPermission = pagePermissionData.some(
        (pp) => pp.permissionType === "deny"
      );

      if (hasDenyPermission) {
        return false; // Explicit deny takes precedence
      }

      // If there's at least one "allow" permission (and no deny), return true
      // Note: An empty result means no explicit allow/deny, so we fall through
      const hasAllowPermission = pagePermissionData.some(
        (pp) => pp.permissionType === "allow"
      );
      if (hasAllowPermission) {
        return true; // Explicit allow
      }
    }

    // Otherwise (no explicit page allow/deny found), fall back to general permissions check
    // This now uses the optimized and corrected hasPermission logic
    return this.hasPermission(userId, permissionName);
  },
};
