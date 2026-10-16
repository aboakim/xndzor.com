import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { seoMessagesMetadata } from "@/lib/seo-metadata";
import { getPublicTrafficStats } from "@/lib/traffic";
import { TRACKING_SINCE_LABEL, type TrafficPeriodKey } from "@/lib/traffic-stats";

export const dynamic = "force-dynamic";

const PERIODS: { key: TrafficPeriodKey; label: "period24h" | "period7d" | "periodAllTime" }[] = [
  { key: "h24", label: "period24h" },
  { key: "d7", label: "period7d" },
  { key: "allTime", label: "periodAllTime" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return seoMessagesMetadata(locale, "/stats", "stats");
}

export default async function PublicStatsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.stats");
  const navT = await getTranslations("nav");
  const stats = await getPublicTrafficStats();

  const fmt = (value: number) => value.toLocaleString(locale);
  const updated = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(stats.fetchedAt));

  return (
    <div className="section info-page public-stats-page">
      <Breadcrumbs
        items={[
          { href: "/", label: navT("home") },
          { label: t("title") },
        ]}
      />
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1>{t("title")}</h1>
      <p className="lede">{t("lede")}</p>
      <p className="tiny muted">{t("trackingSince", { date: TRACKING_SINCE_LABEL })}</p>
      <p className="tiny muted">{t("updated", { updated })}</p>
      {!stats.trackingReady ? (
        <p className="tiny muted public-stats-status">{t("counterStarting")}</p>
      ) : (
        <p className="tiny muted public-stats-status">{t("counterActive")}</p>
      )}

      <div className="public-stats-grid" aria-labelledby="public-stats-heading">
        <h2 id="public-stats-heading" className="sr-only">
          {t("tableHeading")}
        </h2>
        {PERIODS.map(({ key, label }) => {
          const period = stats.periods[key];
          return (
            <article key={key} className="public-stats-card">
              <h3 className="public-stats-period">{t(label)}</h3>
              <dl className="public-stats-metrics">
                <div className="public-stats-metric">
                  <dt>{t("visitors")}</dt>
                  <dd>{fmt(period.visitors)}</dd>
                </div>
                <div className="public-stats-metric">
                  <dt>{t("pageViews")}</dt>
                  <dd>{fmt(period.pageViews)}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>

      <p className="tiny muted public-stats-privacy">{t("privacyNote")}</p>
    </div>
  );
}
