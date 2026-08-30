import { check, doublePrecision, index, integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { masjids } from "./masjids";

export const masjidSettings = pgTable(
  "masjid_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    masjidId: uuid("masjid_id")
      .notNull()
      .unique()
      .references(() => masjids.id, { onDelete: "cascade" }),
    cityId: varchar("city_id", { length: 50 }),
    cityName: varchar("city_name", { length: 255 }),
    address: varchar("address", { length: 500 }),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    iqomahSubuh: integer("iqomah_subuh").notNull().default(20),
    iqomahDzuhur: integer("iqomah_dzuhur").notNull().default(10),
    iqomahAshar: integer("iqomah_ashar").notNull().default(10),
    iqomahMaghrib: integer("iqomah_maghrib").notNull().default(5),
    iqomahIsya: integer("iqomah_isya").notNull().default(10),
    blackoutDurationMinutes: integer("blackout_duration_minutes").notNull().default(30),
    slideDurationKegiatanSeconds: integer("slide_duration_kegiatan_seconds").notNull().default(10),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_masjid_settings_masjid_id").on(table.masjidId),
    check("slide_duration_positive", sql`${table.slideDurationKegiatanSeconds} > 0`),
    check("latitude_range", sql`${table.latitude} IS NULL OR ${table.latitude} BETWEEN -90 AND 90`),
    check("longitude_range", sql`${table.longitude} IS NULL OR ${table.longitude} BETWEEN -180 AND 180`),
  ],
);
