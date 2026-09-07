import { ensureMarz, ensureVillage } from "@/lib/ensure-locations";
import { ensureProduct } from "@/lib/ensure-products";

/** Ensure marz (+ optional village) exist for FK writes. */
export async function resolveLocationRefs(
  marzId: string,
  villageId?: string | null,
): Promise<{ ok: true; marzId: string; villageId: string | null } | { ok: false; error: string }> {
  const marzOk = await ensureMarz(marzId);
  if (!marzOk) return { ok: false, error: "Invalid marz" };

  if (!villageId) {
    return { ok: true, marzId, villageId: null };
  }

  const resolved = await ensureVillage(villageId, marzId);
  if (!resolved) return { ok: false, error: "Village must belong to marz" };
  return { ok: true, marzId, villageId: resolved };
}

/** Ensure product exists; returns canonical DB id. */
export async function resolveProductId(
  productIdOrSlug: string,
): Promise<{ ok: true; productId: string } | { ok: false; error: string }> {
  const id = await ensureProduct(productIdOrSlug);
  if (!id) return { ok: false, error: "Invalid product" };
  return { ok: true, productId: id };
}
