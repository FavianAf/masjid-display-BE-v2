ALTER TABLE "masjid_settings" ADD COLUMN "address" varchar(500);--> statement-breakpoint
ALTER TABLE "masjid_settings" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "masjid_settings" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "masjid_settings" ADD CONSTRAINT "latitude_range" CHECK ("masjid_settings"."latitude" IS NULL OR "masjid_settings"."latitude" BETWEEN -90 AND 90);--> statement-breakpoint
ALTER TABLE "masjid_settings" ADD CONSTRAINT "longitude_range" CHECK ("masjid_settings"."longitude" IS NULL OR "masjid_settings"."longitude" BETWEEN -180 AND 180);