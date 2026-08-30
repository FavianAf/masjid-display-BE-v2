import * as repo from "./hadist.repository";

export async function getActive(masjidId: string) {
  const rows = await repo.getActiveByMasjidId(masjidId);
  return {
    data: rows.map((h) => ({
      id: h.id,
      text: h.text,
      source: h.source,
      is_active: h.isActive,
      created_at: h.createdAt.toISOString(),
      updated_at: h.updatedAt.toISOString(),
    })),
  };
}
