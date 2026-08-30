const HHMMSS = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Normalizes a time value into "HH:mm:ss", accepting the same input shapes v1
 * accepted (HH:mm:ss, HH:mm, ISO timestamps with/without offset or fractional
 * seconds). Unlike v1, this actually validates hour/minute/second ranges
 * instead of just checking string length/colon positions, and throws on an
 * unrecognized/invalid format instead of silently discarding it.
 */
export function normalizeTime(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;

  if (HHMMSS.test(value)) return value;
  if (HHMM.test(value)) return `${value}:00`;

  if (value.includes("T")) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mm = String(d.getUTCMinutes()).padStart(2, "0");
      const ss = String(d.getUTCSeconds()).padStart(2, "0");
      return `${hh}:${mm}:${ss}`;
    }
  }

  throw new Error(`invalid time format: ${value}`);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Normalizes a date value into "YYYY-MM-DD", accepting plain dates and ISO
 * timestamps (with or without fractional seconds / Z suffix), matching v1's
 * NormalizeDate accepted formats.
 */
export function normalizeDate(value: string): string {
  if (!value) return value;
  if (ISO_DATE.test(value)) return value;

  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return value;
}

/**
 * Adds `minutes` to a "HH:mm" time string, returning "HH:mm". Used for iqomah
 * calculation (adzan time + iqomah duration). Mirrors v1: on parse failure the
 * original string is returned unchanged.
 */
export function addMinutes(timeStr: string, minutes: number): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeStr);
  if (!match) return timeStr;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(mins)) return timeStr;

  const total = (hours * 60 + mins + minutes + 24 * 60) % (24 * 60);
  const outHours = Math.floor(total / 60);
  const outMins = total % 60;
  return `${String(outHours).padStart(2, "0")}:${String(outMins).padStart(2, "0")}`;
}

/** Current time in Asia/Jakarta (WIB, fixed UTC+7, no DST) as an ISO-8601 string with explicit offset. */
export function jakartaNowISOString(): string {
  const jakartaMs = Date.now() + 7 * 60 * 60 * 1000;
  const d = new Date(jakartaMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}+07:00`;
}

export function isFutureDate(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parsed = new Date(`${dateStr}T00:00:00`);
  return parsed.getTime() > today.getTime();
}
