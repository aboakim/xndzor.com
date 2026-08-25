import locations from "../../data/armenia-locations.json";
import type { LocationMarz, LocationVillage } from "./places";

export {
  MARZES,
  localizedPlaceName,
  villageEmbedUrl,
  villageMapUrl,
  type LocationMarz,
  type LocationVillage,
  type MarzSlug,
} from "./places";

export const locationMarzes = locations.marzes as LocationMarz[];
export const locationVillages = locations.villages as LocationVillage[];

const villagesByMarz = new Map<string, LocationVillage[]>();
const villagesById = new Map<string, LocationVillage>();
const villagesBySlug = new Map<string, LocationVillage>();
for (const v of locationVillages) {
  const list = villagesByMarz.get(v.marzId) || [];
  list.push(v);
  villagesByMarz.set(v.marzId, list);
  villagesById.set(v.id, v);
  villagesBySlug.set(v.slug, v);
}

export function getVillagesForMarz(marzId: string): LocationVillage[] {
  return villagesByMarz.get(marzId) || [];
}

export function findVillage(id: string): LocationVillage | undefined {
  return villagesById.get(id);
}

export function findVillageBySlug(slug: string): LocationVillage | undefined {
  return villagesBySlug.get(slug);
}

export function findMarz(id: string): LocationMarz | undefined {
  return locationMarzes.find((m) => m.id === id);
}
