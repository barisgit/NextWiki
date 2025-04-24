/**
 * SERVER-ONLY PERMISSIONS VALIDATION
 * This file should never be imported directly from client components
 * Only import from server components or API routes
 */
import { db } from "@repo/db";
import { permissions as permissionsTable } from "@repo/db";
import { eq } from "drizzle-orm";
import {
  getAllPermissions as getRegistryPermissions, // Rename for clarity
  type Permission as RegistryPermissionType, // Type for registry permission objects
} from "@repo/db";
import { logger } from "@repo/logger";

/**
 * Validates permissions in the database against the registry
 * Returns an object containing the validation results
 */
export async function validatePermissionsDatabase() {
  // Get registry and DB data
  const registryPermissions = getRegistryPermissions();
  const dbPermissions = await db.query.permissions.findMany();
  const dbModules = await db.query.modules.findMany();
  const dbActions = await db.query.actions.findMany();

  // Create lookups for faster comparison
  const moduleNameToId = new Map(dbModules.map((m) => [m.name, m.id]));
  const actionNameToId = new Map(dbActions.map((a) => [a.name, a.id]));
  const moduleIdToName = new Map(dbModules.map((m) => [m.id, m.name]));
  const actionIdToName = new Map(dbActions.map((a) => [a.id, a.name]));

  // Find permissions that are in the registry but missing from the database
  const missing = registryPermissions.filter((regPerm) => {
    const expectedModuleId = moduleNameToId.get(regPerm.module);
    const expectedActionId = actionNameToId.get(regPerm.action);

    // Skip if module/action name from registry doesn't exist in DB (separate issue?)
    if (expectedModuleId === undefined || expectedActionId === undefined) {
      logger.error(
        `Registry permission '${regPerm.module}:${regPerm.resource}:${regPerm.action}' refers to unknown module or action.`
      );
      return false; // Treat as invalid registry entry for this validation
    }

    return !dbPermissions.some(
      (dbPerm) =>
        dbPerm.moduleId === expectedModuleId &&
        dbPerm.resource === regPerm.resource &&
        dbPerm.actionId === expectedActionId
    );
  });

  // Find permissions that are in the database but not in the registry
  const extras = dbPermissions.filter((dbPerm) => {
    const moduleName = moduleIdToName.get(dbPerm.moduleId);
    const actionName = actionIdToName.get(dbPerm.actionId);

    // Skip if module/action ID from DB doesn't exist in lookup (data integrity issue?)
    if (moduleName === undefined || actionName === undefined) {
      logger.error(
        `DB permission ID ${dbPerm.id} refers to unknown module ID ${dbPerm.moduleId} or action ID ${dbPerm.actionId}.`
      );
      return false; // Treat as invalid DB entry for this validation
    }

    return !registryPermissions.some(
      (regPerm) =>
        regPerm.module === moduleName &&
        regPerm.resource === dbPerm.resource &&
        regPerm.action === actionName
    );
  });

  // Find permissions that have different descriptions
  const mismatched = dbPermissions.filter((dbPerm) => {
    const moduleName = moduleIdToName.get(dbPerm.moduleId);
    const actionName = actionIdToName.get(dbPerm.actionId);

    if (moduleName === undefined || actionName === undefined) {
      // Already logged as error above if it's an extra, avoid double logging
      return false;
    }

    const regPerm = registryPermissions.find(
      (p) =>
        p.module === moduleName &&
        p.resource === dbPerm.resource &&
        p.action === actionName
    );
    // Ensure description is compared correctly (handle null/undefined)
    return (
      regPerm && (regPerm.description ?? null) !== (dbPerm.description ?? null)
    );
  });

  return {
    isValid:
      missing.length === 0 && extras.length === 0 && mismatched.length === 0,
    missing, // Registry items not in DB
    extras, // DB items not in Registry
    mismatched, // DB items with different description than Registry
    dbPermissions, // Raw DB data
    registryPermissions, // Raw Registry data
    // Include maps for potential use in logging/fixing if needed
    moduleIdToName,
    actionIdToName,
    moduleNameToId,
    actionNameToId,
  };
}

/**
 * Fixes permissions in the database to match the registry
 * Adds missing permissions, updates mismatched descriptions, and optionally removes extras
 */
export async function fixPermissionsDatabase(removeExtras = false) {
  // Pass lookups to avoid re-fetching
  const validation = await validatePermissionsDatabase();

  const results = {
    added: 0,
    updated: 0,
    removed: 0,
  };

  // Add missing permissions
  for (const regPerm of validation.missing) {
    const moduleId = validation.moduleNameToId.get(regPerm.module);
    const actionId = validation.actionNameToId.get(regPerm.action);

    // Ensure we have valid IDs before inserting
    if (moduleId !== undefined && actionId !== undefined) {
      await db.insert(permissionsTable).values({
        moduleId: moduleId,
        resource: regPerm.resource,
        actionId: actionId,
        description: regPerm.description,
      });
      results.added++;
    } else {
      logger.error(
        `Could not add missing permission '${regPerm.module}:${regPerm.resource}:${regPerm.action}' because module or action name not found in DB.`
      );
    }
  }

  // Update mismatched descriptions
  for (const dbPerm of validation.mismatched) {
    const moduleName = validation.moduleIdToName.get(dbPerm.moduleId);
    const actionName = validation.actionIdToName.get(dbPerm.actionId);

    // Should always be findable based on mismatch logic, but check anyway
    if (moduleName && actionName) {
      const regPerm = validation.registryPermissions.find(
        (p) =>
          p.module === moduleName &&
          p.resource === dbPerm.resource &&
          p.action === actionName
      );

      if (regPerm) {
        await db
          .update(permissionsTable)
          .set({ description: regPerm.description ?? null })
          .where(eq(permissionsTable.id, dbPerm.id));
        results.updated++;
      }
    }
  }

  // Remove extras if requested
  if (removeExtras) {
    for (const extra of validation.extras) {
      await db
        .delete(permissionsTable)
        .where(eq(permissionsTable.id, extra.id));
      results.removed++;
    }
  }

  return results;
}

/**
 * Logs the result of a permissions database validation
 */
export function logValidationResults(
  // Infer the type correctly from the return value
  validation: Awaited<ReturnType<typeof validatePermissionsDatabase>>
) {
  if (validation.isValid) {
    logger.log("✅ Permissions database is valid!");
    return;
  }

  // Helper to format permission identifier from Registry type
  const formatRegPermId = (p: RegistryPermissionType) =>
    `${p.module}:${p.resource}:${p.action}`;

  // Helper to format permission identifier from DB type using lookups
  const formatDbPermId = (p: {
    moduleId: number;
    actionId: number;
    resource: string;
  }) => {
    // Use the maps passed within the validation object
    const moduleName =
      validation.moduleIdToName.get(p.moduleId) ?? `ModID ${p.moduleId}`;
    const actionName =
      validation.actionIdToName.get(p.actionId) ?? `ActID ${p.actionId}`;
    return `${moduleName}:${p.resource}:${actionName}`;
  };

  if (validation.missing.length > 0) {
    logger.warn(
      `⚠️ Found ${validation.missing.length} missing permissions (Registry -> DB):`
    );
    // Explicitly type 'p' as RegistryPermissionType - This is correct as validation.missing contains Registry types
    validation.missing.forEach((p: RegistryPermissionType) => {
      logger.warn(
        `  - ${formatRegPermId(p)}: ${p.description ?? "(no description)"}`
      );
    });
  }

  if (validation.mismatched.length > 0) {
    logger.warn(
      `⚠️ Found ${validation.mismatched.length} permissions with mismatched descriptions:`
    );
    // Remove explicit type ': DbPermissionType'. Let TS infer from validation.mismatched array.
    validation.mismatched.forEach((dbPerm) => {
      // Find corresponding registry permission (logic seems okay)
      const regPerm = validation.registryPermissions.find((p) => {
        const modId = validation.moduleNameToId.get(p.module);
        const actId = validation.actionNameToId.get(p.action);
        // Now dbPerm correctly has moduleId and actionId from inference
        return (
          modId === dbPerm.moduleId &&
          p.resource === dbPerm.resource &&
          actId === dbPerm.actionId
        );
      });
      // Pass the inferred dbPerm to the formatter.
      // Need to adjust formatDbPermId signature or cast dbPerm if necessary.
      // Let's adjust formatDbPermId to accept the inferred type.
      logger.warn(`  - ${formatDbPermId(dbPerm)}:`);
      logger.warn(`    DB: ${dbPerm.description ?? "(null)"}`);
      logger.warn(
        `    Registry: ${regPerm?.description ?? "(Not found in registry?)"}`
      );
    });
  }

  if (validation.extras.length > 0) {
    logger.warn(
      `⚠️ Found ${validation.extras.length} extra permissions in the database (DB only):`
    );
    // Remove explicit type ': DbPermissionType'. Let TS infer from validation.extras array.
    validation.extras.forEach((p) => {
      // Pass the inferred p to the formatter
      logger.warn(
        `  - ${formatDbPermId(p)}: ${p.description ?? "(no description)"}`
      );
    });
  }
}
