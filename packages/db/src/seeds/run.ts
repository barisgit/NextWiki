import { createDefaultGroups, seedPermissions } from "./permissions.js";
import { runDeveloperSeeds } from "./developer-seeds.js";
import { seedSettings } from "./settings.js";

/**
 * Main function to run all seed operations.
 */
async function seed() {
  console.log("Starting database seeding...");

  try {
    // 1. Seed Permissions
    await seedPermissions();

    // 2. Create Default Groups and assign base permissions
    await createDefaultGroups();

    // 3. Seed Default Settings
    await seedSettings();

    if (!process.env.SKIP_DEVELOPER_SEEDS) {
      // 4. Run Developer Seeds (admin user, example pages, etc.)
      await runDeveloperSeeds();

      // 5. Run Custom Seeds - uncomment when custom seeds are defined
      // try {
      //   const customSeeds = await import("./custom-seeds.js");
      //   await customSeeds.runCustomSeeds();
      // } catch (error) {
      //   console.warn("  Custom seeds probably not defined", error);
      // }
    }

    console.log("\n✅ Database seeding completed successfully.");
  } catch (error) {
    console.error("\n❌ Database seeding failed:", error);
    process.exitCode = 1; // Indicate failure
  } finally {
    console.log("Seeding script finished.");
  }
}

/**
 * Execute the seed function when this module is run directly.
 * Uses Node.js module detection pattern to determine direct execution.
 */
// Use ES module way to check if the script is run directly
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  void seed().catch((error) => {
    console.error("Failed to run seeds:", error);
    process.exit(1);
  });
}

export { seed };
