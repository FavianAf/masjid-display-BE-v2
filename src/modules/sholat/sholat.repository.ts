import { eq } from "drizzle-orm";
import { db } from "@/db";
import { masjidSettings } from "@/db/schema";

export async function getSettingsByMasjidId(masjidId: string) {
  const rows = await db.select().from(masjidSettings).where(eq(masjidSettings.masjidId, masjidId)).limit(1);
  return rows[0] ?? null;
}
