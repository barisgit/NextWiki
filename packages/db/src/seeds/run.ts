import { createDefaultGroups, seedPermissions } from "./permissions.js";
import { runCustomSeeds } from "./custom-seeds.js";
// import { db } from "../index.js"; // No longer needed for closing
// import pg from "pg"; // No longer needed for closing

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

    // 3. Run Custom Seeds (admin user, example pages, etc.)
    await runCustomSeeds();

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
