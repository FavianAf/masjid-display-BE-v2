import { NotFoundError } from "@/shared/errors/app-error";
import { addMinutes, jakartaNowISOString } from "@/shared/utils/date";
import { fetchTodayJadwal } from "@/shared/providers/myquran";
import * as repo from "./sholat.repository";

interface PrayerTimes {
  imsak: string;
  subuh: string;
  terbit: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
}

export async function getTodayPublic(masjidId: string) {
  const settings = await repo.getSettingsByMasjidId(masjidId);
  if (!settings) throw new NotFoundError("masjid settings not found");
  if (!settings.cityId) throw new NotFoundError("city not configured for this masjid");

  const jadwal = await fetchTodayJadwal(settings.cityId);

  const jadwalTimes: PrayerTimes = {
    imsak: jadwal.imsak,
    subuh: jadwal.subuh,
    terbit: jadwal.terbit,
    dzuhur: jadwal.dzuhur,
    ashar: jadwal.ashar,
    maghrib: jadwal.maghrib,
    isya: jadwal.isya,
  };

  const iqomahTimes: PrayerTimes = {
    imsak: "",
    subuh: addMinutes(jadwal.subuh, settings.iqomahSubuh),
    terbit: "",
    dzuhur: addMinutes(jadwal.dzuhur, settings.iqomahDzuhur),
    ashar: addMinutes(jadwal.ashar, settings.iqomahAshar),
    maghrib: addMinutes(jadwal.maghrib, settings.iqomahMaghrib),
    isya: addMinutes(jadwal.isya, settings.iqomahIsya),
  };

  return {
    server_time: jakartaNowISOString(),
    date: jadwal.tanggal,
    location: settings.cityName ?? "",
    jadwal: jadwalTimes,
    iqomah: iqomahTimes,
    blackout_duration_minutes: settings.blackoutDurationMinutes,
  };
}
