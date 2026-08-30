import { boolean, check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { masjids } from "./masjids";

export const runningTexts = pgTable(
  "running_texts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    masjidId: uuid("masjid_id")
      .notNull()
      .references(() => masjids.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_running_texts_masjid_id").on(table.masjidId),
    index("idx_running_texts_is_active").on(table.isActive),
    check("running_text_length", sql`char_length(${table.text}) <= 255`),
  ],
);
