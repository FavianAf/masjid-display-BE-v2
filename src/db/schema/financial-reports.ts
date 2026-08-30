import { bigint, boolean, check, date, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { masjids } from "./masjids";

export const financialReports = pgTable(
  "financial_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    masjidId: uuid("masjid_id")
      .notNull()
      .references(() => masjids.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    income: bigint("income", { mode: "number" }).notNull().default(0),
    expense: bigint("expense", { mode: "number" }).notNull().default(0),
    note: text("note").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_financial_reports_unique_date").on(table.masjidId, table.date),
    index("idx_financial_reports_masjid_id").on(table.masjidId),
    index("idx_financial_reports_date").on(table.date),
    index("idx_financial_reports_is_active").on(table.isActive),
    check("financial_reports_date_check", sql`${table.date} <= CURRENT_DATE`),
  ],
);
