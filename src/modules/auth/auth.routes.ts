import { Elysia } from "elysia";
import { success, created } from "@/shared/types/response";
import { BadRequestError } from "@/shared/errors/app-error";
import { coerceNumber, parseOrThrow, stringParam } from "@/shared/utils/http";
import { adminGuardPlugin } from "@/app/plugins/auth";
import { rateLimitPlugin } from "@/app/plugins/rate-limit";
import * as authService from "./auth.service";
import {
  registerSchema,
  loginSchema,
  deleteAccountSchema,
  updateStatusSchema,
} from "./auth.schema";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .use(rateLimitPlugin)
  .post("/register", async ({ body, set }) => {
    const input = parseOrThrow(registerSchema, body);
    const result = await authService.register(input);
    set.status = 201;
    return created(result);
  })
  .post("/login", async ({ body }) => {
    const input = parseOrThrow(loginSchema, body);
    const result = await authService.login(input);
    return success(result);
  });

export const authAdminRoutes = new Elysia({ prefix: "/api/auth" })
  .use(rateLimitPlugin)
  .use(adminGuardPlugin)
  .get("/account", async ({ query }) => {
    const email = stringParam(query, "email");
    const username = stringParam(query, "username");
    const rawLimit = coerceNumber(query.limit);
    const limit = rawLimit && rawLimit > 0 ? rawLimit : 10;

    if (!email && !username) {
      throw new BadRequestError("either email or username query parameter must be provided");
    }
    if (email) {
      const account = await authService.getAccountByEmail(email);
      return success(account);
    }
    const accounts = await authService.getAccountsByUsername(username!, limit);
    return success(accounts);
  })
  .delete("/account", async ({ body }) => {
    const input = parseOrThrow(deleteAccountSchema, body);
    await authService.deleteAccount(input.email);
    return success({ message: "Account deleted successfully" });
  })
  .patch("/status", async ({ body }) => {
    const input = parseOrThrow(updateStatusSchema, body);
    await authService.updateAccountStatus(input.email, input.is_active);
    return success({ message: `Account successfully ${input.is_active ? "active" : "inactive"}` });
  });
