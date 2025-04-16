// This file is intended for developers to add their own custom seed data.
// It is ignored by git by default (see .gitignore).
// You can copy the contents of custom-seeds.example.ts here to get started.

/**
 * Runs custom seed operations defined by the developer.
 * Add your custom seeding logic within this function or call other
 * imported seed functions.
 */
export async function runCustomSeeds() {
  console.log("  -> Running custom seeds (if any defined)...");

  // Example: Uncomment and import if you want to run the example page seed
  // import { seedExamplePages } from './custom-seeds.example';
  // await seedExamplePages();

  // Add other custom seed calls here:
  // await seedMyTestData();

  console.log("  -> Custom seeds finished.");
}
