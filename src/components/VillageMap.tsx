import { villageEmbedUrl, villageMapUrl } from "@/lib/places";

type MapVillage = {
  nameHy: string;
  nameEn: string;
  nameRu: string;
  lat?: number | null;
  lng?: number | null;
};

/**
 * OpenStreetMap frame centred on a settlement. Villages without coordinates fall back
 * to a name search link instead of an embedded map.
 */
export function VillageMap({
  village,
  marzNameEn,
  title,
  openLabel,
  noCoordsLabel,
}: {
  village: MapVillage;
  marzNameEn?: string;
  title: string;
  openLabel: string;
  noCoordsLabel: string;
}) {
  const embed = villageEmbedUrl(village);
  const external = villageMapUrl(village, marzNameEn);

  return (
    <div className="village-map">
      {embed ? (
        <iframe
          className="village-map-frame"
          src={embed}
          title={title}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <p className="village-map-fallback">{noCoordsLabel}</p>
      )}
      <div className="village-map-foot">
        <a href={external} target="_blank" rel="noreferrer noopener" className="text-link">
          {openLabel} →
        </a>
        {village.lat != null && village.lng != null ? (
          <span className="muted small">
            {village.lat.toFixed(4)}, {village.lng.toFixed(4)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
