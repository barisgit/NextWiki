import { db } from "../index.js";
import * as schema from "../schema/index.js";
import {
  getAllPermissions,
  createPermissionId,
} from "../registry/permissions.js";
import { Permission } from "../registry/types.js";
import { sql } from "drizzle-orm";

/**
 * Seed all permissions from the central registry
 */
export async function seedPermissions() {
  console.log(`Seeding permissions from registry...`);

  const registryPermissions = getAllPermissions();

  // Prepare permissions for insertion, generating the unique name
  const permissionsToInsert = registryPermissions.map((p: Permission) => ({
    module: p.module,
    resource: p.resource,
    action: p.action,
    description: p.description,
    name: createPermissionId(p), // Use the function to generate the name
  }));

  console.log(`Found ${permissionsToInsert.length} permissions to seed.`);

  if (permissionsToInsert.length === 0) {
    console.warn("No permissions found in the registry to seed.");
    return;
  }

  try {
    // Use insert with onConflictDoUpdate to handle existing permissions
    await db
      .insert(schema.permissions)
      .values(permissionsToInsert)
      .onConflictDoUpdate({
        target: schema.permissions.name, // Target the unique name column
        set: {
          // Use sql`excluded.column_name` syntax
          description: sql`excluded.description`,
        },
      });

    console.log("Permissions seeding finished.");
  } catch (error) {
    console.error(`Error during permissions seeding:`, error);
    // Consider re-throwing or handling the error more robustly
  }
}

/**
 * Create default groups with permissions
 */
export async function createDefaultGroups() {
  console.log("Creating default groups...");

  try {
    // --- Create Groups (using onConflictDoUpdate for idempotency) ---
    const groupsToCreate = [
      {
        name: "Administrators",
        description: "Full access to all wiki features",
        isEditable: false,
        allowUserAssignment: true,
        isSystem: true,
      },
      {
        name: "Editors",
        description: "Can edit, create, and manage wiki content",
        isEditable: true,
        allowUserAssignment: true,
        isSystem: false,
      },
      {
        name: "Viewers",
        description: "Can only view wiki content",
        isEditable: true,
        allowUserAssignment: true,
        isSystem: true,
      },
      {
        name: "Guests",
        description: "Default group for non-authenticated users",
        isEditable: true,
        allowUserAssignment: false,
        isSystem: true,
      },
    ];

    const createdGroups = await db
      .insert(schema.groups)
      .values(groupsToCreate)
      .onConflictDoUpdate({
        target: schema.groups.name,
        set: {
          // Use sql`excluded.column_name` syntax
          description: sql`excluded.description`,
          isEditable: sql`excluded.is_editable`,
          allowUserAssignment: sql`excluded.allow_user_assignment`,
          isSystem: sql`excluded.is_system`,
        },
      })
      .returning(); // Get created/updated groups with IDs

    const adminGroup = createdGroups.find((g) => g.name === "Administrators");
    const editorGroup = createdGroups.find((g) => g.name === "Editors");
    const viewerGroup = createdGroups.find((g) => g.name === "Viewers");
    const guestGroup = createdGroups.find((g) => g.name === "Guests");

    // --- Assign Permissions ---
    const allDbPermissions = await db.query.permissions.findMany();
    if (!allDbPermissions || allDbPermissions.length === 0) {
      console.error(
        "No permissions found in the database. Cannot assign permissions to groups. Ensure seedPermissions ran successfully."
      );
      return;
    }

    const findPermission = (id: string) =>
      allDbPermissions.find((p) => p.name === id);

    // Administrator: All permissions
    if (adminGroup) {
      const allPermissionIds = allDbPermissions.map((p) => p.id);
      if (allPermissionIds.length > 0) {
        await db
          .insert(schema.groupPermissions)
          .values(
            allPermissionIds.map((permissionId) => ({
              groupId: adminGroup.id,
              permissionId,
            }))
          )
          .onConflictDoNothing();
        console.log(
          `Assigned ${allPermissionIds.length} permissions to Administrators.`
        );
      } else {
        console.warn("No permissions available to assign to Administrators.");
      }
    }

    // Editors: Wiki create, read, update + Asset read
    if (editorGroup) {
      const editorPerms = [
        findPermission("wiki:page:create"),
        findPermission("wiki:page:read"),
        findPermission("wiki:page:update"),
        findPermission("assets:asset:read"), // Editors likely need to see assets too
      ].filter((p) => p !== undefined) as typeof allDbPermissions;

      if (editorPerms.length > 0) {
        await db
          .insert(schema.groupPermissions)
          .values(
            editorPerms.map((p) => ({
              groupId: editorGroup.id,
              permissionId: p.id,
            }))
          )
          .onConflictDoNothing();
        console.log(`Assigned ${editorPerms.length} permissions to Editors.`);
      } else {
        console.warn("Could not find necessary permissions for Editors.");
      }
    }

    // Viewers & Guests: Wiki read, Asset read
    const readPermIds = [
      findPermission("wiki:page:read")?.id,
      findPermission("assets:asset:read")?.id,
    ].filter((id) => id !== undefined) as number[];

    const viewerGuestGroups = [viewerGroup, guestGroup].filter(
      (g) => g !== undefined
    ) as typeof createdGroups;

    if (readPermIds.length > 0) {
      for (const group of viewerGuestGroups) {
        await db
          .insert(schema.groupPermissions)
          .values(
            readPermIds.map((permissionId) => ({
              groupId: group.id,
              permissionId,
            }))
          )
          .onConflictDoNothing();
        console.log(
          `Assigned ${readPermIds.length} read permissions to ${group.name}.`
        );
      }
    } else {
      console.warn("Could not find read permissions for Viewers/Guests.");
    }

    // -- Assign Module/Action Permissions (Simplified Example) --
    // You might need more granular control here based on your specific needs
    // Example: Assign 'wiki' and 'assets' module access and 'read' action to Viewers/Guests
    for (const group of viewerGuestGroups) {
      await db
        .insert(schema.groupModulePermissions)
        .values([
          { groupId: group.id, module: "wiki" },
          { groupId: group.id, module: "assets" },
        ])
        .onConflictDoNothing();
      await db
        .insert(schema.groupActionPermissions)
        .values({ groupId: group.id, action: "read" })
        .onConflictDoNothing();
      console.log(`Assigned basic module/action permissions to ${group.name}.`);
    }

    console.log("Default groups and permissions assigned successfully!");
  } catch (error) {
    console.error(
      "Error creating default groups or assigning permissions:",
      error
    );
  }
}
