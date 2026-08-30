import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { hadistQuotes } from "@/db/schema";

export async function getActiveByMasjidId(masjidId: string) {
  return db
    .select()
    .from(hadistQuotes)
    .where(and(eq(hadistQuotes.masjidId, masjidId), eq(hadistQuotes.isActive, true)))
    .orderBy(desc(hadistQuotes.createdAt));
}
