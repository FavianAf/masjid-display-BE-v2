import { Elysia } from "elysia";
import { success } from "@/shared/types/response";
import { BadRequestError } from "@/shared/errors/app-error";
import { coerceNumber, parseOrThrow } from "@/shared/utils/http";
import { jwtAuthPlugin } from "@/app/plugins/auth";
import { rateLimitPlugin } from "@/app/plugins/rate-limit";
import * as masjidService from "./masjid.service";
import { updateSettingsMultipartSchema, updateSettingsSchema } from "./masjid.schema";

export const masjidRoutes = new Elysia({ prefix: "/api/masjid" })
  .use(rateLimitPlugin)
  .use(jwtAuthPlugin)
  .get("/settings", async ({ userId }) => {
    const result = await masjidService.getSettings(userId);
    return success(result);
  })
  .post("/settings", async ({ request, userId }) => {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      let form: FormData;
      try {
        form = await request.formData();
      } catch {
        throw new BadRequestError("failed to parse multipart form");
      }

      const scalars = parseOrThrow(updateSettingsMultipartSchema, {
        city_name: form.get("city_name") ?? undefined,
        iqomah_subuh: coerceNumber(form.get("iqomah_subuh")),
        iqomah_dzuhur: coerceNumber(form.get("iqomah_dzuhur")),
        iqomah_ashar: coerceNumber(form.get("iqomah_ashar")),
        iqomah_maghrib: coerceNumber(form.get("iqomah_maghrib")),
        iqomah_isya: coerceNumber(form.get("iqomah_isya")),
        blackout_duration_minutes: coerceNumber(form.get("blackout_duration_minutes")),
        slide_duration_kegiatan_seconds: coerceNumber(form.get("slide_duration_kegiatan_seconds")),
      });

      const result = await masjidService.updateSettingsMultipart(userId, form, scalars);
      return success(result);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new BadRequestError("invalid request body");
    }
    const input = parseOrThrow(updateSettingsSchema, body);
    const result = await masjidService.updateSettings(userId, input);
    return success(result);
  });
