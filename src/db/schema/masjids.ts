import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const masjids = pgTable(
  "masjid",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_masjid_user_id").on(table.userId)],
);
