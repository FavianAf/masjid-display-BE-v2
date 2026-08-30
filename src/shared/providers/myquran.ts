import { env } from "@/config/env";

const TIMEOUT_MS = 10_000;

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`MyQuran API returned status ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export interface Jadwal {
  tanggal: string;
  imsak: string;
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
}

interface MyQuranJadwalResponse {
  status: boolean;
  data: {
    id: string;
    kabko: string;
    prov: string;
    jadwal: Record<string, Jadwal>;
  };
}

/** GET {MYQURAN_BASE_URL}/sholat/jadwal/{cityId}/today?tz=Asia/Jakarta */
export async function fetchTodayJadwal(cityId: string): Promise<Jadwal> {
  const url = `${env.MYQURAN_BASE_URL}/sholat/jadwal/${encodeURIComponent(cityId)}/today?tz=Asia/Jakarta`;
  const result = await fetchJson<MyQuranJadwalResponse>(url);

  if (!result.status) throw new Error("failed to get jadwal from MyQuran - status false");

  const entries = Object.values(result.data.jadwal ?? {});
  const jadwal = entries[0];
  if (!jadwal) throw new Error("failed to get jadwal from MyQuran - empty jadwal");
  return jadwal;
}

export interface CitySearchResult {
  status: boolean;
  message?: string;
  data: Array<{ id: string; lokasi: string }>;
}

/** GET {MYQURAN_BASE_URL}/sholat/kota/cari/{keyword} — passed straight through as responseData. */
export async function searchCity(keyword: string): Promise<CitySearchResult> {
  const url = `${env.MYQURAN_BASE_URL}/sholat/kota/cari/${encodeURIComponent(keyword)}`;
  return fetchJson<CitySearchResult>(url);
}
