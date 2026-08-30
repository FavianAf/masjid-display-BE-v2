export const DEFAULT_CITY_ID = "577ef1154f3240ad5b9b413aa7346a1e";
export const DEFAULT_CITY_NAME = "Yogyakarta";

export const DEFAULT_IQOMAH = {
  subuh: 20,
  dzuhur: 10,
  ashar: 10,
  maghrib: 5,
  isya: 10,
} as const;

export const DEFAULT_BLACKOUT_DURATION_MINUTES = 30;
export const DEFAULT_SLIDE_DURATION_KEGIATAN_SECONDS = 10;

export const MEDIA_LIMITS = {
  url: 10,
  youtube: 10,
  file: 4,
} as const;

export const HADIST_LIMITS = {
  maxItems: 20,
  textMaxLength: 1000,
  sourceMaxLength: 255,
} as const;

export const RUNNING_TEXT_LIMITS = {
  maxItems: 5,
  textMaxLength: 255,
} as const;

export const FINANCIAL_REPORT_LIMITS = {
  maxItems: 30,
  noteMaxLength: 500,
} as const;

export const ALLOWED_MEDIA_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const BCRYPT_COST = 10;

export const RATE_LIMIT = {
  windowMs: 60_000,
  maxRequests: 100,
} as const;
