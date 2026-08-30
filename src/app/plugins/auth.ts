import { Elysia } from "elysia";
import { verifyToken } from "@/shared/utils/jwt";
import { UnauthorizedError } from "@/shared/errors/app-error";
import { env } from "@/config/env";

/**
 * JWT bearer-auth guard. Mirrors v1's JWTMiddleware: requires
 * `Authorization: Bearer <token>`, verifies HS256 signature + expiry, and
 * derives `userId`/`username` into context. Unlike v1 (which returned plain
 * text 401s), failures go through the standard JSON envelope via UnauthorizedError.
 */
export const jwtAuthPlugin = new Elysia({ name: "jwt-auth" }).derive(
  { as: "scoped" },
  async ({ headers }) => {
    const authHeader = headers.authorization;
    if (!authHeader) throw new UnauthorizedError("missing authorization header");

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0]?.toLowerCase() !== "bearer") {
      throw new UnauthorizedError("invalid authorization header format");
    }

    try {
      const claims = await verifyToken(parts[1]!);
      return { userId: claims.user_id, username: claims.username };
    } catch {
      throw new UnauthorizedError("invalid or expired token");
    }
  },
);

/**
 * Admin guard using the `punyakuId` shared-secret header, mirroring v1's
 * PunyakuIdMiddleware (static string equality, no signing/expiry).
 */
export const adminGuardPlugin = new Elysia({ name: "admin-guard" }).derive(
  { as: "scoped" },
  ({ headers }) => {
    const provided = headers.punyakuid;
    if (!provided) throw new UnauthorizedError("punyakuId header is required");
    if (provided !== env.PUNYAKU_ID_SECRET) throw new UnauthorizedError("invalid punyakuId");
    return {};
  },
);
