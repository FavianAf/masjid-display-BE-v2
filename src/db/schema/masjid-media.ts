import { boolean, check, index, pgTable, text, time, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { masjidSettings } from "./masjid-settings";

export const masjidMedia = pgTable(
  "masjid_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    masjidId: uuid("masjid_id")
      .notNull()
      .references(() => masjidSettings.masjidId, { onDelete: "cascade" }),
    mediaType: varchar("media_type", { length: 10 }).notNull(),
    mediaValue: text("media_value").notNull(),
    mediaName: varchar("media_name", { length: 255 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    startTime: time("start_time"),
    endTime: time("end_time"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_masjid_media_masjid_id").on(table.masjidId),
    index("idx_masjid_media_type").on(table.mediaType),
    check("media_type_enum", sql`${table.mediaType} IN ('url', 'youtube', 'file')`),
  ],
);
