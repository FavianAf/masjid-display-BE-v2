import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { buildApp } from "@/app/app";
import { env } from "@/config/env";
import { request as requestApp } from "../helpers";

const app = buildApp();
const runId = Date.now();
const email = `test-settings-${runId}@example.com`;
let token: string;

const request = (method: string, path: string, body?: unknown, headers?: Record<string, string>) =>
  requestApp(app, method, path, body, headers);

function auth() {
  return { Authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  const { json } = await request("POST", "/api/auth/register", {
    username: "settingsuser",
    email,
    password: "password123",
    masjid_name: "Settings Test Masjid",
  });
  const data = json.responseData as { token: string };
  token = data.token;
});

afterAll(async () => {
  await request("DELETE", "/api/auth/account", { email }, { punyakuid: env.PUNYAKU_ID_SECRET });
});

describe("settings defaults", () => {
  it("seeds Yogyakarta + iqomah defaults on registration", async () => {
    const { status, json } = await request("GET", "/api/masjid/settings", undefined, auth());
    expect(status).toBe(200);
    const data = json.responseData as Record<string, unknown>;
    expect(data.city_name).toBe("Yogyakarta");
    expect(data.iqomah_subuh).toBe(20);
    expect(data.blackout_duration_minutes).toBe(30);
    expect(data.medias).toEqual([]);
  });
});

describe("settings validation limits", () => {
  it("rejects more than 10 url medias", async () => {
    const medias = Array.from({ length: 11 }, (_, i) => ({
      media_type: "url",
      media_value: `https://example.com/${i}.jpg`,
      media_name: `media-${i}`,
    }));
    const { status, json } = await request("POST", "/api/masjid/settings", { medias }, auth());
    expect(status).toBe(400);
    expect(json.responseMessage).toBe("Maximum 10 URL media allowed");
  });

  it("rejects more than 20 hadists", async () => {
    const hadists = Array.from({ length: 21 }, (_, i) => ({
      text: `hadist ${i}`,
      source: "HR. Test",
    }));
    const { status, json } = await request("POST", "/api/masjid/settings", { hadists }, auth());
    expect(status).toBe(400);
    expect(json.responseMessage).toBe("Maximum 20 hadists allowed");
  });

  it("rejects a future-dated financial report", async () => {
    const { status, json } = await request(
      "POST",
      "/api/masjid/settings",
      { financial_reports: [{ date: "2099-01-01", income: 1000, expense: 0, note: "future" }] },
      auth(),
    );
    expect(status).toBe(400);
    expect(json.responseMessage).toBe("Date cannot be in the future");
  });

  it("allows zero income/expense (fixes v1's struct-tag vs manual-validator inconsistency)", async () => {
    const { status } = await request(
      "POST",
      "/api/masjid/settings",
      { financial_reports: [{ date: "2026-01-01", income: 0, expense: 0, note: "zero report" }] },
      auth(),
    );
    expect(status).toBe(200);
  });

  it("rejects an out-of-range latitude", async () => {
    const { status, json } = await request("POST", "/api/masjid/settings", { latitude: 91 }, auth());
    expect(status).toBe(400);
    expect(json.responseMessage).toContain("latitude");
  });

  it("rejects an out-of-range longitude", async () => {
    const { status, json } = await request("POST", "/api/masjid/settings", { longitude: -181 }, auth());
    expect(status).toBe(400);
    expect(json.responseMessage).toContain("longitude");
  });
});

describe("address and coordinates", () => {
  it("saves and returns address/latitude/longitude, and allows clearing them back to null", async () => {
    const saved = await request(
      "POST",
      "/api/masjid/settings",
      { address: "Jl. Bantul Km 4,8", latitude: -7.835321, longitude: 110.3112353 },
      auth(),
    );
    expect(saved.status).toBe(200);
    const savedData = saved.json.responseData as Record<string, unknown>;
    expect(savedData.address).toBe("Jl. Bantul Km 4,8");
    expect(savedData.latitude).toBe(-7.835321);
    expect(savedData.longitude).toBe(110.3112353);

    const cleared = await request(
      "POST",
      "/api/masjid/settings",
      { address: null, latitude: null, longitude: null },
      auth(),
    );
    expect(cleared.status).toBe(200);
    const clearedData = cleared.json.responseData as Record<string, unknown>;
    expect(clearedData.address).toBeNull();
    expect(clearedData.latitude).toBeNull();
    expect(clearedData.longitude).toBeNull();
  });
});

describe("id-diff sync preserves created_at", () => {
  it("keeps the original created_at when re-sending the same hadist id, and resets it for a genuinely new id", async () => {
    const first = await request(
      "POST",
      "/api/masjid/settings",
      { hadists: [{ text: "Original text", source: "HR. Muslim" }] },
      auth(),
    );
    const firstHadist = (first.json.responseData as { hadists: Array<{ id: string; created_at: string }> })
      .hadists[0]!;

    await new Promise((resolve) => setTimeout(resolve, 20));

    const second = await request(
      "POST",
      "/api/masjid/settings",
      {
        hadists: [
          { id: firstHadist.id, text: "Edited text", source: "HR. Muslim" },
          { text: "Brand new hadist", source: "HR. Bukhari" },
        ],
      },
      auth(),
    );
    const hadists = (second.json.responseData as { hadists: Array<{ id: string; text: string; created_at: string }> })
      .hadists;

    const edited = hadists.find((h) => h.id === firstHadist.id)!;
    const created = hadists.find((h) => h.id !== firstHadist.id)!;

    expect(edited.text).toBe("Edited text");
    expect(edited.created_at).toBe(firstHadist.created_at);
    expect(created.created_at).not.toBe(firstHadist.created_at);
  });
});
