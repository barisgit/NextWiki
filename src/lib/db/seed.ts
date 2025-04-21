import { seedPermissions, createDefaultGroups } from "./seeds/permissions";
import * as path from "path";
import * as url from "url";
import { logger } from "~/lib/utils/logger";

/**
 * Main seed function that runs all seed operations
 */
async function seed() {
  logger.log("Starting seed operations...");
  try {
    // Seed permissions
    await seedPermissions();

    // Create default groups and assign permissions
    await createDefaultGroups();

    // Run custom seeds defined by the developer
    // This file (custom-seeds.ts) is ignored by git, allowing local overrides.
    // Since CI now ensures this file exists, we don't need special MODULE_NOT_FOUND handling.
    // Errors *within* runCustomSeeds itself will be caught by the outer try...catch.
    const { runCustomSeeds } = await import("./seeds/custom-seeds");
    await runCustomSeeds();

    logger.log("✅ All seed operations completed successfully!");
  } catch (error) {
    logger.error("Error during seed operations:", error);
    throw error;
  }
}

// Run the seed function and exit only if this file is executed directly
const currentFilePath = url.fileURLToPath(import.meta.url);
const entryPointPath = path.resolve(process.argv[1]);

if (currentFilePath === entryPointPath) {
  seed()
    .then(() => {
      logger.log("Seed script finished successfully.");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Seed script failed when run directly:", error);
      process.exit(1);
    });
}

export { seed };
