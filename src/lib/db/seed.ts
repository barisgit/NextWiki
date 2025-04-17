import { seedPermissions, createDefaultGroups } from "./seeds/permissions";

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
      // Dynamically import custom seeds only if the file exists
      const { runCustomSeeds } = await import("./seeds/custom-seeds");
      await runCustomSeeds();
    } catch (error: unknown) {
      // Handle both module not found errors (e.g., code: 'MODULE_NOT_FOUND')
      // and runtime errors from within runCustomSeeds
      // Use a type guard to safely access error.code
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: unknown }).code === "MODULE_NOT_FOUND"
      ) {
        console.log(
          "ℹ️ Custom seeds file not found, skipping. This is expected in CI."
        );
      } else {
        // Log other errors encountered during custom seed execution but don't stop the main seed process
        // as custom seeds might be optional or broken locally.
        console.warn(
          "⚠️ Error encountered during custom seed execution:",
          error
        );
      }
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
