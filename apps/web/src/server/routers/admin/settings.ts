import { z } from "zod";
import { router, permissionProtectedProcedure } from "~/server";
import {
  getAllSettings,
  getSetting,
  getSettingHistory,
  updateSetting,
  deleteSetting,
  initializeDefaultSettings,
} from "~/lib/services/settings";
import { DEFAULT_SETTINGS, type SettingKey } from "@repo/types";

// Create a Zod schema for setting keys
const SettingKeySchema = z.enum(
  Object.keys(DEFAULT_SETTINGS) as [string, ...string[]]
);

/**
 * tRPC router for settings management in the admin section
 */
export const settingsRouter = router({
  /**
   * Get all settings
   */
  getAll: permissionProtectedProcedure("system:settings:read").query(
    async () => {
      const settings = await getAllSettings();
      return settings;
    }
  ),

  /**
   * Get a specific setting by key
   */
  get: permissionProtectedProcedure("system:settings:read")
    .input(
      z.object({
        key: SettingKeySchema,
      })
    )
    .query(async ({ input }) => {
      const value = await getSetting(input.key as SettingKey);
      return {
        key: input.key,
        value,
        meta: DEFAULT_SETTINGS[input.key as SettingKey],
      };
    }),

  /**
   * Update a setting
   */
  update: permissionProtectedProcedure("system:settings:update")
    .input(
      z.object({
        key: SettingKeySchema,
        value: z.any(), // We'll validate the value type in the resolver
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { key, value, reason } = input;
      const typedKey = key as SettingKey;

      // Validate the value matches the expected type
      const expectedType = DEFAULT_SETTINGS[typedKey].type;

      // Simple type validation
      const valueType = typeof value;
      if (
        (expectedType === "string" && valueType !== "string") ||
        (expectedType === "number" && valueType !== "number") ||
        (expectedType === "boolean" && valueType !== "boolean") ||
        // For select, we need to check if the value is in the options
        (expectedType === "select" &&
          !(
            "options" in DEFAULT_SETTINGS[typedKey] &&
            (DEFAULT_SETTINGS[typedKey].options as string[]).includes(value)
          )) ||
        // For JSON, we need to check if it's an object
        (expectedType === "json" && (valueType !== "object" || value === null))
      ) {
        throw new Error(
          `Invalid value type for setting ${key}. Expected ${expectedType}, got ${valueType}`
        );
      }

      await updateSetting(
        typedKey,
        value,
        parseInt(ctx.session.user.id),
        reason
      );

      return { success: true };
    }),

  /**
   * Reset a setting to its default value
   */
  reset: permissionProtectedProcedure("system:settings:update")
    .input(
      z.object({
        key: SettingKeySchema,
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { key, reason } = input;
      const typedKey = key as SettingKey;

      // First delete the current setting
      await deleteSetting(
        typedKey,
        parseInt(ctx.session.user.id),
        reason || "Reset to default"
      );

      return { success: true };
    }),

  /**
   * Get the history of changes for a setting
   */
  getHistory: permissionProtectedProcedure("system:settings:read")
    .input(
      z.object({
        key: SettingKeySchema,
      })
    )
    .query(async ({ input }) => {
      const history = await getSettingHistory(input.key as SettingKey);
      return history;
    }),

  /**
   * Get settings by category
   */
  getByCategory: permissionProtectedProcedure("system:settings:read")
    .input(
      z.object({
        category: z.enum([
          "general",
          "auth",
          "appearance",
          "editor",
          "search",
          "advanced",
        ]),
      })
    )
    .query(async ({ input }) => {
      // Get all settings
      const allSettings = await getAllSettings();

      // Filter settings by category and add metadata
      const categorySettings = Object.entries(DEFAULT_SETTINGS)
        .filter(([_, setting]) => {
          void _;
          // Type assertion to access category property
          const typedSetting = setting;
          return typedSetting.category === input.category;
        })
        .map(([key]) => {
          const typedKey = key as SettingKey;

          // Use getSetting to get the value with proper defaults if not in database
          const defaultValue = DEFAULT_SETTINGS[typedKey].value;
          const value =
            typedKey in allSettings
              ? allSettings[typedKey as keyof typeof allSettings]
              : defaultValue;

          return {
            key: typedKey,
            value,
            meta: DEFAULT_SETTINGS[typedKey],
          };
        });

      return categorySettings;
    }),

  /**
   * Initialize default settings
   */
  initialize: permissionProtectedProcedure("system:settings:update").mutation(
    async ({ ctx }) => {
      void ctx;
      await initializeDefaultSettings();
      return { success: true };
    }
  ),
});
