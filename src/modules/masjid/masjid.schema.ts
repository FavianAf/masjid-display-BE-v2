import { z } from "zod";
import { FINANCIAL_REPORT_LIMITS, HADIST_LIMITS, RUNNING_TEXT_LIMITS } from "@/config/constants";

// Every settings sub-resource is reconciled by id via shared/db/sync-by-id.ts,
// so each item schema shares this id/is_active contract.
const syncableItemBase = z.object({
  id: z.string().uuid().optional(),
  is_active: z.boolean().optional().default(true),
});

export const mediaItemSchema = syncableItemBase.extend({
  media_type: z.enum(["url", "youtube", "file"], {
    errorMap: () => ({ message: "invalid media_type, must be 'url', 'youtube', or 'file'" }),
  }),
  media_value: z.string().min(1, "media_value is required"),
  media_name: z.string().min(1, "media_name is required"),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
});
export type MediaItemInput = z.infer<typeof mediaItemSchema>;

export const hadistItemSchema = syncableItemBase.extend({
  text: z.string().min(1, "text is required").max(HADIST_LIMITS.textMaxLength, "text must be max 1000 characters"),
  source: z
    .string()
    .min(1, "source is required")
    .max(HADIST_LIMITS.sourceMaxLength, "source must be max 255 characters"),
});
export type HadistItemInput = z.infer<typeof hadistItemSchema>;

export const runningTextItemSchema = syncableItemBase.extend({
  text: z
    .string()
    .min(1, "text is required")
    .max(RUNNING_TEXT_LIMITS.textMaxLength, "text must be max 255 characters"),
});
export type RunningTextItemInput = z.infer<typeof runningTextItemSchema>;

export const financialReportItemSchema = syncableItemBase.extend({
  date: z.string().min(1, "date is required"),
  income: z.number().min(0, "income must be greater than or equal to 0"),
  expense: z.number().min(0, "expense must be greater than or equal to 0"),
  note: z.string().min(1, "note is required").max(FINANCIAL_REPORT_LIMITS.noteMaxLength, "note must be max 500 characters"),
});
export type FinancialReportItemInput = z.infer<typeof financialReportItemSchema>;

export const financialSummarySchema = z.object({
  account_balance: z.number().min(0),
  monthly_expense: z.number().min(0),
});
export type FinancialSummaryInput = z.infer<typeof financialSummarySchema>;

const iqomahField = z.number().int().min(1).max(60).optional();

export const updateSettingsSchema = z.object({
  city_id: z.string().nullable().optional(),
  city_name: z.string().nullable().optional(),
  medias: z.array(mediaItemSchema).optional(),
  hadists: z.array(hadistItemSchema).max(HADIST_LIMITS.maxItems, "Maximum 20 hadists allowed").optional(),
  running_texts: z
    .array(runningTextItemSchema)
    .max(RUNNING_TEXT_LIMITS.maxItems, "Maximum 5 running texts allowed")
    .optional(),
  financial_reports: z
    .array(financialReportItemSchema)
    .max(FINANCIAL_REPORT_LIMITS.maxItems, "Maximum 30 financial reports allowed")
    .optional(),
  financial_summary: financialSummarySchema.nullable().optional(),
  iqomah_subuh: iqomahField,
  iqomah_dzuhur: iqomahField,
  iqomah_ashar: iqomahField,
  iqomah_maghrib: iqomahField,
  iqomah_isya: iqomahField,
  blackout_duration_minutes: z.number().int().min(1).max(120).optional(),
  slide_duration_kegiatan_seconds: z.number().int().min(1).max(300).optional(),
});
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

export const updateSettingsMultipartSchema = z.object({
  city_name: z.string().optional(),
  iqomah_subuh: iqomahField,
  iqomah_dzuhur: iqomahField,
  iqomah_ashar: iqomahField,
  iqomah_maghrib: iqomahField,
  iqomah_isya: iqomahField,
  blackout_duration_minutes: z.number().int().min(1).max(120).optional(),
  slide_duration_kegiatan_seconds: z.number().int().min(1).max(300).optional(),
});
export type UpdateSettingsMultipartInput = z.infer<typeof updateSettingsMultipartSchema>;
