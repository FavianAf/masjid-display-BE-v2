import { and, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import type { Tx } from "@/db";

interface SyncableTable {
  id: AnyPgColumn;
  masjidId: AnyPgColumn;
}

interface SyncItem {
  id?: string;
}

/**
 * Reconciles a masjid-scoped child table against a client-supplied array by
 * id: rows whose id is still present get updated in place (keeping their
 * original created_at), rows missing from the array get deleted, and rows
 * with no id (or an id that doesn't match an existing row) get inserted
 * fresh. Used for every settings sub-resource (media/hadists/running texts/
 * financial reports) instead of v1's DELETE-ALL+INSERT-ALL, which reset
 * created_at on every save.
 *
 * `returningColumns`, if given, is applied to the delete statement so callers
 * can inspect what was actually removed (e.g. to clean up orphaned storage
 * objects) without a separate query.
 */
export async function syncById<TItem extends SyncItem, TReturning extends Record<string, unknown> = never>(
  tx: Tx,
  table: PgTable & SyncableTable,
  masjidId: string,
  items: TItem[],
  mapValues: (item: TItem) => Record<string, unknown>,
  returningColumns?: Record<string, AnyPgColumn>,
): Promise<TReturning[]> {
  const existing = await tx.select({ id: table.id }).from(table).where(eq(table.masjidId, masjidId));
  const existingIds = new Set(existing.map((r) => r.id as string));
  const keepIds = new Set<string>();

  for (const item of items) {
    const values = mapValues(item);
    if (item.id && existingIds.has(item.id)) {
      await tx.update(table).set(values).where(eq(table.id, item.id));
      keepIds.add(item.id);
    } else {
      const id = item.id ?? randomUUID();
      await tx.insert(table).values({ id, masjidId, ...values } as never);
      keepIds.add(id);
    }
  }

  const toDelete = [...existingIds].filter((id) => !keepIds.has(id));
  if (toDelete.length === 0) return [];

  const deleteQuery = tx.delete(table).where(and(eq(table.masjidId, masjidId), inArray(table.id, toDelete)));
  if (returningColumns) {
    return (await deleteQuery.returning(returningColumns)) as unknown as TReturning[];
  }
  await deleteQuery;
  return [];
}
