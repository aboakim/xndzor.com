/**
 * Place helpers that carry no dataset, so client components can localise names without
 * pulling the whole Armenian settlement list into the browser bundle.
 */

export const MARZES = [
  "Yerevan",
  "Aragatsotn",
  "Ararat",
  "Armavir",
  "Gegharkunik",
  "Kotayk",
  "Lori",
  "Shirak",
  "Syunik",
  "Tavush",
  "VayotsDzor",
] as const;

export type MarzSlug = (typeof MARZES)[number];

export type LocationMarz = {
  id: string;
  slug: string;
  nameHy: string;
  nameEn: string;
  nameRu: string;
  sortOrder: number;
};

export type LocationVillage = {
  id: string;
  marzId: string;
  slug: string;
  nameHy: string;
  nameEn: string;
  nameRu: string;
  kind: string;
  lat: number | null;
  lng: number | null;
};

export type PlaceName = { nameHy: string; nameEn: string; nameRu: string };

/** Armenian is the source of truth; ru/en fall back to it when a name is missing. */
export function localizedPlaceName(place: PlaceName, locale: string): string {
  if (locale === "ru") return place.nameRu || place.nameHy || place.nameEn;
  if (locale === "en") return place.nameEn || place.nameHy;
  return place.nameHy || place.nameEn;
}

type MapVillage = Partial<PlaceName> & { lat?: number | null; lng?: number | null };

/**
 * Map link for a settlement. Real coordinates give a pinned view; villages without
 * coordinates degrade to an OpenStreetMap name search inside the marz.
 */
export function villageMapUrl(village: MapVillage, marzNameEn?: string): string {
  if (village.lat != null && village.lng != null) {
    return `https://www.openstreetmap.org/?mlat=${village.lat}&mlon=${village.lng}#map=14/${village.lat}/${village.lng}`;
  }
  const q = [village.nameHy || village.nameEn, marzNameEn, "Armenia"].filter(Boolean).join(", ");
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(q)}`;
}

