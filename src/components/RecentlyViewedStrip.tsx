"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PrefetchLink } from "@/components/PrefetchLink";
import { readRecentViews, type RecentViewItem } from "@/lib/recently-viewed";

/** Client strip of recently opened listings (localStorage). Hidden when empty. */
export function RecentlyViewedStrip() {
  const t = useTranslations("home");
  const [items, setItems] = useState<RecentViewItem[]>([]);

  useEffect(() => {
    setItems(readRecentViews().slice(0, 8));
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="section home-recent-strip" aria-label={t("recentlyViewed")}>
      <div className="home-recent-head">
        <h2>{t("recentlyViewed")}</h2>
        <p className="muted small">{t("recentlyViewedHint")}</p>
      </div>
      <div className="home-recent-track" role="list">
        {items.map((item) => (
          <PrefetchLink
            key={`${item.kind}-${item.id}`}
            href={item.href}
            className="home-recent-card"
            role="listitem"
            pressable
          >
            <span className="home-recent-media" aria-hidden>
              {item.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumb} alt="" loading="lazy" decoding="async" />
              ) : (
                <span className="home-recent-fallback">{item.title.slice(0, 1)}</span>
              )}
            </span>
            <span className="home-recent-body">
              <strong>{item.title}</strong>
              <em>
                {t.has(`recentKind.${item.kind}` as "recentKind.machinery")
                  ? t(`recentKind.${item.kind}` as "recentKind.machinery")
                  : item.kind}
                {item.subtitle ? ` · ${item.subtitle}` : ""}
              </em>
            </span>
          </PrefetchLink>
        ))}
      </div>
    </section>
  );
}
