CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(150) NOT NULL,
	"email" varchar(254) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "masjid" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "masjid_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "masjid_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"masjid_id" uuid NOT NULL,
	"city_id" varchar(50),
	"city_name" varchar(255),
	"iqomah_subuh" integer DEFAULT 20 NOT NULL,
	"iqomah_dzuhur" integer DEFAULT 10 NOT NULL,
	"iqomah_ashar" integer DEFAULT 10 NOT NULL,
	"iqomah_maghrib" integer DEFAULT 5 NOT NULL,
	"iqomah_isya" integer DEFAULT 10 NOT NULL,
	"blackout_duration_minutes" integer DEFAULT 30 NOT NULL,
	"slide_duration_kegiatan_seconds" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "masjid_settings_masjid_id_unique" UNIQUE("masjid_id"),
	CONSTRAINT "slide_duration_positive" CHECK ("masjid_settings"."slide_duration_kegiatan_seconds" > 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "masjid_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"masjid_id" uuid NOT NULL,
	"media_type" varchar(10) NOT NULL,
	"media_value" text NOT NULL,
	"media_name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"start_time" time,
	"end_time" time,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_type_enum" CHECK ("masjid_media"."media_type" IN ('url', 'youtube', 'file'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hadist_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"masjid_id" uuid NOT NULL,
	"text" text NOT NULL,
	"source" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "running_texts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"masjid_id" uuid NOT NULL,
	"text" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "running_text_length" CHECK (char_length("running_texts"."text") <= 255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financial_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"masjid_id" uuid NOT NULL,
	"date" date NOT NULL,
	"income" bigint DEFAULT 0 NOT NULL,
	"expense" bigint DEFAULT 0 NOT NULL,
	"note" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "financial_reports_date_check" CHECK ("financial_reports"."date" <= CURRENT_DATE)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financial_summary" (
	"masjid_id" uuid PRIMARY KEY NOT NULL,
	"account_balance" bigint DEFAULT 0 NOT NULL,
	"monthly_expense" bigint DEFAULT 0 NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "masjid" ADD CONSTRAINT "masjid_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "masjid_settings" ADD CONSTRAINT "masjid_settings_masjid_id_masjid_id_fk" FOREIGN KEY ("masjid_id") REFERENCES "public"."masjid"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "masjid_media" ADD CONSTRAINT "masjid_media_masjid_id_masjid_settings_masjid_id_fk" FOREIGN KEY ("masjid_id") REFERENCES "public"."masjid_settings"("masjid_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hadist_quotes" ADD CONSTRAINT "hadist_quotes_masjid_id_masjid_id_fk" FOREIGN KEY ("masjid_id") REFERENCES "public"."masjid"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "running_texts" ADD CONSTRAINT "running_texts_masjid_id_masjid_id_fk" FOREIGN KEY ("masjid_id") REFERENCES "public"."masjid"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_masjid_id_masjid_id_fk" FOREIGN KEY ("masjid_id") REFERENCES "public"."masjid"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "financial_summary" ADD CONSTRAINT "financial_summary_masjid_id_masjid_id_fk" FOREIGN KEY ("masjid_id") REFERENCES "public"."masjid"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_username" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_masjid_user_id" ON "masjid" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_masjid_settings_masjid_id" ON "masjid_settings" USING btree ("masjid_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_masjid_media_masjid_id" ON "masjid_media" USING btree ("masjid_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_masjid_media_type" ON "masjid_media" USING btree ("media_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hadist_quotes_masjid_id" ON "hadist_quotes" USING btree ("masjid_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hadist_quotes_is_active" ON "hadist_quotes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_running_texts_masjid_id" ON "running_texts" USING btree ("masjid_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_running_texts_is_active" ON "running_texts" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_financial_reports_unique_date" ON "financial_reports" USING btree ("masjid_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_financial_reports_masjid_id" ON "financial_reports" USING btree ("masjid_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_financial_reports_date" ON "financial_reports" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_financial_reports_is_active" ON "financial_reports" USING btree ("is_active");