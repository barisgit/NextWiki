CREATE TABLE "settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"setting_key" varchar(100) NOT NULL,
	"previous_value" jsonb,
	"changed_by_id" integer,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"change_reason" text
);
--> statement-breakpoint
ALTER TABLE "settings_history" ADD CONSTRAINT "settings_history_setting_key_settings_key_fk" FOREIGN KEY ("setting_key") REFERENCES "public"."settings"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings_history" ADD CONSTRAINT "settings_history_changed_by_id_users_id_fk" FOREIGN KEY ("changed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "settings_key_idx" ON "settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "settings_history_key_idx" ON "settings_history" USING btree ("setting_key");--> statement-breakpoint
CREATE INDEX "settings_history_user_idx" ON "settings_history" USING btree ("changed_by_id");--> statement-breakpoint
CREATE INDEX "settings_history_time_idx" ON "settings_history" USING btree ("changed_at");