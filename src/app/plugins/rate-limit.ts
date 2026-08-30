import { Elysia } from "elysia";
import { env } from "@/config/env";
import { RATE_LIMIT } from "@/config/constants";
import { TooManyRequestsError } from "@/shared/errors/app-error";

interface Visitor {
  count: number;
  windowStart: number;
}

const visitors = new Map<string, Visitor>();

setInterval(() => {
  const now = Date.now();
  for (const [key, visitor] of visitors) {
    if (now - visitor.windowStart > RATE_LIMIT.windowMs * 2) visitors.delete(key);
  }
}, 60_000).unref();

function clientKey(request: Request, remoteAddress: string | undefined): string {
  if (env.TRUST_PROXY) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  }
  return remoteAddress ?? "unknown";
}

/**
 * Fixed-window per-client rate limiter (100 req/min by default), mirroring
 * v1's algorithm. Unlike v1, the client key optionally respects
 * X-Forwarded-For behind a trusted proxy (TRUST_PROXY=true) instead of always
 * using the raw socket address, and 429s go through the same AppError /
 * error-handler mechanism as every other error response instead of building
 * the envelope by hand here.
 */
export const rateLimitPlugin = new Elysia({ name: "rate-limit" }).onBeforeHandle({ as: "scoped" }, ({ request, server }) => {
  const remoteAddress = server?.requestIP(request)?.address;
  const key = clientKey(request, remoteAddress);
  const now = Date.now();

  const visitor = visitors.get(key);
  if (!visitor || now - visitor.windowStart > RATE_LIMIT.windowMs) {
    visitors.set(key, { count: 1, windowStart: now });
    return;
  }

  visitor.count += 1;
  if (visitor.count > RATE_LIMIT.maxRequests) {
    throw new TooManyRequestsError();
  }
});
