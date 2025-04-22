CREATE TYPE "public"."editor_type" AS ENUM('markdown', 'html');
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"description" text,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"data" text NOT NULL,
	"uploaded_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assets_to_pages" (
	"asset_id" uuid NOT NULL,
	"page_id" integer NOT NULL,
	CONSTRAINT "assets_to_pages_asset_id_page_id_pk" PRIMARY KEY("asset_id", "page_id")
);
--> statement-breakpoint
CREATE TABLE "group_action_permissions" (
	"group_id" integer NOT NULL,
	"action" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "group_action_permissions_group_id_action_pk" PRIMARY KEY("group_id", "action")
);
--> statement-breakpoint
CREATE TABLE "group_module_permissions" (
	"group_id" integer NOT NULL,
	"module" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "group_module_permissions_group_id_module_pk" PRIMARY KEY("group_id", "module")
);
--> statement-breakpoint
CREATE TABLE "group_permissions" (
	"group_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "group_permissions_group_id_permission_id_pk" PRIMARY KEY("group_id", "permission_id")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"is_system" boolean DEFAULT false,
	"is_editable" boolean DEFAULT true,
	"allow_user_assignment" boolean DEFAULT true,
	CONSTRAINT "groups_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "page_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_id" integer NOT NULL,
	"group_id" integer,
	"permission_id" integer NOT NULL,
	"permission_type" varchar(10) DEFAULT 'allow' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"module" varchar(50) NOT NULL,
	"resource" varchar(50) NOT NULL,
	"action" varchar(50) NOT NULL,
	"name" varchar(100) GENERATED ALWAYS AS ("module" || ':' || "resource" || ':' || "action") STORED NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"user_id" integer NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "user_groups" (
	"user_id" integer NOT NULL,
	"group_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_groups_user_id_group_id_pk" PRIMARY KEY("user_id", "group_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"password" varchar(255),
	"email_verified" timestamp,
	"image" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier", "token")
);
--> statement-breakpoint
CREATE TABLE "wiki_page_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wiki_page_to_tag" (
	"page_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "wiki_page_to_tag_page_id_tag_id_pk" PRIMARY KEY("page_id", "tag_id")
);
--> statement-breakpoint
CREATE TABLE "wiki_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" varchar(1000) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text,
	"rendered_html" text,
	"editor_type" "editor_type",
	"is_published" boolean DEFAULT false,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_by_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"rendered_html_updated_at" timestamp,
	"locked_by_id" integer,
	"locked_at" timestamp,
	"lock_expires_at" timestamp,
	"search" "tsvector" GENERATED ALWAYS AS (
		setweight(
			to_tsvector('english', "wiki_pages"."title"),
			'A'
		) || setweight(
			to_tsvector('english', "wiki_pages"."content"),
			'B'
		)
	) STORED NOT NULL,
	CONSTRAINT "wiki_pages_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "wiki_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "wiki_tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "accounts"
ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "assets"
ADD CONSTRAINT "assets_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "assets_to_pages"
ADD CONSTRAINT "assets_to_pages_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "assets_to_pages"
ADD CONSTRAINT "assets_to_pages_page_id_wiki_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."wiki_pages"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_action_permissions"
ADD CONSTRAINT "group_action_permissions_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_module_permissions"
ADD CONSTRAINT "group_module_permissions_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_permissions"
ADD CONSTRAINT "group_permissions_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_permissions"
ADD CONSTRAINT "group_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "page_permissions"
ADD CONSTRAINT "page_permissions_page_id_wiki_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."wiki_pages"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "page_permissions"
ADD CONSTRAINT "page_permissions_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "page_permissions"
ADD CONSTRAINT "page_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sessions"
ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_groups"
ADD CONSTRAINT "user_groups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_groups"
ADD CONSTRAINT "user_groups_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "wiki_page_revisions"
ADD CONSTRAINT "wiki_page_revisions_page_id_wiki_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."wiki_pages"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "wiki_page_revisions"
ADD CONSTRAINT "wiki_page_revisions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "wiki_page_to_tag"
ADD CONSTRAINT "wiki_page_to_tag_page_id_wiki_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."wiki_pages"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "wiki_page_to_tag"
ADD CONSTRAINT "wiki_page_to_tag_tag_id_wiki_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."wiki_tags"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "wiki_pages"
ADD CONSTRAINT "wiki_pages_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "wiki_pages"
ADD CONSTRAINT "wiki_pages_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "wiki_pages"
ADD CONSTRAINT "wiki_pages_locked_by_id_users_id_fk" FOREIGN KEY ("locked_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "asset_page_idx" ON "assets_to_pages" USING btree ("asset_id", "page_id");
--> statement-breakpoint
CREATE INDEX "group_action_permissions_idx" ON "group_action_permissions" USING btree ("group_id", "action");
--> statement-breakpoint
CREATE INDEX "group_module_permissions_idx" ON "group_module_permissions" USING btree ("group_id", "module");
--> statement-breakpoint
CREATE INDEX "group_permission_idx" ON "group_permissions" USING btree ("group_id", "permission_id");
--> statement-breakpoint
CREATE INDEX "page_group_perm_idx" ON "page_permissions" USING btree ("page_id", "permission_id", "group_id");
--> statement-breakpoint
CREATE INDEX "user_group_idx" ON "user_groups" USING btree ("user_id", "group_id");
--> statement-breakpoint
CREATE INDEX "email_idx" ON "users" USING btree ("email");
--> statement-breakpoint
CREATE INDEX "idx_search" ON "wiki_pages" USING gin ("search");
--> statement-breakpoint
CREATE INDEX "trgm_idx_title" ON "wiki_pages" USING btree ("title");
--> statement-breakpoint
-- Enable the pg_trgm extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
-- Create trigram GIN indexes for fast similarity searches
CREATE INDEX IF NOT EXISTS trgm_idx_title ON wiki_pages USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS trgm_idx_content ON wiki_pages USING GIN (content gin_trgm_ops);
--> statement-breakpoint
-- Add comment to explain what these indexes are for
COMMENT ON INDEX trgm_idx_title IS 'Trigram index on wiki page titles for fuzzy search';
COMMENT ON INDEX trgm_idx_content IS 'Trigram index on wiki page content for fuzzy search';
--> statement-breakpoint
-- Display information about the created indexes
SELECT indexname,
	indexdef
FROM pg_indexes
WHERE indexname IN ('trgm_idx_title', 'trgm_idx_content');