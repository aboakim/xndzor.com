"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { TrafficPeriodKey, TrafficStats } from "@/lib/traffic-stats";

const PERIODS: { key: TrafficPeriodKey; label: "visits24h" | "visits7d" | "visits30d" }[] = [
  { key: "h24", label: "visits24h" },
  { key: "d7", label: "visits7d" },
  { key: "d30", label: "visits30d" },
];

export function AdminTrafficPanel({
  initial,
  initialOnline,
}: {
  initial: TrafficStats;
  initialOnline: number;
}) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [traffic, setTraffic] = useState(initial);
  const [online, setOnline] = useState(initialOnline);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/admin/online", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { online?: unknown };
        if (!stop && typeof data.online === "number") setOnline(data.online);
      } catch {
        // Keep the last number on screen.
      }
    };
    const timer = window.setInterval(tick, 15_000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/admin/traffic", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as TrafficStats;
        if (!stop && data?.periods?.h24 && data.periods.d7 && data.periods.d30) {
          setTraffic(data);
        }
      } catch {
        // Keep the last totals on screen.
      }
    };
    const timer = window.setInterval(tick, 60_000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, []);

  const fmt = (value: number) => value.toLocaleString(locale);

  return (
    <section className="admin-visits" aria-labelledby="admin-visits-heading">
      <div className="admin-stat-card admin-online-card">
        <div className="admin-online-copy">
          <span className="admin-online-label">
            <span className="admin-online-dot" aria-hidden="true" />
            {t("stats.onlineNow")}
          </span>
        </div>
        <strong aria-live="polite">{fmt(online)}</strong>
      </div>

      <h2 id="admin-visits-heading">{t("stats.visits")}</h2>
      <p className="tiny muted admin-traffic-note">{t("stats.trackingSince")}</p>
      <p className="tiny muted admin-traffic-note">
        {traffic.source === "vercel" ? t("stats.liveSource") : t("stats.snapshotSource")}
      </p>

      <div className="admin-traffic-grid">
        {PERIODS.map(({ key, label }) => {
          const period = traffic.periods[key];
          return (
            <div key={key} className="admin-stat-card admin-traffic-card">
              <span className="admin-traffic-period">{t(`stats.${label}`)}</span>
              <div className="admin-traffic-metric">
                <span>{t("stats.visitors")}</span>
                <b>{fmt(period.visitors)}</b>
              </div>
              <div className="admin-traffic-metric">
                <span>{t("stats.pageViews")}</span>
                <b>{fmt(period.pageViews)}</b>
              </div>
              {period.bounceRate != null ? (
                <span className="tiny muted">
                  {t("stats.bounce")} {period.bounceRate}% · {t("stats.bounceAsOf")}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
