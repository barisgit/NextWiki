import { db } from "../index.js";
import { settings } from "../schema/index.js";
import type { SettingKey } from "@repo/types";

/**
 * Seeds the default settings into the database.
 * Only initializes settings that don't already exist.
 */
export async function seedSettings() {
  console.log("\nSeeding default settings...");

  try {
    // Dynamically import to avoid circular dependencies
    const settingsModule = await import("@repo/types");
    const DEFAULT_SETTINGS = settingsModule.DEFAULT_SETTINGS;

    // Get all defined setting keys
    const allKeys = Object.keys(DEFAULT_SETTINGS) as SettingKey[];

    // Check which settings already exist in the database
    const existingSettings = await db.query.settings.findMany({
      columns: { key: true },
    });
    const existingKeys = new Set(existingSettings.map((s) => s.key));

    // Filter out keys that already exist
    const keysToCreate = allKeys.filter((key) => !existingKeys.has(key));

    // Create missing settings with default values
    if (keysToCreate.length > 0) {
      for (const key of keysToCreate) {
        const setting = DEFAULT_SETTINGS[key];

        await db.insert(settings).values({
          key: key as SettingKey,
          value: setting.value,
          description: setting.description,
        });

        console.log(`  ✓ Initialized setting: ${key}`);
      }

      console.log(`  ✅ Created ${keysToCreate.length} default settings`);
    } else {
      console.log("  ✓ All settings already exist, nothing to seed");
    }

    return true;
  } catch (error) {
    console.error("  ❌ Error seeding settings:", error);
    return false;
  }
}
