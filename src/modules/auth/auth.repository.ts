import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, masjids, masjidSettings } from "@/db/schema";
import {
  DEFAULT_BLACKOUT_DURATION_MINUTES,
  DEFAULT_CITY_ID,
  DEFAULT_CITY_NAME,
  DEFAULT_IQOMAH,
  DEFAULT_SLIDE_DURATION_KEGIATAN_SECONDS,
} from "@/config/constants";

export interface UserWithMasjid {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  masjidId: string;
  masjidName: string;
  cityId: string | null;
  cityName: string | null;
}

export async function findByEmail(email: string) {
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function findWithMasjidByEmail(email: string): Promise<UserWithMasjid | null> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      passwordHash: users.passwordHash,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      masjidId: masjids.id,
      masjidName: masjids.name,
      cityId: masjidSettings.cityId,
      cityName: masjidSettings.cityName,
    })
    .from(users)
    .innerJoin(masjids, eq(masjids.userId, users.id))
    .leftJoin(masjidSettings, eq(masjidSettings.masjidId, masjids.id))
    .where(eq(users.email, email))
    .limit(1);
  return rows[0] ?? null;
}

export async function findUsersByUsername(username: string, limit: number) {
  return db
    .select({ email: users.email, isActive: users.isActive, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.username, username))
    .limit(limit);
}

export async function createUserWithMasjid(
  username: string,
  email: string,
  passwordHash: string,
  masjidName: string,
) {
  return db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values({ username, email, passwordHash }).returning();
    const [masjid] = await tx
      .insert(masjids)
      .values({ userId: user!.id, name: masjidName })
      .returning();
    await tx.insert(masjidSettings).values({
      masjidId: masjid!.id,
      cityId: DEFAULT_CITY_ID,
      cityName: DEFAULT_CITY_NAME,
      iqomahSubuh: DEFAULT_IQOMAH.subuh,
      iqomahDzuhur: DEFAULT_IQOMAH.dzuhur,
      iqomahAshar: DEFAULT_IQOMAH.ashar,
      iqomahMaghrib: DEFAULT_IQOMAH.maghrib,
      iqomahIsya: DEFAULT_IQOMAH.isya,
      blackoutDurationMinutes: DEFAULT_BLACKOUT_DURATION_MINUTES,
      slideDurationKegiatanSeconds: DEFAULT_SLIDE_DURATION_KEGIATAN_SECONDS,
    });
    return { user: user!, masjid: masjid! };
  });
}

export async function deleteUserByEmail(email: string): Promise<boolean> {
  const result = await db.delete(users).where(eq(users.email, email)).returning({ id: users.id });
  return result.length > 0;
}

export async function updateUserStatus(email: string, isActive: boolean): Promise<boolean> {
  const result = await db
    .update(users)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(users.email, email))
    .returning({ id: users.id });
  return result.length > 0;
}
