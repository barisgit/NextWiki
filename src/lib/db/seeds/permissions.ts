import { db } from "~/lib/db";
import {
  permissions,
  groups,
  groupPermissions,
  groupModulePermissions,
  groupActionPermissions,
} from "~/lib/db/schema";
import { getAllPermissions } from "~/lib/permissions";
import {
  validatePermissionsDatabase,
  fixPermissionsDatabase,
  logValidationResults,
} from "~/lib/permissions/server";

/**
 * Seed all permissions from the central registry
 */
export async function seedPermissions() {
  const allPermissions = getAllPermissions();

  console.log(`Seeding ${allPermissions.length} permissions...`);

  for (const permission of allPermissions) {
    try {
      await db
        .insert(permissions)
        .values({
          module: permission.module,
          resource: permission.resource,
          action: permission.action,
          description: permission.description,
        })
        .onConflictDoUpdate({
          target: permissions.name,
          set: {
            description: permission.description,
          },
        });
    } catch (error) {
      console.error(
        `Error seeding permission ${permission.module}:${permission.resource}:${permission.action}:`,
        error
      );
    }
  }

  // Validate permissions to ensure everything is in sync
  const validation = await validatePermissionsDatabase();
  logValidationResults(validation);

  if (!validation.isValid) {
    console.log("Fixing permissions database...");
    const fixResults = await fixPermissionsDatabase();
    console.log(
      `Fixed permissions: added=${fixResults.added}, updated=${fixResults.updated}`
    );
  }

  console.log("Permissions seeded successfully!");
}

/**
 * Create default groups with permissions
 */
export async function createDefaultGroups() {
  console.log("Creating default groups...");

  try {
    // 1. Create Administrator group
    const adminGroup = await db
      .insert(groups)
      .values({
        name: "Administrators",
        description: "Full access to all wiki features",
        isEditable: false,
        allowUserAssignment: true,
        isSystem: true,
      })
      .onConflictDoUpdate({
        target: groups.name,
        set: {
          description: "Full access to all wiki features",
          isEditable: false,
          allowUserAssignment: true,
          isSystem: true,
        },
      })
      .returning();

    // 2. Create Editor group
    const editorGroup = await db
      .insert(groups)
      .values({
        name: "Editors",
        description: "Can edit, create, and manage wiki content",
        isEditable: true,
        allowUserAssignment: true,
        isSystem: false,
      })
      .onConflictDoUpdate({
        target: groups.name,
        set: {
          description: "Can edit, create, and manage wiki content",
          isEditable: true,
          allowUserAssignment: true,
          isSystem: false,
        },
      })
      .returning();

    // 3. Create Viewer group
    const viewerGroup = await db
      .insert(groups)
      .values({
        name: "Viewers",
        description: "Can only view wiki content",
        isEditable: true,
        allowUserAssignment: true,
        isSystem: true,
      })
      .onConflictDoUpdate({
        target: groups.name,
        set: {
          description: "Can only view wiki content",
          isEditable: true,
          allowUserAssignment: true,
          isSystem: true,
        },
      })
      .returning();

    // 4. Create Guests group
    const guestGroup = await db
      .insert(groups)
      .values({
        name: "Guests",
        description: "Default group for non-authenticated users",
        isEditable: true,
        allowUserAssignment: false,
        isSystem: true,
      })
      .onConflictDoUpdate({
        target: groups.name,
        set: {
          description: "Default group for non-authenticated users",
          isEditable: true,
          allowUserAssignment: false,
          isSystem: true,
        },
      })
      .returning();

    // Get all permissions
    const allPermissions = await db.query.permissions.findMany();
    const allPermissionIds = allPermissions.map((p) => p.id);

    // Get wiki read permission
    const wikiReadPermission = allPermissions.find(
      (p) => p.module === "wiki" && p.resource === "page" && p.action === "read"
    );

    const assetReadPermission = allPermissions.find(
      (p) =>
        p.module === "assets" && p.resource === "asset" && p.action === "read"
    );

    // Get wiki editing permissions
    const wikiEditPermissions = allPermissions.filter(
      (p) =>
        p.module === "wiki" &&
        p.resource === "page" &&
        ["create", "update", "read"].includes(p.action)
    );

    // Assignment - Administrator gets all permissions
    if (adminGroup[0]) {
      await db
        .insert(groupPermissions)
        .values(
          allPermissionIds.map((permissionId) => ({
            groupId: adminGroup[0].id,
            permissionId,
          }))
        )
        .onConflictDoNothing();

      console.log("Added all permissions to Administrators group");
    }

    // Assignment - Editors get wiki editing permissions
    if (editorGroup[0] && wikiEditPermissions.length) {
      await db
        .insert(groupPermissions)
        .values(
          wikiEditPermissions.map((permission) => ({
            groupId: editorGroup[0].id,
            permissionId: permission.id,
          }))
        )
        .onConflictDoNothing();

      console.log("Added editing permissions to Editors group");
    }

    // Assignment - Viewers only get read permission
    if (viewerGroup[0] && wikiReadPermission && assetReadPermission) {
      await db
        .insert(groupPermissions)
        .values([
          {
            groupId: viewerGroup[0].id,
            permissionId: wikiReadPermission.id,
          },
          {
            groupId: viewerGroup[0].id,
            permissionId: assetReadPermission.id,
          },
        ])
        .onConflictDoNothing();

      // Add module permissions - allow wiki and assets
      await db
        .insert(groupModulePermissions)
        .values([
          {
            groupId: viewerGroup[0].id,
            module: "wiki",
          },
          {
            groupId: viewerGroup[0].id,
            module: "assets",
          },
        ])
        .onConflictDoNothing();

      // Add action permissions - only allow read action
      await db
        .insert(groupActionPermissions)
        .values({
          groupId: viewerGroup[0].id,
          action: "read",
        })
        .onConflictDoNothing();

      console.log("Added read permission and permissions to Viewers group");
    }

    // Assignment - Guests get limited read permissions
    if (guestGroup[0] && wikiReadPermission) {
      await db
        .insert(groupPermissions)
        .values([
          {
            groupId: guestGroup[0].id,
            permissionId: wikiReadPermission.id,
          },
        ])
        .onConflictDoNothing();

      // Add module permissions - only allow wiki module
      await db
        .insert(groupModulePermissions)
        .values([
          {
            groupId: guestGroup[0].id,
            module: "wiki",
          },
        ])
        .onConflictDoNothing();

      // Add action permissions - only allow read action
      await db
        .insert(groupActionPermissions)
        .values({
          groupId: guestGroup[0].id,
          action: "read",
        })
        .onConflictDoNothing();

      console.log("Added minimal read permissions to Guests group");
    }

    console.log("Default groups created successfully!");
  } catch (error) {
    console.error("Error creating default groups:", error);
  }
}
