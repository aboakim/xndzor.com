import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { resolveTaskCopy } from "@/lib/task-copy";
import { buildTodaySuggestions } from "@/lib/farm-today";
import { buildTomorrowRisks } from "@/lib/farm-os/risks";
import { getXndzorScore } from "@/lib/farm-os/xndzor-score";
import { fetchWeatherForecast, resolveWeatherCoordsAsync } from "@/lib/weather";
import { effectiveTons } from "@/lib/yield";
import { formatAmd } from "@/lib/utils";
import { localizedPlaceName } from "@/lib/places";
import { WeatherPanel } from "@/components/farm-os/WeatherPanel";
import { TomorrowDangerCard } from "@/components/farm-os/TomorrowDangerCard";
import { XndzorScoreCard } from "@/components/farm-os/XndzorScoreCard";
import { EmptyReturnTeaser } from "@/components/farm-os/EmptyReturnTeaser";
import { PlotSelector } from "@/components/farm-os/PlotSelector";
import { SellDecisionCalculator } from "@/components/farm-os/SellDecisionCalculator";

export const dynamic = "force-dynamic";

export default async function FarmOsTodayPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ plot?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();

  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/today`);
  }

  const plots = await prisma.plot.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    include: {
      cropProduct: true,
      village: true,
      marz: true,
      yieldEstimate: true,
      tasks: {
        where: { status: "OPEN" },
        orderBy: { priority: "desc" },
        take: 8,
      },
      futureHarvests: {
        where: { status: "ACTIVE" },
        include: { preOffers: { where: { status: { in: ["SENT", "RESERVED"] } } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const selected =
    plots.find((p) => p.id === sp.plot) || plots[0] || null;

  const coords = selected
    ? await resolveWeatherCoordsAsync({
        villageId: selected.villageId,
        marzId: selected.marzId,
        placeLabel: selected.village
          ? localizedPlaceName(selected.village, locale)
          : undefined,
      })
    : await resolveWeatherCoordsAsync({ marzId: "Ararat" });

  const weather = coords
    ? await fetchWeatherForecast({
        lat: coords.lat,
        lng: coords.lng,
        locale,
        placeLabel: coords.placeLabel,
      })
    : null;

  const risks = selected
    ? buildTomorrowRisks({
        weather,
        cropSlug: selected.cropProduct.slug,
        harvestFrom: selected.harvestFrom,
        harvestTo: selected.harvestTo,
        lastIrrigationAt: selected.lastIrrigationAt,
      })
    : [];

  const suggestions = selected
    ? buildTodaySuggestions({
        cropSlug: selected.cropProduct.slug,
        lastIrrigationAt: selected.lastIrrigationAt,
        harvestFrom: selected.harvestFrom,
        harvestTo: selected.harvestTo,
        interestedBuyers: selected.futureHarvests.reduce(
          (n, fh) => n + fh.preOffers.length,
          0
        ),
      })
    : [];

  const [score, expenseAgg] = await Promise.all([
    getXndzorScore(session.user.id),
    prisma.farmExpense.aggregate({
      where: { userId: session.user.id },
      _sum: { amountAmd: true },
      _count: true,
    }),
  ]);

  const tons = selected?.yieldEstimate
    ? effectiveTons(selected.yieldEstimate)
    : null;
  const totalSpend = expenseAgg._sum.amountAmd ?? 0;
  const costPerKg =
    tons && tons > 0 ? Math.round(totalSpend / (tons * 1000)) : null;

  const cropOptions = Array.from(
    new Map(
      plots.map((p) => [
        p.cropProduct.slug,
        {
          slug: p.cropProduct.slug,
          label: t(p.cropProduct.nameKey as "products.tomato"),
          defaultPrice:
            p.cropProduct.slug === "tomato"
              ? 160000
              : p.cropProduct.slug === "wheat"
                ? 120000
                : p.cropProduct.slug === "grape"
                  ? 280000
                  : 150000,
        },
      ])
    ).values()
  );
  if (cropOptions.length === 0) {
    cropOptions.push({
      slug: "tomato",
      label: t("products.tomato"),
      defaultPrice: 160000,
    });
  }

  return (
    <div className="section page-board fos-today">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { label: t("farmOs.today.title") },
        ]}
      />

      <div className="section-head">
        <div>
          <p className="eyebrow">{t("farmOs.brandEyebrow")}</p>
          <h1>{t("farmOs.today.title")}</h1>
          <p className="lede">{t("farmOs.today.tagline")}</p>
        </div>
      </div>

      {plots.length > 0 ? (
        <PlotSelector
          plots={plots.map((p) => ({
            id: p.id,
            name: p.name,
            cropSlug: p.cropProduct.slug,
          }))}
          selectedId={selected?.id ?? null}
        />
      ) : (
        <div className="empty-state-cta">
          <p>{t("plots.empty")}</p>
          <Link href="/plots/new" className="btn primary">
            {t("plots.add")}
          </Link>
        </div>
      )}

      <div className="fos-today-grid">
        <WeatherPanel weather={weather} />
        {selected ? (
          <TomorrowDangerCard
            risks={risks}
            placeLabel={
              selected.village
                ? localizedPlaceName(selected.village, locale)
                : t(`marzes.${selected.marz.slug}` as "marzes.Yerevan")
            }
            cropLabel={t(selected.cropProduct.nameKey as "products.tomato")}
          />
        ) : null}
      </div>

      <section className="fos-panel">
        <h2>{t("today.title")}</h2>
        {selected?.tasks.length || suggestions.length ? (
          <ul className="fos-task-list">
            {(selected?.tasks.length
              ? selected.tasks.map((task) => ({
                  key: task.id,
                  title: resolveTaskCopy(
                    (k, v) => t(k as "today.irrigationDue", v),
                    task.title
                  ),
                  detail: task.detail
                    ? resolveTaskCopy(
                        (k, v) => t(k as "today.irrigationDueDetail", v),
                        task.detail
                      )
                    : null,
                }))
              : suggestions.map((s, i) => ({
                  key: `s-${i}`,
                  title: t(s.titleKey as "today.irrigationDue"),
                  detail: t(
                    s.detailKey as "today.irrigationDueDetail",
                    s.detailParams as Record<string, string | number | Date>
                  ),
                }))
            ).map((row) => (
              <li key={row.key}>
                <strong>{row.title}</strong>
                {row.detail ? <p>{row.detail}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">{t("today.noTasks")}</p>
        )}
        {selected ? (
          <Link href={`/plots/${selected.id}`} className="btn ghost">
            {t("farmOs.today.openPlot")}
          </Link>
        ) : null}
      </section>

      <div className="fos-today-grid">
        <section className="fos-panel fos-costs-snap">
          <h2>{t("farmOs.costs.snapshot")}</h2>
          <div className="detail-stats">
            <div>
              <span>{t("farmOs.costs.seasonTotal")}</span>
              <strong>{formatAmd(totalSpend)} ֏</strong>
            </div>
            <div>
              <span>{t("farmOs.costs.entries")}</span>
              <strong>{expenseAgg._count}</strong>
            </div>
            <div>
              <span>{t("farmOs.costs.perKg")}</span>
              <strong>
                {costPerKg != null ? `${formatAmd(costPerKg)} ֏` : "—"}
              </strong>
            </div>
          </div>
          <Link href="/costs" className="btn primary">
            {t("farmOs.costs.open")}
          </Link>
        </section>

        {score ? (
          <XndzorScoreCard
            overall={score.overall}
            axes={score.axes}
            tips={score.tips}
            compact
          />
        ) : null}
      </div>

      <nav className="fos-quick-links fos-os-links" aria-label={t("farmOs.today.links")}>
        <Link href="/supply/new" className="btn primary">
          {t("menu.sellNow")}
        </Link>
        <Link href="/spaces" className="btn ghost">
          {t("farmOs.spaces.nav")}
        </Link>
        <Link href="/features/route" className="btn ghost">
          {t("farmOs.return.routeLink")}
        </Link>
        <Link href="/group-buy" className="btn ghost">
          {t("farmOs.villageTogether.nav")}
        </Link>
        <Link href="/sell-decision" className="btn ghost">
          {t("farmOs.sell.nav")}
        </Link>
        <Link href="/diary" className="btn ghost">
          {t("farmOs.diary.nav")}
        </Link>
      </nav>

      <SellDecisionCalculator
        crops={cropOptions}
        defaultQty={tons ?? 10}
        embedded
      />

      <EmptyReturnTeaser />

      <section className="fos-panel">
        <h2>{t("farmOs.yieldWhy.title")}</h2>
        <p className="lede tight">{t("farmOs.yieldWhy.lede")}</p>
      </section>
    </div>
  );
}
