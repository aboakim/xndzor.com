import { MARZES, type MarzSlug } from "@/lib/places";
import { MARZ_COORDS } from "@/lib/marz-coords";

/** Resolve `/regions/[marz]` param to canonical Marz id (case-insensitive). */
export function resolveMarzSlug(param: string | undefined | null): MarzSlug | null {
  if (!param) return null;
  const normalized = param.trim();
  const hit = MARZES.find((m) => m.toLowerCase() === normalized.toLowerCase());
  return hit ?? null;
}

export function marzRegionPath(marzId: string): string {
  return `/regions/${marzId}`;
}

export function marzPlaceJsonLd(opts: {
  locale: string;
  marzId: string;
  marzName: string;
  pageUrl: string;
}) {
  const coords = MARZ_COORDS[opts.marzId];
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: opts.marzName,
    url: opts.pageUrl,
    address: {
      "@type": "PostalAddress",
      addressRegion: opts.marzName,
      addressCountry: "AM",
    },
    containedInPlace: {
      "@type": "Country",
      name: "Armenia",
    },
    ...(coords
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: coords.lat,
            longitude: coords.lon,
          },
        }
      : {}),
  };
}
