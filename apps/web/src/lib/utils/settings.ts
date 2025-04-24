import {
  type SettingKey,
  type SettingValue,
  getDefaultSetting,
} from "@repo/types";
import { getSetting, getAllSettings } from "../services/settings";
import { cache } from "react";

/**
 * Get a single setting value with caching for server components
 * Falls back to default value if setting doesn't exist in database
 *
 * @param key The setting key to retrieve
 * @returns The setting value
 */
export const getSettingValue = cache(
  async <K extends SettingKey>(key: K): Promise<SettingValue<K>> => {
    try {
      return await getSetting(key);
    } catch (error) {
      console.error(`Error fetching setting "${key}":`, error);
      return getDefaultSetting(key);
    }
  }
);

/**
 * Get multiple setting values with caching for server components
 * Falls back to default values for any settings that don't exist in database
 *
 * @param keys Array of setting keys to retrieve
 * @returns Object with requested settings
 */
export const getSettingValues = cache(
  async <K extends SettingKey>(
    keys: K[]
  ): Promise<Record<K, SettingValue<K>>> => {
    try {
      // Get all settings for efficiency
      const allSettings = await getAllSettings();

      // Create result object with values from database or defaults
      return keys.reduce(
        (acc, key) => {
          // Use database value if available, otherwise use default
          if (key in allSettings) {
            acc[key] = allSettings[
              key as keyof typeof allSettings
            ] as SettingValue<K>;
          } else {
            acc[key] = getDefaultSetting(key);
          }
          return acc;
        },
        {} as Record<K, SettingValue<K>>
      );
    } catch (error) {
      console.error(`Error fetching settings:`, error);

      // Fall back to all defaults
      return keys.reduce(
        (acc, key) => {
          acc[key] = getDefaultSetting(key);
          return acc;
        },
        {} as Record<K, SettingValue<K>>
      );
    }
  }
);

/**
 * Example usage in a server component:
 *
 * export default async function Page() {
 *   const siteTitle = await getSettingValue('site.title');
 *   // or get multiple settings at once
 *   const { 'site.title': title, 'site.description': description } =
 *     await getSettingValues(['site.title', 'site.description']);
 *
 *   return <h1>{title}</h1>;
 * }
 */
