import { boolean, index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 150 }).notNull(),
    email: varchar("email", { length: 254 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_users_username").on(table.username),
    index("idx_users_email").on(table.email),
  ],
);
