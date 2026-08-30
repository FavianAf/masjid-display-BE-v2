import { Elysia } from "elysia";
import { success } from "@/shared/types/response";
import { requireUuidQueryParam } from "@/shared/utils/http";
import { rateLimitPlugin } from "@/app/plugins/rate-limit";
import * as sholatService from "./sholat.service";

export const sholatRoutes = new Elysia({ prefix: "/api/sholat" }).use(rateLimitPlugin).get("/today", async ({ query }) => {
  const masjidId = requireUuidQueryParam(query, "masjid_id");
  const result = await sholatService.getTodayPublic(masjidId);
  return success(result);
});
