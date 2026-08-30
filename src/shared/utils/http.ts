import type { z, ZodType } from "zod";
import { BadRequestError } from "@/shared/errors/app-error";

export function parseOrThrow<T extends ZodType>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new BadRequestError(result.error.errors[0]?.message ?? "invalid request body");
  }
  return result.data;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Extracts and UUID-validates a required query param, throwing the same messages v1 used. */
export function requireUuidQueryParam(query: Record<string, unknown>, key: string): string {
  const value = stringParam(query, key);
  if (!value) throw new BadRequestError(`${key} query parameter is required`);
  if (!isValidUuid(value)) throw new BadRequestError(`invalid ${key} format`);
  return value;
}

export function stringParam(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

/** Coerces a query/form value (string, null, or undefined) to a number, or undefined if absent/invalid. */
export function coerceNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}
