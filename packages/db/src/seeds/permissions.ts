import { db } from "../index.js";
import * as schema from "../schema/index.js";
import { getAllPermissions } from "../registry/permissions.js";
import {
  Permission,
  PermissionModule,
  PermissionAction,
  PermissionResource,
} from "../registry/types.js";
import { sql } from "drizzle-orm";

/**
 * Seed Modules and Actions from the registry
 */
async function seedModulesAndActions(registryPermissions: Permission[]) {
  console.log(`Seeding modules and actions...`);

  const uniqueModules = [
    ...new Map(
      registryPermissions.map((p) => [p.module, { name: p.module }])
    ).values(),
  ];
  const uniqueActions = [
    ...new Map(
      registryPermissions.map((p) => [p.action, { name: p.action }])
    ).values(),
  ];

  const modulePromise = db
    .insert(schema.modules)
    .values(uniqueModules)
    .onConflictDoNothing()
    .returning();

  const actionPromise = db
    .insert(schema.actions)
    .values(uniqueActions)
    .onConflictDoNothing()
    .returning();

  await Promise.all([modulePromise, actionPromise]);

  // Fetch all modules and actions (including existing ones) to get IDs
  const [allModules, allActions] = await Promise.all([
    db.query.modules.findMany(),
    db.query.actions.findMany(),
  ]);

  const moduleNameToIdMap = new Map(allModules.map((m) => [m.name, m.id]));
  const actionNameToIdMap = new Map(allActions.map((a) => [a.name, a.id]));

  console.log(
    `Modules and actions seeding finished. Found ${allModules.length} modules, ${allActions.length} actions.`
  );
  return { moduleNameToIdMap, actionNameToIdMap };
}

/**
 * Seed all permissions from the central registry
 */
export async function seedPermissions() {
  console.log(`Seeding permissions from registry...`);

  const registryPermissions = getAllPermissions();
  if (registryPermissions.length === 0) {
    console.warn("No permissions found in the registry to seed.");
    return;
  }

  const { moduleNameToIdMap, actionNameToIdMap } =
    await seedModulesAndActions(registryPermissions);

  // Fetch existing permissions to avoid duplicates
  const existingPermissions = await db.query.permissions.findMany({
    columns: {
      moduleId: true,
      resource: true,
      actionId: true,
    },
  });
  const existingSet = new Set(
    existingPermissions.map((p) => `${p.moduleId}:${p.resource}:${p.actionId}`)
  );

  // Prepare permissions for insertion, filtering out existing ones
  const permissionsToInsert = registryPermissions
    .map((p: Permission) => {
      const moduleId = moduleNameToIdMap.get(p.module);
      const actionId = actionNameToIdMap.get(p.action);
      if (moduleId === undefined || actionId === undefined) {
        console.warn(
          `Skipping permission: Could not find ID for module '${p.module}' or action '${p.action}'.`
        );
        return null;
      }
      return {
        moduleId: moduleId,
        resource: p.resource,
        actionId: actionId,
        description: p.description,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null) // Type guard to remove nulls
    .filter(
      (p) => !existingSet.has(`${p.moduleId}:${p.resource}:${p.actionId}`)
    );

  console.log(`Found ${permissionsToInsert.length} new permissions to seed.`);

  if (permissionsToInsert.length === 0) {
    console.log("No new permissions to insert.");
    console.log("Permissions seeding finished.");
    return;
  }

  try {
    // Insert only the new permissions
    await db.insert(schema.permissions).values(permissionsToInsert);

    console.log(`${permissionsToInsert.length} new permissions inserted.`);
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

    // Use Promise.all for potentially parallelizable inserts if DB supports it well,
    // but sequential insertReturning is safer for getting IDs back reliably.
    const createdGroups = await db
      .insert(schema.groups)
      .values(groupsToCreate)
      .onConflictDoUpdate({
        target: schema.groups.name,
        set: {
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

    // --- Fetch Data Needed for Assignments ---
    const [allDbPermissions, allModules, allActions] = await Promise.all([
      db.query.permissions.findMany(),
      db.query.modules.findMany(),
      db.query.actions.findMany(),
    ]);

    if (!allDbPermissions || allDbPermissions.length === 0) {
      console.error(
        "No permissions found in the database. Cannot assign permissions to groups. Ensure seedPermissions ran successfully."
      );
      return;
    }

    const moduleNameToIdMap = new Map(allModules.map((m) => [m.name, m.id]));
    const actionNameToIdMap = new Map(allActions.map((a) => [a.name, a.id]));

    // Helper to find a permission ID based on its logical components
    const findPermissionId = (
      moduleName: PermissionModule,
      resource: PermissionResource,
      actionName: PermissionAction
    ): number | undefined => {
      const moduleId = moduleNameToIdMap.get(moduleName);
      const actionId = actionNameToIdMap.get(actionName);
      if (moduleId === undefined || actionId === undefined) return undefined;
      const permission = allDbPermissions.find(
        (p) =>
          p.moduleId === moduleId &&
          p.resource === resource &&
          p.actionId === actionId
      );
      return permission?.id;
    };

    // --- Assign Permissions --- //
    const assignmentPromises: Promise<void>[] = [];

    // Administrator: All permissions
    if (adminGroup) {
      const allPermissionIds = allDbPermissions.map((p) => p.id);
      if (allPermissionIds.length > 0) {
        assignmentPromises.push(
          db
            .insert(schema.groupPermissions)
            .values(
              allPermissionIds.map((permissionId) => ({
                groupId: adminGroup.id,
                permissionId,
              }))
            )
            .onConflictDoNothing()
            .then(() =>
              console.log(
                `Assigned ${allPermissionIds.length} permissions to Administrators.`
              )
            )
        );
      } else {
        console.warn("No permissions available to assign to Administrators.");
      }
    }

    // Editors: Wiki create, read, update + Asset read
    if (editorGroup) {
      const editorPermIds = [
        findPermissionId("wiki", "page", "create"),
        findPermissionId("wiki", "page", "read"),
        findPermissionId("wiki", "page", "update"),
        findPermissionId("assets", "asset", "read"), // Editors likely need to see assets too
      ].filter((id): id is number => id !== undefined);

      if (editorPermIds.length > 0) {
        assignmentPromises.push(
          db
            .insert(schema.groupPermissions)
            .values(
              editorPermIds.map((permissionId) => ({
                groupId: editorGroup.id,
                permissionId,
              }))
            )
            .onConflictDoNothing()
            .then(() =>
              console.log(
                `Assigned ${editorPermIds.length} permissions to Editors.`
              )
            )
        );
      } else {
        console.warn("Could not find necessary permissions for Editors.");
      }
    }

    // Viewers & Guests: Wiki read, Asset read
    const readPermIds = [
      findPermissionId("wiki", "page", "read"),
      findPermissionId("assets", "asset", "read"),
    ].filter((id): id is number => id !== undefined);

    const viewerGuestGroups = [viewerGroup, guestGroup].filter(
      (g): g is NonNullable<typeof g> => g !== undefined
    );

    if (readPermIds.length > 0) {
      for (const group of viewerGuestGroups) {
        assignmentPromises.push(
          db
            .insert(schema.groupPermissions)
            .values(
              readPermIds.map((permissionId) => ({
                groupId: group.id,
                permissionId,
              }))
            )
            .onConflictDoNothing()
            .then(() =>
              console.log(
                `Assigned ${readPermIds.length} read permissions to ${group.name}.`
              )
            )
        );
      }
    } else {
      console.warn("Could not find read permissions for Viewers/Guests.");
    }

    // -- Assign Module/Action Permissions (Simplified Example) --
    const wikiModuleId = moduleNameToIdMap.get("wiki");
    const assetsModuleId = moduleNameToIdMap.get("assets");
    const readActionId = actionNameToIdMap.get("read");

    if (wikiModuleId && assetsModuleId && readActionId) {
      for (const group of viewerGuestGroups) {
        assignmentPromises.push(
          db
            .insert(schema.groupModulePermissions)
            .values([
              { groupId: group.id, moduleId: wikiModuleId },
              { groupId: group.id, moduleId: assetsModuleId },
            ])
            .onConflictDoNothing()
            .then(() =>
              console.log(`Assigned module permissions to ${group.name}.`)
            )
        );
        assignmentPromises.push(
          db
            .insert(schema.groupActionPermissions)
            .values({ groupId: group.id, actionId: readActionId })
            .onConflictDoNothing()
            .then(() =>
              console.log(`Assigned action permissions to ${group.name}.`)
            )
        );
      }
    } else {
      console.warn(
        "Could not find IDs for basic module/action permissions (wiki, assets, read)."
      );
    }

    // Wait for all assignments to complete
    await Promise.all(assignmentPromises);

    console.log("Default groups and permissions assigned successfully!");
  } catch (error) {
    console.error(
      "Error creating default groups or assigning permissions:",
      error
    );
  }
}
