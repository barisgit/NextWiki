import { pgTable, serial, text, timestamp, varchar, boolean, jsonb, integer, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  createdWikiPages: many(wikiPages, {
    relationName: 'createdBy',
  }),
  updatedWikiPages: many(wikiPages, {
    relationName: 'updatedBy',
  }),
}));

// Pages table
export const wikiPages = pgTable('wiki_pages', {
  id: serial('id').primaryKey(),
  path: varchar('path', { length: 1000 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  isPublished: boolean('is_published').default(false),
  createdById: integer('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedById: integer('updated_by_id').references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Page relations
export const wikiPagesRelations = relations(wikiPages, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [wikiPages.createdById],
    references: [users.id],
    relationName: 'createdBy',
  }),
  updatedBy: one(users, {
    fields: [wikiPages.updatedById],
    references: [users.id],
    relationName: 'updatedBy',
  }),
  revisions: many(wikiPageRevisions),
  tags: many(wikiPageToTag),
}));

// Page revisions table
export const wikiPageRevisions = pgTable('wiki_page_revisions', {
  id: serial('id').primaryKey(),
  pageId: integer('page_id').references(() => wikiPages.id).notNull(),
  content: text('content').notNull(),
  createdById: integer('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Page revision relations
export const wikiPageRevisionsRelations = relations(wikiPageRevisions, ({ one }) => ({
  page: one(wikiPages, {
    fields: [wikiPageRevisions.pageId],
    references: [wikiPages.id],
  }),
  createdBy: one(users, {
    fields: [wikiPageRevisions.createdById],
    references: [users.id],
  }),
}));

// Tags table
export const wikiTags = pgTable('wiki_tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Pages to tags (many-to-many)
export const wikiPageToTag = pgTable('wiki_page_to_tag', {
  pageId: integer('page_id').references(() => wikiPages.id).notNull(),
  tagId: integer('tag_id').references(() => wikiTags.id).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.pageId, t.tagId] }),
}));

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
export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Account relations
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  userId: integer('user_id').references(() => users.id).notNull(),
  expires: timestamp('expires').notNull(),
});

// Session relations
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  expires: timestamp('expires').notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.identifier, t.token] }),
})); 