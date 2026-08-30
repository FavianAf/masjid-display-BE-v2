import { bigint, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { masjids } from "./masjids";

export const financialSummary = pgTable("financial_summary", {
  masjidId: uuid("masjid_id")
    .primaryKey()
    .references(() => masjids.id, { onDelete: "cascade" }),
  accountBalance: bigint("account_balance", { mode: "number" }).notNull().default(0),
  monthlyExpense: bigint("monthly_expense", { mode: "number" }).notNull().default(0),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
});
