"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { villageMapUrl } from "@/lib/places";

type MapVillage = {
  nameHy: string;
  nameEn: string;
  nameRu: string;
  lat?: number | null;
  lng?: number | null;
};

/**
 * Leaflet map centred on a settlement (OpenStreetMap tiles + marker).
 * Avoids openstreetmap.org/export/embed iframes, which our CSP blocks
 * (default-src 'self' with no frame-src) and which show a browser "content blocked" page.
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
  const mapEl = useRef<HTMLDivElement>(null);
  const external = villageMapUrl(village, marzNameEn);
  const hasCoords = village.lat != null && village.lng != null;

  useEffect(() => {
    if (!mapEl.current || village.lat == null || village.lng == null) return;

    const map = L.map(mapEl.current, {
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView([village.lat, village.lng], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.circleMarker([village.lat, village.lng], {
      radius: 9,
      color: "#0f4a3c",
      fillColor: "#1a6b55",
      fillOpacity: 0.95,
      weight: 2,
    })
      .addTo(map)
      .bindPopup(title);

    const onResize = () => map.invalidateSize();
    const resizeTimer = window.setTimeout(onResize, 50);
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      map.remove();
    };
  }, [village.lat, village.lng, title]);

  return (
    <div className="village-map">
      {hasCoords ? (
        <div
          ref={mapEl}
          className="village-map-frame"
          role="img"
          aria-label={title}
        />
      ) : (
        <p className="village-map-fallback">{noCoordsLabel}</p>
      )}
      <div className="village-map-foot">
        <a href={external} target="_blank" rel="noreferrer noopener" className="text-link">
          {openLabel} →
        </a>
        {hasCoords ? (
          <span className="muted small">
            {village.lat!.toFixed(4)}, {village.lng!.toFixed(4)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
