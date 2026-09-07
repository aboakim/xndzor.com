import { prisma } from "@/lib/prisma";
import { findMarz, findVillage, getVillagesForMarz } from "@/lib/locations";

/** Ensure a marz row exists (FK-safe) from the static Armenia catalog. */
export async function ensureMarz(marzId: string): Promise<boolean> {
  const m = findMarz(marzId);
  if (!m) return false;
  await prisma.marz.upsert({
    where: { id: m.id },
    create: {
      id: m.id,
      slug: m.slug,
      nameHy: m.nameHy,
      nameEn: m.nameEn,
      nameRu: m.nameRu,
      sortOrder: m.sortOrder,
    },
    update: {},
  });
  return true;
}

/**
 * Ensure a village row exists for the given marz.
 * Returns the village id when valid, otherwise null.
 */
export async function ensureVillage(
  villageId: string,
  marzId: string,
): Promise<string | null> {
  const v = findVillage(villageId);
  if (!v || v.marzId !== marzId) return null;
  const ok = await ensureMarz(marzId);
  if (!ok) return null;
  await prisma.village.upsert({
    where: { id: v.id },
    create: {
      id: v.id,
      slug: v.slug,
      marzId: v.marzId,
      nameHy: v.nameHy,
      nameEn: v.nameEn,
      nameRu: v.nameRu,
      kind: v.kind,
      lat: v.lat,
      lng: v.lng,
    },
    update: {},
  });
  return v.id;
}

/** Bulk-insert missing villages for a marz (idempotent; skipDuplicates). */
export async function ensureVillagesForMarz(marzId: string): Promise<number> {
  const list = getVillagesForMarz(marzId);
  if (list.length === 0) return 0;
  const ok = await ensureMarz(marzId);
  if (!ok) return 0;
  const result = await prisma.village.createMany({
    data: list.map((v) => ({
      id: v.id,
      slug: v.slug,
      marzId: v.marzId,
      nameHy: v.nameHy,
      nameEn: v.nameEn,
      nameRu: v.nameRu,
      kind: v.kind,
      lat: v.lat,
      lng: v.lng,
    })),
    skipDuplicates: true,
  });
  return result.count;
}
