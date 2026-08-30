import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { buildDatabaseUrl } from "@/config/env";
import * as schema from "./schema";

const connectionString = buildDatabaseUrl();

export const client = postgres(connectionString, {
  max: 25,
  idle_timeout: 300, // seconds — fixes v1's ConnMaxLifetime nanosecond bug (300 real seconds, not 300ns)
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;

/** The `tx` argument type passed into a `db.transaction(async (tx) => ...)` callback. */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function pingDatabase(timeoutMs = 5000): Promise<boolean> {
  try {
    await Promise.race([
      client`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs)),
    ]);
    return true;
  } catch {
    return false;
  }
}
