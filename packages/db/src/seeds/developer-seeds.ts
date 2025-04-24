import { seedAdminUser, seedUserUser } from "./developer/users.js";
import { seedExamplePages } from "./developer/example-pages.js";

/**
 * Runs developer seeds
 */
export async function runDeveloperSeeds() {
  console.log("  -> Running developer seeds...");

  try {
    // Seed the admin user (important to run first if other seeds depend on it)
    await seedAdminUser();
    await seedUserUser();

    // Seed example pages
    await seedExamplePages();

    console.log("  -> Developer seeds finished.");
  } catch (error) {
    console.error("  ❌ Error during developer seed operations:", error);
    // Decide if you want to throw the error or continue seeding other things
    // throw error;
  }
}
