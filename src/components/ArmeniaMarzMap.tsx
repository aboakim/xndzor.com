"use client";

import { useMemo, useState } from "react";
import type { MarzBalance, SignalLevel } from "@/lib/exchange";

type TFn = (key: string, values?: Record<string, string | number>) => string;

/** Schematic clickable Armenia marz map (not geodetic — readable mobile choropleth). */
const REGIONS: { id: string; d: string; labelX: number; labelY: number }[] = [
  { id: "Shirak", d: "M48 28 h70 v42 h-70 z", labelX: 83, labelY: 50 },
  { id: "Lori", d: "M128 22 h78 v48 h-78 z", labelX: 167, labelY: 48 },
  { id: "Tavush", d: "M216 30 h72 v44 h-72 z", labelX: 252, labelY: 54 },
  { id: "Aragatsotn", d: "M52 78 h68 v46 h-68 z", labelX: 86, labelY: 103 },
  { id: "Kotayk", d: "M130 78 h70 v46 h-70 z", labelX: 165, labelY: 103 },
  { id: "Gegharkunik", d: "M210 78 h82 v52 h-82 z", labelX: 251, labelY: 106 },
  { id: "Armavir", d: "M40 132 h72 v44 h-72 z", labelX: 76, labelY: 156 },
  { id: "Yerevan", d: "M122 134 h52 v40 h-52 z", labelX: 148, labelY: 156 },
  { id: "Ararat", d: "M184 134 h72 v48 h-72 z", labelX: 220, labelY: 160 },
  { id: "VayotsDzor", d: "M168 190 h78 v40 h-78 z", labelX: 207, labelY: 212 },
  { id: "Syunik", d: "M210 238 h70 v48 h-70 z", labelX: 245, labelY: 264 },
];

function fillFor(signal: SignalLevel): string {
  if (signal === "OVER") return "rgba(155, 47, 47, 0.55)";
  if (signal === "UNDER") return "rgba(26, 107, 85, 0.55)";
  if (signal === "BALANCED") return "rgba(184, 146, 42, 0.45)";
  return "rgba(90, 107, 114, 0.18)";
}

function signalEmoji(signal: SignalLevel): string {
  if (signal === "OVER") return "⚠️";
  if (signal === "UNDER") return "🟢";
  if (signal === "BALANCED") return "⚖️";
  return "·";
}

export function ArmeniaMarzMap({
  balances,
  selectedMarzId,
  onSelect,
  t,
}: {
  balances: MarzBalance[];
  selectedMarzId?: string | null;
  onSelect?: (marzId: string | null) => void;
  t: TFn;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const byId = useMemo(() => {
    const m = new Map<string, MarzBalance>();
    for (const b of balances) m.set(b.marzId, b);
    return m;
  }, [balances]);

  const active = hover || selectedMarzId;
  const tip = active ? byId.get(active) : null;

  function toggle(id: string) {
    onSelect?.(selectedMarzId === id ? null : id);
  }

  return (
    <div className="armenia-map">
      <div className="armenia-map-visual">
        <svg viewBox="0 0 320 300" role="img" aria-label={t("grow.mapTitle")}>
          {REGIONS.map((r) => {
            const bal = byId.get(r.id);
            const signal = bal?.signal || "NO_DATA";
            const isOn = selectedMarzId === r.id;
            return (
              <g key={r.id}>
                <path
                  d={r.d}
                  fill={fillFor(signal)}
                  stroke={isOn ? "var(--pine-deep)" : "rgba(15,74,60,0.35)"}
                  strokeWidth={isOn ? 2.5 : 1}
                  className={`marz-path${isOn ? " is-selected" : ""}${hover === r.id ? " is-hover" : ""}`}
                  tabIndex={0}
                  role="button"
                  aria-label={t(`marzes.${r.id}` as "marzes.Yerevan")}
                  onClick={() => toggle(r.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(r.id);
                    }
                  }}
                  onMouseEnter={() => setHover(r.id)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(r.id)}
                  onBlur={() => setHover(null)}
                />
                <text
                  x={r.labelX}
                  y={r.labelY}
                  textAnchor="middle"
                  className="marz-label"
                  pointerEvents="none"
                >
                  {t(`marzes.${r.id}` as "marzes.Yerevan").slice(0, 8)}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="map-legend">
          <span className="leg over">{t("grow.chipOver")}</span>
          <span className="leg under">{t("grow.chipUnder")}</span>
          <span className="leg bal">{t("grow.chipBalanced")}</span>
          <span className="leg none">{t("grow.chipNoData")}</span>
        </div>
      </div>

      <ul className="marz-touch-list" aria-label={t("grow.mapTitle")}>
        {REGIONS.map((r) => {
          const bal = byId.get(r.id);
          const signal = bal?.signal || "NO_DATA";
          const isOn = selectedMarzId === r.id;
          return (
            <li key={r.id}>
              <button
                type="button"
                className={`marz-touch-btn is-${signal.toLowerCase()} ${isOn ? "on" : ""}`}
                onClick={() => toggle(r.id)}
                aria-pressed={isOn}
              >
                <span className="marz-touch-signal" aria-hidden>
                  {signalEmoji(signal)}
                </span>
                <span className="marz-touch-body">
                  <strong>{t(`marzes.${r.id}` as "marzes.Yerevan")}</strong>
                  {bal ? (
                    <em>
                      {t("grow.mapTip", {
                        supply: bal.supplyTons,
                        demand: bal.demandTons,
                      })}
                    </em>
                  ) : (
                    <em>{t("grow.chipNoData")}</em>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {tip ? (
        <p className="map-tip">
          <strong>{t(`marzes.${tip.marzId}` as "marzes.Yerevan")}</strong>
          {" — "}
          {t("grow.mapTip", {
            supply: tip.supplyTons,
            demand: tip.demandTons,
          })}
        </p>
      ) : (
        <p className="map-tip muted">{t("grow.mapHint")}</p>
      )}
    </div>
  );
}
