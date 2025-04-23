/**
 * Type definitions for NextWiki settings system
 * All application settings are stored in the database and accessed through this type system
 */

/**
 * Setting value types
 */
export type StringSetting = { type: "string"; value: string };
export type NumberSetting = { type: "number"; value: number };
export type BooleanSetting = { type: "boolean"; value: boolean };
export type SelectSetting<T extends string> = {
  type: "select";
  value: T;
  options: T[];
};
export type JsonSetting = { type: "json"; value: Record<string, unknown> };

/**
 * Setting metadata
 */
export interface SettingMeta {
  description: string;
  category: SettingCategory;
  defaultValue: unknown;
  isSecret?: boolean;
  requiresRestart?: boolean;
}

/**
 * Setting categories for UI organization
 */
export type SettingCategory =
  | "general"
  | "auth"
  | "appearance"
  | "editor"
  | "search"
  | "advanced";

/**
 * Combined setting definition with value and metadata
 */
export type SettingDefinition<T extends SettingValueType> = T & SettingMeta;

/**
 * Any valid setting value type
 */
export type SettingValueType =
  | StringSetting
  | NumberSetting
  | BooleanSetting
  | SelectSetting<string>
  | JsonSetting;

/**
 * All application settings with their types and metadata
 */
export interface SettingsDefinitions {
  // General settings
  "site.title": SettingDefinition<StringSetting>;
  "site.description": SettingDefinition<StringSetting>;
  "site.url": SettingDefinition<StringSetting>;
  "site.logo": SettingDefinition<StringSetting>;

  // Authentication settings
  "auth.allowRegistration": SettingDefinition<BooleanSetting>;
  "auth.requireEmailVerification": SettingDefinition<BooleanSetting>;
  "auth.defaultUserGroup": SettingDefinition<StringSetting>;
  "auth.minPasswordLength": SettingDefinition<NumberSetting>;

  // Appearance settings
  "appearance.defaultTheme": SettingDefinition<
    SelectSetting<"light" | "dark" | "system">
  >;
  "appearance.accentColor": SettingDefinition<StringSetting>;
  "appearance.showSidebar": SettingDefinition<BooleanSetting>;

  // Editor settings
  "editor.defaultType": SettingDefinition<SelectSetting<"markdown" | "html">>;
  "editor.spellcheck": SettingDefinition<BooleanSetting>;
  "editor.autosaveInterval": SettingDefinition<NumberSetting>;

  // Search settings
  "search.fuzzyMatching": SettingDefinition<BooleanSetting>;
  "search.maxResults": SettingDefinition<NumberSetting>;
  "search.minScore": SettingDefinition<NumberSetting>;

  // Advanced settings
  "advanced.assetStorageProvider": SettingDefinition<
    SelectSetting<"local" | "s3" | "azure">
  >;
  "advanced.storageConfig": SettingDefinition<JsonSetting>;
  "advanced.maxUploadSize": SettingDefinition<NumberSetting>;
}

/**
 * Type for a setting key
 */
export type SettingKey = keyof SettingsDefinitions;

/**
 * Type for getting a setting value based on its key
 */
export type SettingValue<K extends SettingKey> =
  SettingsDefinitions[K]["value"];

/**
 * Type for settings stored in the database
 */
export interface DbSetting<K extends SettingKey = SettingKey> {
  key: K;
  value: SettingValue<K>;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Type for settings history entry
 */
export interface SettingHistoryEntry<K extends SettingKey = SettingKey> {
  id: number;
  settingKey: K;
  previousValue: SettingValue<K>;
  changedById: number | null;
  changedAt: Date;
  changeReason: string | null;
}

/**
 * Default values for all settings
 */
export const DEFAULT_SETTINGS: {
  [K in SettingKey]: SettingsDefinitions[K];
} = {
  // General settings
  "site.title": {
    type: "string",
    value: "NextWiki",
    description: "The title of your wiki site",
    category: "general",
    defaultValue: "NextWiki",
  },
  "site.description": {
    type: "string",
    value: "A modern wiki built with Next.js",
    description: "A short description of your wiki site",
    category: "general",
    defaultValue: "A modern wiki built with Next.js",
  },
  "site.url": {
    type: "string",
    value: "http://localhost:3000",
    description: "The full URL of your wiki site (without trailing slash)",
    category: "general",
    defaultValue: "http://localhost:3000",
  },
  "site.logo": {
    type: "string",
    value: "/assets/images/logo.svg",
    description: "Path to the logo image file",
    category: "general",
    defaultValue: "/assets/images/logo.svg",
  },

  // Authentication settings
  "auth.allowRegistration": {
    type: "boolean",
    value: true,
    description: "Allow new user registrations",
    category: "auth",
    defaultValue: true,
  },
  "auth.requireEmailVerification": {
    type: "boolean",
    value: false,
    description: "Require email verification before allowing login",
    category: "auth",
    defaultValue: false,
  },
  "auth.defaultUserGroup": {
    type: "string",
    value: "users",
    description: "Default group for new users",
    category: "auth",
    defaultValue: "users",
  },
  "auth.minPasswordLength": {
    type: "number",
    value: 8,
    description: "Minimum password length for new accounts",
    category: "auth",
    defaultValue: 8,
  },

  // Appearance settings
  "appearance.defaultTheme": {
    type: "select",
    value: "system",
    options: ["light", "dark", "system"],
    description: "Default theme for new users",
    category: "appearance",
    defaultValue: "system",
  },
  "appearance.accentColor": {
    type: "string",
    value: "#0070f3",
    description: "Accent color for UI elements (hex code)",
    category: "appearance",
    defaultValue: "#0070f3",
  },
  "appearance.showSidebar": {
    type: "boolean",
    value: true,
    description: "Show sidebar navigation by default",
    category: "appearance",
    defaultValue: true,
  },

  // Editor settings
  "editor.defaultType": {
    type: "select",
    value: "markdown",
    options: ["markdown", "html"],
    description: "Default editor type for new pages",
    category: "editor",
    defaultValue: "markdown",
  },
  "editor.spellcheck": {
    type: "boolean",
    value: true,
    description: "Enable spellchecking in the editor",
    category: "editor",
    defaultValue: true,
  },
  "editor.autosaveInterval": {
    type: "number",
    value: 30,
    description: "Autosave interval in seconds (0 to disable)",
    category: "editor",
    defaultValue: 30,
  },

  // Search settings
  "search.fuzzyMatching": {
    type: "boolean",
    value: true,
    description: "Enable fuzzy matching in search results",
    category: "search",
    defaultValue: true,
  },
  "search.maxResults": {
    type: "number",
    value: 20,
    description: "Maximum number of search results to display",
    category: "search",
    defaultValue: 20,
  },
  "search.minScore": {
    type: "number",
    value: 0.3,
    description: "Minimum relevance score for search results (0-1)",
    category: "search",
    defaultValue: 0.3,
  },

  // Advanced settings
  "advanced.assetStorageProvider": {
    type: "select",
    value: "local",
    options: ["local", "s3", "azure"],
    description: "Provider for storing uploaded assets",
    category: "advanced",
    defaultValue: "local",
    requiresRestart: true,
  },
  "advanced.storageConfig": {
    type: "json",
    value: {},
    description: "Configuration for the selected storage provider",
    category: "advanced",
    defaultValue: {},
    isSecret: true,
  },
  "advanced.maxUploadSize": {
    type: "number",
    value: 5242880, // 5MB in bytes
    description: "Maximum file upload size in bytes",
    category: "advanced",
    defaultValue: 5242880,
  },
};

/**
 * Type-safe helper to get setting default value
 */
export function getDefaultSetting<K extends SettingKey>(
  key: K
): SettingValue<K> {
  return DEFAULT_SETTINGS[key].value;
}

/**
 * Type-safe helper to get setting metadata
 */
export function getSettingMeta<K extends SettingKey>(
  key: K
): Omit<SettingDefinition<SettingValueType>, "type" | "value" | "options"> {
  // Extract just the metadata fields
  const { description, category, defaultValue, isSecret, requiresRestart } =
    DEFAULT_SETTINGS[key];
  return { description, category, defaultValue, isSecret, requiresRestart };
}

/**
 * Export default settings as index
 */
export default DEFAULT_SETTINGS;
