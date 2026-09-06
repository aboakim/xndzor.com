import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { FarmPageShell } from "@/components/farm/FarmPageShell";
import { WeatherWidget, RiskCards } from "@/components/farm/WeatherWidget";
import { fetchFarmWeather } from "@/lib/weather";
import { PrefetchLink } from "@/components/PrefetchLink";

export default async function RadarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("farm");
  const tn = await getTranslations("nav");
  const session = await getSession();

  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          villageId: true,
          marzId: true,
          village: { select: { id: true, nameHy: true, nameRu: true, nameEn: true, lat: true, lng: true } },
          marz: { select: { id: true, slug: true } },
        },
      })
    : null;

  const villageId = user?.villageId;
  const villageName = user?.village
    ? locale === "hy"
      ? user.village.nameHy
      : locale === "ru"
        ? user.village.nameRu
        : user.village.nameEn
    : t("radar.demoVillage");

  const weather = await fetchFarmWeather(
    {
      marzId: user?.marzId || "Ararat",
      villageLat: user?.village?.lat ?? undefined,
      villageLng: user?.village?.lng ?? undefined,
      placeLabel: villageName,
    },
    locale,
  );

  let stats = {
    farms: 12,
    harvests: 5,
    machinery: 3,
    trucks: 2,
    warehouses: 4,
    risksHigh: weather.risks.filter((r) => r.level === "high").length || 1,
    supplies: 7,
    isDemo: true,
  };

  if (villageId) {
    const [farms, harvests, machinery, warehouses, supplies] = await Promise.all([
      prisma.user.count({ where: { villageId, role: { in: ["FARMER", "BOTH"] } } }),
      prisma.futureHarvest.count({
        where: { villageId, status: "ACTIVE" },
      }),
      prisma.machineryListing.count({
        where: { villageId, status: "ACTIVE" },
      }),
      prisma.spaceListing.count({
        where: { villageId, status: "ACTIVE" },
      }),
      prisma.supply.count({
        where: { villageId, status: "ACTIVE" },
      }),
    ]);
    if (farms + harvests + machinery + warehouses + supplies > 0) {
      stats = {
        farms: Math.max(farms, 1),
        harvests,
        machinery,
        trucks: Math.max(1, Math.floor(machinery / 2) || 1),
        warehouses,
        risksHigh: weather.risks.filter((r) => r.level === "high").length,
        supplies,
        isDemo: false,
      };
    }
  }

  const cards = [
    { key: "farms", value: stats.farms, tone: "pine" },
    { key: "harvests", value: stats.harvests, tone: "gold" },
    { key: "machinery", value: stats.machinery, tone: "wheat" },
    { key: "trucks", value: stats.trucks, tone: "sky" },
    { key: "warehouses", value: stats.warehouses, tone: "pine" },
    { key: "risks", value: stats.risksHigh, tone: "warn" },
  ] as const;

  const activity = [
    { key: "harvestPulse", n: stats.harvests },
    { key: "machinePulse", n: stats.machinery },
    { key: "supplyPulse", n: stats.supplies },
  ] as const;

  return (
    <FarmPageShell
      title={t("tools.radar.title")}
      lede={t("tools.radar.desc")}
      breadcrumbs={[
        { href: "/", label: tn("home") },
        { href: "/farm", label: t("hub.title") },
        { label: t("tools.radar.title") },
      ]}
      actions={
        <PrefetchLink href="/farm/together" className="btn ghost" pressable>
          {t("tools.together.title")}
        </PrefetchLink>
      }
    >
      <p className="farm-radar-place">
        {villageName}
        {stats.isDemo ? <span className="farm-pill">{t("radar.anonymousDemo")}</span> : null}
      </p>

      <div className="farm-radar-layout">
        <div className="farm-radar-main">
          <div className="farm-radar-grid">
            {cards.map((c) => (
              <div key={c.key} className={`farm-stat farm-stat--${c.tone}`}>
                <strong>{c.value}</strong>
                <em>{t(`radar.metrics.${c.key}`)}</em>
              </div>
            ))}
          </div>

          <section className="farm-radar-activity">
            <h2 className="farm-subhead">{t("radar.activityTitle")}</h2>
            <ul className="farm-radar-activity-list">
              {activity.map((a) => (
                <li key={a.key}>
                  <span className="farm-radar-activity-dot" aria-hidden />
                  <p>{t(`radar.activity.${a.key}`, { n: a.n })}</p>
                </li>
              ))}
            </ul>
            <p className="muted small">{t("radar.privacy")}</p>
          </section>
        </div>

        <div className="farm-radar-side">
          <WeatherWidget
            weather={weather}
            labels={{
              title: t("weather.title"),
              demo: t("weather.demo"),
              live: t("weather.live"),
              place: villageName,
            }}
          />
          <RiskCards risks={weather.risks} />
          {!session?.user ? (
            <p className="farm-login-hint">
              {t("hub.loginHint")}{" "}
              <Link href="/auth/login">{tn("login")}</Link>
            </p>
          ) : null}
        </div>
      </div>
    </FarmPageShell>
  );
}
