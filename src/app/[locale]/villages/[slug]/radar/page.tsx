import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { localizedPlaceName } from "@/lib/places";
import { fetchWeatherForecast, resolveWeatherCoordsAsync } from "@/lib/weather";
import { WeatherPanel } from "@/components/farm-os/WeatherPanel";

export default async function VillageRadarPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const village = await prisma.village.findUnique({
    where: { slug },
    include: { marz: true },
  });
  if (!village) notFound();

  const [
    farms,
    harvests,
    machinery,
    trucks,
    spaces,
    supplies,
  ] = await Promise.all([
    prisma.user.count({ where: { villageId: village.id } }),
    prisma.futureHarvest.count({
      where: { villageId: village.id, status: "ACTIVE" },
    }),
    prisma.machineryListing.count({
      where: {
        villageId: village.id,
        status: "ACTIVE",
        machineryType: { not: "TRUCK" },
      },
    }),
    prisma.machineryListing.count({
      where: { villageId: village.id, status: "ACTIVE", machineryType: "TRUCK" },
    }),
    prisma.spaceListing.count({
      where: { villageId: village.id, status: "ACTIVE" },
    }),
    prisma.supply.count({ where: { villageId: village.id, status: "ACTIVE" } }),
  ]);

  // Demo floor for sparsely seeded villages so radar UI always reads
  const demoBoost = farms + harvests + machinery < 2;
  const stats = {
    farms: demoBoost ? Math.max(farms, 4) : farms,
    harvests: demoBoost ? Math.max(harvests, 2) : harvests,
    machinery: demoBoost ? Math.max(machinery, 1) : machinery,
    trucks: demoBoost ? Math.max(trucks, 1) : trucks,
    spaces: demoBoost ? Math.max(spaces, 1) : spaces,
    supplies: demoBoost ? Math.max(supplies, 3) : supplies,
    isDemo: demoBoost,
  };

  const coords = await resolveWeatherCoordsAsync({
    villageId: village.id,
    marzId: village.marzId,
    placeLabel: localizedPlaceName(village, locale),
  });
  const weather = coords
    ? await fetchWeatherForecast({
        lat: coords.lat,
        lng: coords.lng,
        locale,
        placeLabel: coords.placeLabel,
      })
    : null;

  const name = localizedPlaceName(village, locale);

  return (
    <div className="section page-board">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { href: `/villages/${slug}`, label: name },
          { label: t("farmOs.radar.title") },
        ]}
      />

      <div className="section-head">
        <div>
          <p className="eyebrow">{t("farmOs.radar.eyebrow")}</p>
          <h1>
            {t("farmOs.radar.heading", { village: name })}
          </h1>
          <p className="lede">{t("farmOs.radar.lede")}</p>
        </div>
        <Link href={`/villages/${slug}`} className="btn ghost">
          {t("farmOs.radar.backVillage")}
        </Link>
      </div>

      {stats.isDemo ? (
        <p className="muted tiny">{t("farmOs.radar.demoNote")}</p>
      ) : null}

      <div className="detail-stats">
        <div>
          <span>{t("farmOs.radar.farms")}</span>
          <strong>{stats.farms}</strong>
        </div>
        <div>
          <span>{t("farmOs.radar.harvests")}</span>
          <strong>{stats.harvests}</strong>
        </div>
        <div>
          <span>{t("farmOs.radar.machinery")}</span>
          <strong>{stats.machinery}</strong>
        </div>
        <div>
          <span>{t("farmOs.radar.trucks")}</span>
          <strong>{stats.trucks}</strong>
        </div>
        <div>
          <span>{t("farmOs.radar.storage")}</span>
          <strong>{stats.spaces}</strong>
        </div>
        <div>
          <span>{t("farmOs.radar.supplies")}</span>
          <strong>{stats.supplies}</strong>
        </div>
      </div>

      <WeatherPanel weather={weather} />

      <section className="fos-panel">
        <h2>{t("farmOs.radar.risksTitle")}</h2>
        <ul className="fos-risk-list">
          {weather?.frostRisk48h ? (
            <li className="fos-risk fos-risk-high">
              <strong>{t("farmOs.risks.frost")}</strong>
              <p>{t("farmOs.radar.frostVillage")}</p>
            </li>
          ) : (
            <li className="fos-risk fos-risk-low">
              <strong>{t("farmOs.risks.calm")}</strong>
              <p>{t("farmOs.radar.calmVillage")}</p>
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
