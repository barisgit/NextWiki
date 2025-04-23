/**
 * SERVER-ONLY PERMISSIONS VALIDATION
 * This file should never be imported directly from client components
 * Only import from server components or API routes
 */
import { db } from "@repo/db";
import { permissions } from "@repo/db";
import { eq } from "drizzle-orm";
import { getAllPermissions, createPermissionId } from "@repo/db";
import { logger } from "@repo/logger";

/**
 * Validates permissions in the database against the registry
 * Returns an object containing the validation results
 */
export async function validatePermissionsDatabase() {
  // Get all permissions from the database
  const dbPermissions = await db.query.permissions.findMany();
  const registryPermissions = getAllPermissions();

  // Find permissions that are in the registry but missing from the database
  const missing = registryPermissions.filter((expected) => {
    const name = createPermissionId(expected);
    return !dbPermissions.some((p) => p.name === name);
  });

  // Find permissions that are in the database but not in the registry
  const extras = dbPermissions.filter((dbPerm) => {
    // Check if the permission name exists in the registry
    return !registryPermissions.some(
      (regPerm) => createPermissionId(regPerm) === dbPerm.name
    );
  });

  // Find permissions that have different descriptions
  const mismatched = dbPermissions.filter((dbPerm) => {
    const regPerm = registryPermissions.find(
      (p) => createPermissionId(p) === dbPerm.name
    );
    return regPerm && regPerm.description !== dbPerm.description;
  });

  return {
    isValid:
      missing.length === 0 && extras.length === 0 && mismatched.length === 0,
    missing,
    extras,
    mismatched,
    dbPermissions,
    registryPermissions,
  };
}

/**
 * Fixes permissions in the database to match the registry
 * Adds missing permissions, updates mismatched descriptions, and optionally removes extras
 */
export async function fixPermissionsDatabase(removeExtras = false) {
  const validation = await validatePermissionsDatabase();
  const results = {
    added: 0,
    updated: 0,
    removed: 0,
  };

  // Add missing permissions
  for (const permission of validation.missing) {
    await db.insert(permissions).values({
      module: permission.module,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
    });
    results.added++;
  }

  // Update mismatched descriptions
  for (const dbPerm of validation.mismatched) {
    const regPerm = validation.registryPermissions.find(
      (p) => createPermissionId(p) === dbPerm.name
    );

    if (regPerm) {
      await db
        .update(permissions)
        .set({ description: regPerm.description })
        .where(eq(permissions.id, dbPerm.id));
      results.updated++;
    }
  }

  // Remove extras if requested
  if (removeExtras) {
    for (const extra of validation.extras) {
      await db.delete(permissions).where(eq(permissions.id, extra.id));
      results.removed++;
    }
  }

  return results;
}

/**
 * Logs the result of a permissions database validation
 */
export function logValidationResults(
  validation: Awaited<ReturnType<typeof validatePermissionsDatabase>>
) {
  if (validation.isValid) {
    logger.log("✅ Permissions database is valid!");
    return;
  }

  if (validation.missing.length > 0) {
    logger.warn(`⚠️ Found ${validation.missing.length} missing permissions:`);
    validation.missing.forEach((p) => {
      logger.warn(`  - ${createPermissionId(p)}: ${p.description}`);
    });
  }

  if (validation.mismatched.length > 0) {
    logger.warn(
      `⚠️ Found ${validation.mismatched.length} permissions with mismatched descriptions:`
    );
    validation.mismatched.forEach((dbPerm) => {
      const regPerm = validation.registryPermissions.find(
        (p) => createPermissionId(p) === dbPerm.name
      );
      if (regPerm) {
        logger.warn(`  - ${dbPerm.name}:`);
        logger.warn(`    DB: ${dbPerm.description}`);
        logger.warn(`    Registry: ${regPerm.description}`);
      }
    });
  }

  if (validation.extras.length > 0) {
    logger.warn(
      `⚠️ Found ${validation.extras.length} extra permissions in the database:`
    );
    validation.extras.forEach((p) => {
      logger.warn(`  - ${p.name}: ${p.description}`);
    });
  }
}
