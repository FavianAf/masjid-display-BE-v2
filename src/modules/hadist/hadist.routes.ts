import { Elysia } from "elysia";
import { success } from "@/shared/types/response";
import { requireUuidQueryParam } from "@/shared/utils/http";
import { rateLimitPlugin } from "@/app/plugins/rate-limit";
import * as hadistService from "./hadist.service";

export const hadistRoutes = new Elysia({ prefix: "/api/hadist" }).use(rateLimitPlugin).get("/active", async ({ query }) => {
  const masjidId = requireUuidQueryParam(query, "masjid_id");
  const result = await hadistService.getActive(masjidId);
  return success(result);
});
