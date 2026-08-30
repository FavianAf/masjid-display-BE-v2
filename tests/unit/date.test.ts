import { describe, expect, it } from "bun:test";
import { addMinutes, isFutureDate, normalizeDate, normalizeTime } from "@/shared/utils/date";

describe("normalizeTime", () => {
  it("returns null for null/undefined/empty", () => {
    expect(normalizeTime(null)).toBeNull();
    expect(normalizeTime(undefined)).toBeNull();
    expect(normalizeTime("")).toBeNull();
  });

  it("accepts HH:mm:ss unchanged", () => {
    expect(normalizeTime("06:00:00")).toBe("06:00:00");
  });

  it("appends :00 to HH:mm", () => {
    expect(normalizeTime("06:00")).toBe("06:00:00");
  });

  it("extracts time-of-day from an ISO timestamp with Z", () => {
    expect(normalizeTime("0000-01-01T00:00:00Z")).toBe("00:00:00");
  });

  it("throws on an invalid format", () => {
    expect(() => normalizeTime("99:99:99")).toThrow();
    expect(() => normalizeTime("not-a-time")).toThrow();
  });
});

describe("normalizeDate", () => {
  it("returns plain YYYY-MM-DD unchanged", () => {
    expect(normalizeDate("2026-03-14")).toBe("2026-03-14");
  });

  it("normalizes an RFC3339 Z timestamp to YYYY-MM-DD", () => {
    expect(normalizeDate("2026-03-14T00:00:00Z")).toBe("2026-03-14");
  });

  it("returns empty string unchanged", () => {
    expect(normalizeDate("")).toBe("");
  });
});

describe("addMinutes (iqomah calculation)", () => {
  it("adds minutes to a HH:mm time", () => {
    expect(addMinutes("04:39", 15)).toBe("04:54");
    expect(addMinutes("11:57", 10)).toBe("12:07");
  });

  it("wraps past midnight", () => {
    expect(addMinutes("23:55", 10)).toBe("00:05");
  });

  it("returns the original string on parse failure", () => {
    expect(addMinutes("not-a-time", 10)).toBe("not-a-time");
  });
});

describe("isFutureDate", () => {
  it("flags a date far in the future", () => {
    expect(isFutureDate("2099-01-01")).toBe(true);
  });

  it("does not flag a date far in the past", () => {
    expect(isFutureDate("2000-01-01")).toBe(false);
  });
});
