import { seedPermissions, createDefaultGroups } from "./seeds/permissions";
import { runCustomSeeds } from "./seeds/custom-seeds";

/**
 * Main seed function that runs all seed operations
 */
async function seed() {
  console.log("Starting seed operations...");
  try {
    // Seed permissions
    await seedPermissions();

    // Create default groups and assign permissions
    await createDefaultGroups();

    // Run custom seeds defined by the developer
    // This file (custom-seeds.ts) is ignored by git, allowing local overrides.
    try {
      await runCustomSeeds();
    } catch (error) {
      // Log the error but don't stop the main seed process
      // as custom seeds might be optional or broken locally.
      console.warn("⚠️ Error encountered during custom seed execution:", error);
    }

    console.log("✅ All seed operations completed successfully!");
  } catch (error) {
    console.error("Error during seed operations:", error);
    throw error;
  }
}

// Run the seed function and exit only if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed script failed when run directly:", error);
      process.exit(1);
    });
}

export { seed };
