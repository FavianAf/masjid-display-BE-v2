import { and, desc, eq } from "drizzle-orm";
import { db, type Tx } from "@/db";
import {
  financialReports,
  financialSummary,
  hadistQuotes,
  masjidMedia,
  masjidSettings,
  masjids,
  runningTexts,
} from "@/db/schema";
import { normalizeTime } from "@/shared/utils/date";
import { BadRequestError } from "@/shared/errors/app-error";
import { syncById } from "@/shared/db/sync-by-id";
import type {
  FinancialReportItemInput,
  FinancialSummaryInput,
  HadistItemInput,
  MediaItemInput,
  RunningTextItemInput,
  UpdateSettingsInput,
  UpdateSettingsMultipartInput,
} from "./masjid.schema";

export async function getMasjidIdByUserId(userId: string): Promise<string | null> {
  const rows = await db.select({ id: masjids.id }).from(masjids).where(eq(masjids.userId, userId)).limit(1);
  return rows[0]?.id ?? null;
}

export async function getSettingsByMasjidId(masjidId: string) {
  const [settingsRow] = await db
    .select()
    .from(masjidSettings)
    .where(eq(masjidSettings.masjidId, masjidId))
    .limit(1);
  if (!settingsRow) return null;

  const [medias, hadists, runningTextRows, financialReportRows, summaryRows] = await Promise.all([
    db.select().from(masjidMedia).where(eq(masjidMedia.masjidId, masjidId)).orderBy(masjidMedia.createdAt),
    db.select().from(hadistQuotes).where(eq(hadistQuotes.masjidId, masjidId)).orderBy(desc(hadistQuotes.createdAt)),
    db.select().from(runningTexts).where(eq(runningTexts.masjidId, masjidId)).orderBy(desc(runningTexts.createdAt)),
    db
      .select()
      .from(financialReports)
      .where(eq(financialReports.masjidId, masjidId))
      .orderBy(desc(financialReports.date)),
    db.select().from(financialSummary).where(eq(financialSummary.masjidId, masjidId)).limit(1),
  ]);

  return {
    ...settingsRow,
    medias,
    hadists,
    runningTexts: runningTextRows,
    financialReports: financialReportRows,
    financialSummary:
      summaryRows[0] ??
      ({ masjidId, accountBalance: 0, monthlyExpense: 0, lastUpdated: new Date() } as const),
  };
}

/** The full settings aggregate returned by getSettingsByMasjidId/getSettingsByUserId. */
export type SettingsAggregate = NonNullable<Awaited<ReturnType<typeof getSettingsByMasjidId>>>;

export async function getSettingsByUserId(userId: string) {
  const masjidId = await getMasjidIdByUserId(userId);
  if (!masjidId) return null;
  return getSettingsByMasjidId(masjidId);
}

type ScalarSettingsInput = UpdateSettingsInput | UpdateSettingsMultipartInput;

export async function updateScalarSettings(tx: Tx, masjidId: string, input: ScalarSettingsInput) {
  const updateData: Partial<typeof masjidSettings.$inferInsert> = { updatedAt: new Date() };
  if ("city_id" in input && input.city_id !== undefined) updateData.cityId = input.city_id;
  if (input.city_name !== undefined) updateData.cityName = input.city_name;
  if (input.iqomah_subuh !== undefined) updateData.iqomahSubuh = input.iqomah_subuh;
  if (input.iqomah_dzuhur !== undefined) updateData.iqomahDzuhur = input.iqomah_dzuhur;
  if (input.iqomah_ashar !== undefined) updateData.iqomahAshar = input.iqomah_ashar;
  if (input.iqomah_maghrib !== undefined) updateData.iqomahMaghrib = input.iqomah_maghrib;
  if (input.iqomah_isya !== undefined) updateData.iqomahIsya = input.iqomah_isya;
  if (input.blackout_duration_minutes !== undefined) {
    updateData.blackoutDurationMinutes = input.blackout_duration_minutes;
  }
  if (input.slide_duration_kegiatan_seconds !== undefined) {
    updateData.slideDurationKegiatanSeconds = input.slide_duration_kegiatan_seconds;
  }

  await tx.update(masjidSettings).set(updateData).where(eq(masjidSettings.masjidId, masjidId));
}

/**
 * Replaces a masjid's media set via id-diff (see shared/db/sync-by-id.ts).
 * Returns the file-type media rows that were removed by the diff, so the
 * service layer can clean up their Supabase Storage objects without a
 * separate before/after query.
 */
export async function syncMedias(tx: Tx, masjidId: string, items: MediaItemInput[]) {
  const deleted = await syncById<MediaItemInput, { mediaValue: string; mediaType: string }>(
    tx,
    masjidMedia,
    masjidId,
    items,
    (item) => {
      let startTime: string | null;
      let endTime: string | null;
      try {
        startTime = normalizeTime(item.start_time ?? null);
        endTime = normalizeTime(item.end_time ?? null);
      } catch {
        throw new BadRequestError(`invalid start_time or end_time format for media "${item.media_name}"`);
      }
      return {
        mediaType: item.media_type,
        mediaValue: item.media_value,
        mediaName: item.media_name,
        isActive: item.is_active,
        startTime,
        endTime,
        updatedAt: new Date(),
      };
    },
    { mediaValue: masjidMedia.mediaValue, mediaType: masjidMedia.mediaType },
  );
  return deleted.filter((row) => row.mediaType === "file").map((row) => row.mediaValue as string);
}

export async function syncHadists(tx: Tx, masjidId: string, items: HadistItemInput[]) {
  await syncById(tx, hadistQuotes, masjidId, items, (item) => ({
    text: item.text,
    source: item.source,
    isActive: item.is_active,
    updatedAt: new Date(),
  }));
}

export async function syncRunningTexts(tx: Tx, masjidId: string, items: RunningTextItemInput[]) {
  await syncById(tx, runningTexts, masjidId, items, (item) => ({
    text: item.text,
    isActive: item.is_active,
    updatedAt: new Date(),
  }));
}

export async function syncFinancialReports(tx: Tx, masjidId: string, items: FinancialReportItemInput[]) {
  await syncById(tx, financialReports, masjidId, items, (item) => ({
    date: item.date,
    income: item.income,
    expense: item.expense,
    note: item.note,
    isActive: item.is_active,
    updatedAt: new Date(),
  }));
}

export async function upsertFinancialSummary(tx: Tx, masjidId: string, input: FinancialSummaryInput) {
  await tx
    .insert(financialSummary)
    .values({
      masjidId,
      accountBalance: input.account_balance,
      monthlyExpense: input.monthly_expense,
      lastUpdated: new Date(),
    })
    .onConflictDoUpdate({
      target: financialSummary.masjidId,
      set: {
        accountBalance: input.account_balance,
        monthlyExpense: input.monthly_expense,
        lastUpdated: new Date(),
      },
    });
}

/** Deletes a masjid's file-type media rows, returning their storage URLs for cleanup. */
export async function deleteFileMediaRows(tx: Tx, masjidId: string): Promise<string[]> {
  const rows = await tx
    .delete(masjidMedia)
    .where(and(eq(masjidMedia.masjidId, masjidId), eq(masjidMedia.mediaType, "file")))
    .returning({ mediaValue: masjidMedia.mediaValue });
  return rows.map((r) => r.mediaValue);
}

export async function insertFileMedia(tx: Tx, masjidId: string, url: string) {
  await tx.insert(masjidMedia).values({
    masjidId,
    mediaType: "file",
    mediaValue: url,
    mediaName: "Background Image",
    isActive: true,
  });
}
