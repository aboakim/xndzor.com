"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";

const STRIP_ITEMS = [
  { key: "community" as const, icon: "🤝", tone: "green" },
  { key: "prices" as const, icon: "֏", tone: "gold" },
  { key: "exclusive" as const, icon: "✦", tone: "sky" },
] as const;

export function TrustValueStrip() {
  const t = useTranslations("xndzor.trustStrip");

  return (
    <section className="tvs" aria-label={t("ariaLabel")}>
      <div className="tvs-track">
        {STRIP_ITEMS.map((item, i) => (
          <div
            key={item.key}
            className={`tvs-item tvs-item-${item.tone}`}
            style={{ "--tvs-delay": `${80 + i * 110}ms` } as CSSProperties}
          >
            <span className={`tvs-icon tvs-icon-float tvs-icon-float-${i}`} aria-hidden>
              {item.icon}
            </span>
            <p className="tvs-text">{t(`items.${item.key}`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
