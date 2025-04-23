import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  boolean,
  integer,
  primaryKey,
  customType,
  index,
  pgEnum,
  uuid,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations, SQL, sql } from "drizzle-orm";
import { SettingKey } from "@repo/types";

// Define custom PostgreSQL extension for trigrams
export const pgExtensions = sql`
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
`;

export const tsvector = customType<{
  data: string;
}>({
  dataType() {
    return `tsvector`;
  },
});

// Users table
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }),
    emailVerified: timestamp("email_verified"),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [index("email_idx").on(t.email)]
);

// Modules table
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Actions table
export const actions = pgTable("actions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Permissions table - defines available permissions in the system
export const permissions = pgTable(
  "permissions",
  {
    id: serial("id").primaryKey(),
    moduleId: integer("module_id")
      .notNull()
      .references(() => modules.id),
    resource: varchar("resource", { length: 50 }).notNull(),
    actionId: integer("action_id")
      .notNull()
      .references(() => actions.id),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    // Ensure logical uniqueness for a permission
    uniqueIndex("permission_uniq_idx").on(t.moduleId, t.resource, t.actionId),
  ]
);

// Groups table - custom user groups
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isSystem: boolean("is_system").default(false), // Is this a system group that cannot be deleted
  isEditable: boolean("is_editable").default(true), // Can the group's permissions be modified
  allowUserAssignment: boolean("allow_user_assignment").default(true), // Can users be assigned to this group
});

// User to groups many-to-many relationship
export const userGroups = pgTable(
  "user_groups",
  {
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    groupId: integer("group_id")
      .references(() => groups.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.groupId] }),
    index("user_group_idx").on(t.userId, t.groupId),
  ]
);

// Group permissions - linking groups to permissions
export const groupPermissions = pgTable(
  "group_permissions",
  {
    groupId: integer("group_id")
      .references(() => groups.id)
      .notNull(),
    permissionId: integer("permission_id")
      .references(() => permissions.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.groupId, t.permissionId] }),
    index("group_permission_idx").on(t.groupId, t.permissionId),
  ]
);

// Group module permissions - defines which modules a group can access
export const groupModulePermissions = pgTable(
  "group_module_permissions",
  {
    groupId: integer("group_id")
      .references(() => groups.id)
      .notNull(),
    moduleId: integer("module_id") // Changed from varchar("module")
      .references(() => modules.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.groupId, t.moduleId] }), // Updated primary key column
    index("group_module_permissions_idx").on(t.groupId, t.moduleId), // Updated index column
  ]
);

// Group action permissions - defines which actions a group can perform
export const groupActionPermissions = pgTable(
  "group_action_permissions",
  {
    groupId: integer("group_id")
      .references(() => groups.id)
      .notNull(),
    actionId: integer("action_id") // Changed from varchar("action")
      .references(() => actions.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.groupId, t.actionId] }), // Updated primary key column
    index("group_action_permissions_idx").on(t.groupId, t.actionId), // Updated index column
  ]
);

// Page-specific permissions (overrides group permissions for specific pages)
export const pagePermissions = pgTable(
  "page_permissions",
  {
    id: serial("id").primaryKey(),
    pageId: integer("page_id")
      .references(() => wikiPages.id)
      .notNull(),
    groupId: integer("group_id").references(() => groups.id),
    permissionId: integer("permission_id")
      .references(() => permissions.id)
      .notNull(),
    permissionType: varchar("permission_type", { length: 10 })
      .notNull()
      .default("allow"), // 'allow' or 'deny'
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    // Create a unique constraint to prevent duplicates
    index("page_group_perm_idx").on(t.pageId, t.permissionId, t.groupId),
  ]
);

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  createdWikiPages: many(wikiPages, {
    relationName: "createdBy",
  }),
  updatedWikiPages: many(wikiPages, {
    relationName: "updatedBy",
  }),
  userGroups: many(userGroups),
}));

// Group relations
export const groupsRelations = relations(groups, ({ many }) => ({
  userGroups: many(userGroups),
  groupPermissions: many(groupPermissions),
  pagePermissions: many(pagePermissions),
  groupModulePermissions: many(groupModulePermissions),
  groupActionPermissions: many(groupActionPermissions),
}));

// Permission relations
export const permissionsRelations = relations(permissions, ({ one, many }) => ({
  module: one(modules, {
    fields: [permissions.moduleId],
    references: [modules.id],
  }),
  action: one(actions, {
    fields: [permissions.actionId],
    references: [actions.id],
  }),
  groupPermissions: many(groupPermissions),
  pagePermissions: many(pagePermissions),
}));

// User to groups relations
export const userGroupsRelations = relations(userGroups, ({ one }) => ({
  user: one(users, {
    fields: [userGroups.userId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [userGroups.groupId],
    references: [groups.id],
  }),
}));

// Group permissions relations
export const groupPermissionsRelations = relations(
  groupPermissions,
  ({ one }) => ({
    group: one(groups, {
      fields: [groupPermissions.groupId],
      references: [groups.id],
    }),
    permission: one(permissions, {
      fields: [groupPermissions.permissionId],
      references: [permissions.id],
    }),
  })
);

// Page permissions relations
export const pagePermissionsRelations = relations(
  pagePermissions,
  ({ one }) => ({
    page: one(wikiPages, {
      fields: [pagePermissions.pageId],
      references: [wikiPages.id],
    }),
    group: one(groups, {
      fields: [pagePermissions.groupId],
      references: [groups.id],
    }),
    permission: one(permissions, {
      fields: [pagePermissions.permissionId],
      references: [permissions.id],
    }),
  })
);

export const groupModulePermissionsRelations = relations(
  groupModulePermissions,
  ({ one }) => ({
    group: one(groups, {
      fields: [groupModulePermissions.groupId],
      references: [groups.id],
    }),
    module: one(modules, {
      // Added relation to modules
      fields: [groupModulePermissions.moduleId],
      references: [modules.id],
    }),
  })
);

export const groupActionPermissionsRelations = relations(
  groupActionPermissions,
  ({ one }) => ({
    group: one(groups, {
      fields: [groupActionPermissions.groupId],
      references: [groups.id],
    }),
    action: one(actions, {
      // Added relation to actions
      fields: [groupActionPermissions.actionId],
      references: [actions.id],
    }),
  })
);

// Module relations
export const modulesRelations = relations(modules, ({ many }) => ({
  permissions: many(permissions),
  groupModulePermissions: many(groupModulePermissions),
}));

// Action relations
export const actionsRelations = relations(actions, ({ many }) => ({
  permissions: many(permissions),
  groupActionPermissions: many(groupActionPermissions),
}));

export const wikiPageEditorTypeEnum = pgEnum("editor_type", [
  "markdown",
  "html",
]);

// Pages table
export const wikiPages = pgTable(
  "wiki_pages",
  {
    id: serial("id").primaryKey(),
    path: varchar("path", { length: 1000 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content"),
    renderedHtml: text("rendered_html"),
    editorType: wikiPageEditorTypeEnum("editor_type"),
    isPublished: boolean("is_published").default(false),
    createdById: integer("created_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedById: integer("updated_by_id")
      .notNull()
      .references(() => users.id),
    updatedAt: timestamp("updated_at").defaultNow(),
    renderedHtmlUpdatedAt: timestamp("rendered_html_updated_at"),
    lockedById: integer("locked_by_id").references(() => users.id),
    lockedAt: timestamp("locked_at"),
    lockExpiresAt: timestamp("lock_expires_at"),
    search: tsvector("search")
      .notNull()
      .generatedAlwaysAs(
        (): SQL =>
          sql`setweight(to_tsvector('english', ${wikiPages.title}), 'A')
        ||
        setweight(to_tsvector('english', ${wikiPages.content}), 'B')`
      ),
  },
  (t) => [
    // Vector search index for tsvector column
    index("idx_search").using("gin", t.search),
    // Title trigram index
    index("trgm_idx_title").on(t.title),
  ]
);

// Page relations
export const wikiPagesRelations = relations(wikiPages, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [wikiPages.createdById],
    references: [users.id],
    relationName: "createdBy",
  }),
  updatedBy: one(users, {
    fields: [wikiPages.updatedById],
    references: [users.id],
    relationName: "updatedBy",
  }),
  lockedBy: one(users, {
    fields: [wikiPages.lockedById],
    references: [users.id],
    relationName: "lockedBy",
  }),
  revisions: many(wikiPageRevisions),
  tags: many(wikiPageToTag),
  assets: many(assetsToPages),
}));

// Page revisions table
export const wikiPageRevisions = pgTable("wiki_page_revisions", {
  id: serial("id").primaryKey(),
  pageId: integer("page_id")
    .references(() => wikiPages.id)
    .notNull(),
  content: text("content").notNull(),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Page revision relations
export const wikiPageRevisionsRelations = relations(
  wikiPageRevisions,
  ({ one }) => ({
    page: one(wikiPages, {
      fields: [wikiPageRevisions.pageId],
      references: [wikiPages.id],
    }),
    createdBy: one(users, {
      fields: [wikiPageRevisions.createdById],
      references: [users.id],
    }),
  })
);

// Tags table
export const wikiTags = pgTable("wiki_tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pages to tags (many-to-many)
export const wikiPageToTag = pgTable(
  "wiki_page_to_tag",
  {
    pageId: integer("page_id")
      .references(() => wikiPages.id)
      .notNull(),
    tagId: integer("tag_id")
      .references(() => wikiTags.id)
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.pageId, t.tagId] }),
  })
);

// Tag relations
export const wikiTagsRelations = relations(wikiTags, ({ many }) => ({
  pages: many(wikiPageToTag),
}));

// Page to tag relations
export const wikiPageToTagRelations = relations(wikiPageToTag, ({ one }) => ({
  page: one(wikiPages, {
    fields: [wikiPageToTag.pageId],
    references: [wikiPages.id],
  }),
  tag: one(wikiTags, {
    fields: [wikiPageToTag.tagId],
    references: [wikiTags.id],
  }),
}));

// NextAuth tables
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: varchar("token_type", { length: 255 }),
  scope: varchar("scope", { length: 255 }),
  id_token: text("id_token"),
  session_state: varchar("session_state", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Account relations
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  expires: timestamp("expires").notNull(),
});

// Session relations
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.identifier, t.token] }),
    index("verification_token_idx").on(t.identifier, t.token),
  ]
);

// Assets table for storing uploaded files
export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }),
  description: text("description"),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(),
  data: text("data").notNull(), // Base64 encoded file data
  uploadedById: integer("uploaded_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Junction table for many-to-many relationship between assets and pages
export const assetsToPages = pgTable(
  "assets_to_pages",
  {
    assetId: uuid("asset_id")
      .references(() => assets.id)
      .notNull(),
    pageId: integer("page_id")
      .references(() => wikiPages.id)
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.assetId, t.pageId] }),
    index("asset_page_idx").on(t.assetId, t.pageId),
  ]
);

// Asset relations - defines how assets relate to other tables
export const assetsRelations = relations(assets, ({ one, many }) => ({
  uploadedBy: one(users, {
    // 1:1 relation to user who uploaded the asset
    fields: [assets.uploadedById],
    references: [users.id],
  }),
  pages: many(assetsToPages), // Many-to-many relation to pages via junction table
}));

// AssetsToPages relations - defines the junction table relations
// This is needed because:
// 1. It allows querying from the junction table to get the connected asset/page
// 2. It enables proper type inference when querying through the relations
// 3. It maintains bidirectional navigation between assets and pages
export const assetsToPagesRelations = relations(assetsToPages, ({ one }) => ({
  asset: one(assets, {
    // 1:1 relation back to the asset
    fields: [assetsToPages.assetId],
    references: [assets.id],
  }),
  page: one(wikiPages, {
    // 1:1 relation to the connected page
    fields: [assetsToPages.pageId],
    references: [wikiPages.id],
  }),
}));

// Settings table - stores application settings
export const settings = pgTable(
  "settings",
  {
    key: varchar("key", { length: 100 }).primaryKey().$type<SettingKey>(),
    value: jsonb("value").notNull(), // Store setting value as JSONB
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("settings_key_idx").on(t.key)]
);

// Settings history table - tracks changes to settings
export const settingsHistory = pgTable(
  "settings_history",
  {
    id: serial("id").primaryKey(),
    settingKey: varchar("setting_key", { length: 100 })
      .notNull()
      .$type<SettingKey>()
      .references(() => settings.key),
    previousValue: jsonb("previous_value"), // Previous value as JSONB
    changedById: integer("changed_by_id").references(() => users.id),
    changedAt: timestamp("changed_at").defaultNow().notNull(),
    changeReason: text("change_reason"),
  },
  (t) => [
    index("settings_history_key_idx").on(t.settingKey),
    index("settings_history_user_idx").on(t.changedById),
    index("settings_history_time_idx").on(t.changedAt),
  ]
);

// Add relations for settings
export const settingsRelations = relations(settings, ({ many }) => ({
  history: many(settingsHistory),
}));

export const settingsHistoryRelations = relations(
  settingsHistory,
  ({ one }) => ({
    setting: one(settings, {
      fields: [settingsHistory.settingKey],
      references: [settings.key],
    }),
    changedBy: one(users, {
      fields: [settingsHistory.changedById],
      references: [users.id],
    }),
  })
);
