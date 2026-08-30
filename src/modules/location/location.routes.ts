import { Elysia } from "elysia";
import { success } from "@/shared/types/response";
import { BadRequestError, BadGatewayError } from "@/shared/errors/app-error";
import { stringParam } from "@/shared/utils/http";
import { searchCity } from "@/shared/providers/myquran";
import { rateLimitPlugin } from "@/app/plugins/rate-limit";

export const locationRoutes = new Elysia({ prefix: "/api/location" }).use(rateLimitPlugin).get("/search", async ({ query }) => {
  const keyword = stringParam(query, "keyword");
  if (!keyword) throw new BadRequestError("keyword is required");

  try {
    const result = await searchCity(keyword);
    return success(result);
  } catch {
    throw new BadGatewayError("failed to search location");
  }
});
