import { boolean, index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { masjids } from "./masjids";

export const hadistQuotes = pgTable(
  "hadist_quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    masjidId: uuid("masjid_id")
      .notNull()
      .references(() => masjids.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    source: varchar("source", { length: 255 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_hadist_quotes_masjid_id").on(table.masjidId),
    index("idx_hadist_quotes_is_active").on(table.isActive),
  ],
);
