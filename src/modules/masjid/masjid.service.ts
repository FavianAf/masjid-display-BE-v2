import { db } from "@/db";
import { MEDIA_LIMITS } from "@/config/constants";
import { BadGatewayError, BadRequestError, NotFoundError } from "@/shared/errors/app-error";
import { isFutureDate, normalizeDate } from "@/shared/utils/date";
import { deleteFile, uploadFile } from "@/shared/storage/supabase-storage";
import * as repo from "./masjid.repository";
import type {
  FinancialReportItemInput,
  MediaItemInput,
  UpdateSettingsInput,
  UpdateSettingsMultipartInput,
} from "./masjid.schema";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function validateMediaCounts(medias: MediaItemInput[]) {
  const counts = { url: 0, youtube: 0, file: 0 };
  for (const m of medias) counts[m.media_type] += 1;
  if (counts.url > MEDIA_LIMITS.url) throw new BadRequestError(`Maximum ${MEDIA_LIMITS.url} URL media allowed`);
  if (counts.youtube > MEDIA_LIMITS.youtube) {
    throw new BadRequestError(`Maximum ${MEDIA_LIMITS.youtube} YouTube media allowed`);
  }
  if (counts.file > MEDIA_LIMITS.file) {
    throw new BadRequestError(`Maximum ${MEDIA_LIMITS.file} file uploads allowed`);
  }
}

function validateFinancialReports(reports: FinancialReportItemInput[]) {
  for (const r of reports) {
    if (!ISO_DATE.test(r.date)) throw new BadRequestError("Date must be in YYYY-MM-DD format");
    if (isFutureDate(r.date)) throw new BadRequestError("Date cannot be in the future");
  }
}

function toSettingsResponse(row: repo.SettingsAggregate) {
  return {
    masjid_id: row.masjidId,
    city_id: row.cityId,
    city_name: row.cityName,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    medias: row.medias.map((m) => ({
      id: m.id,
      masjid_id: m.masjidId,
      media_type: m.mediaType,
      media_value: m.mediaValue,
      media_name: m.mediaName,
      is_active: m.isActive,
      start_time: m.startTime,
      end_time: m.endTime,
    })),
    hadists: row.hadists.map((h) => ({
      id: h.id,
      text: h.text,
      source: h.source,
      is_active: h.isActive,
      created_at: h.createdAt.toISOString(),
      updated_at: h.updatedAt.toISOString(),
    })),
    running_texts: row.runningTexts.map((rt) => ({
      id: rt.id,
      text: rt.text,
      is_active: rt.isActive,
      created_at: rt.createdAt.toISOString(),
      updated_at: rt.updatedAt.toISOString(),
    })),
    financial_reports: row.financialReports.map((fr) => ({
      id: fr.id,
      date: normalizeDate(fr.date),
      income: fr.income,
      expense: fr.expense,
      note: fr.note,
      is_active: fr.isActive,
      created_at: fr.createdAt.toISOString(),
      updated_at: fr.updatedAt.toISOString(),
    })),
    financial_summary: {
      account_balance: row.financialSummary.accountBalance,
      monthly_expense: row.financialSummary.monthlyExpense,
      last_updated: new Date(row.financialSummary.lastUpdated).toISOString(),
    },
    iqomah_subuh: row.iqomahSubuh,
    iqomah_dzuhur: row.iqomahDzuhur,
    iqomah_ashar: row.iqomahAshar,
    iqomah_maghrib: row.iqomahMaghrib,
    iqomah_isya: row.iqomahIsya,
    blackout_duration_minutes: row.blackoutDurationMinutes,
    slide_duration_kegiatan_seconds: row.slideDurationKegiatanSeconds,
  };
}

export async function getSettings(userId: string) {
  const settings = await repo.getSettingsByUserId(userId);
  if (!settings) throw new NotFoundError("settings not found");
  return toSettingsResponse(settings);
}

export async function updateSettings(userId: string, input: UpdateSettingsInput) {
  if (input.medias) validateMediaCounts(input.medias);
  if (input.financial_reports) validateFinancialReports(input.financial_reports);

  const masjidId = await repo.getMasjidIdByUserId(userId);
  if (!masjidId) throw new NotFoundError("masjid not found");

  let removedFileMediaUrls: string[] = [];

  await db.transaction(async (tx) => {
    await repo.updateScalarSettings(tx, masjidId, input);
    if (input.medias !== undefined) {
      removedFileMediaUrls = await repo.syncMedias(tx, masjidId, input.medias);
    }
    if (input.hadists !== undefined) await repo.syncHadists(tx, masjidId, input.hadists);
    if (input.running_texts !== undefined) await repo.syncRunningTexts(tx, masjidId, input.running_texts);
    if (input.financial_reports !== undefined) {
      await repo.syncFinancialReports(tx, masjidId, input.financial_reports);
    }
    if (input.financial_summary !== undefined && input.financial_summary !== null) {
      await repo.upsertFinancialSummary(tx, masjidId, input.financial_summary);
    }
  });

  await Promise.allSettled(
    removedFileMediaUrls.map((url) =>
      deleteFile(url).catch((err) => console.error("failed to delete orphaned media file", url, err)),
    ),
  );

  const settings = await repo.getSettingsByMasjidId(masjidId);
  return toSettingsResponse(settings!);
}

export async function updateSettingsMultipart(userId: string, form: FormData, scalars: UpdateSettingsMultipartInput) {
  const masjidId = await repo.getMasjidIdByUserId(userId);
  if (!masjidId) throw new NotFoundError("masjid not found");

  const mediaType = form.get("masjid_media_type");
  const file = form.get("masjid_media_file");

  await db.transaction(async (tx) => {
    await repo.updateScalarSettings(tx, masjidId, scalars);

    if (mediaType === "file" && file instanceof File) {
      const bytes = new Uint8Array(await file.arrayBuffer());

      let uploadResult;
      try {
        uploadResult = await uploadFile(bytes, file.name, file.type, masjidId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.startsWith("file size exceeds") || msg.startsWith("invalid file type")) {
          throw new BadRequestError(msg);
        }
        throw new BadGatewayError("failed to upload file to storage");
      }

      const existingFileMedias = await repo.deleteFileMediaRows(tx, masjidId);
      await repo.insertFileMedia(tx, masjidId, uploadResult.url);

      await Promise.allSettled(existingFileMedias.map((url) => deleteFile(url).catch(() => undefined)));
    }
  });

  const settings = await repo.getSettingsByMasjidId(masjidId);
  return toSettingsResponse(settings!);
}
