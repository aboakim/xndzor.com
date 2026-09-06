import { getTranslations, setRequestLocale } from "next-intl/server";
import nextDynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { getSession } from "@/lib/session";
import { ActionIcon, JobTypeIcon, ProductIcon } from "@/components/AgIcons";
import { CategoryScroll } from "@/components/CategoryScroll";
import { ClassifiedRow } from "@/components/ClassifiedRow";
import { HomeSection } from "@/components/HomeSection";
import { ListingCarousel } from "@/components/ListingCarousel";
import { PostCard } from "@/components/PostCard";
import { Reveal } from "@/components/Reveal";
import { VillageLink } from "@/components/VillageLink";
import { resolveTaskCopy } from "@/lib/task-copy";
import { fetchMarzWeather } from "@/lib/weather";
import { formatAmd, formatPriceRange, formatQty, parseImageUrls } from "@/lib/utils";
import { effectiveTons } from "@/lib/yield";
import {
  getActiveBoostMap,
  getProUserIds,
  sortByMonetization,
} from "@/lib/monetization";
import { MonetizationPills } from "@/components/MonetizationBadges";
import { XndzorHero } from "@/components/xndzor/XndzorHero";
import { EarlyBirdBanner } from "@/components/xndzor/EarlyBirdBanner";
import { MarketPulse } from "@/components/xndzor/MarketPulse";
import { HomeWeatherCard } from "@/components/xndzor/HomeWeatherCard";
import { HomeBannerSkeleton, HomeStripSkeleton } from "@/components/HomeBannerSkeleton";
import { PrefetchLink } from "@/components/PrefetchLink";

const HeroPromoSlider = nextDynamic(
  () =>
    import("@/components/xndzor/HeroPromoSlider").then((m) => ({
      default: m.HeroPromoSlider,
    })),
  { loading: () => <div className="skeleton home-promo-skel" aria-hidden /> },
);

const WelcomeTrustBanner = nextDynamic(
  () =>
    import("@/components/xndzor/WelcomeTrustBanner").then((m) => ({
      default: m.WelcomeTrustBanner,
    })),
  { loading: () => <HomeStripSkeleton /> },
);

const TrustValueStrip = nextDynamic(
  () =>
    import("@/components/xndzor/TrustValueStrip").then((m) => ({
      default: m.TrustValueStrip,
    })),
  { loading: () => <HomeStripSkeleton /> },
);

const BannerGallery = nextDynamic(
  () =>
    import("@/components/xndzor/BannerGallery").then((m) => ({
      default: m.BannerGallery,
    })),
  { loading: () => <HomeBannerSkeleton /> },
);

const RecentlyViewedStrip = nextDynamic(
  () =>
    import("@/components/RecentlyViewedStrip").then((m) => ({
      default: m.RecentlyViewedStrip,
    })),
);

const CATEGORIES = [
  { href: "/grow", action: "grow", labelKey: "menu.grow" as const },
  { href: "/plots", action: "plot", labelKey: "menu.plots" as const },
  { href: "/forward", action: "forward", labelKey: "menu.forward" as const },
  { href: "/demand", action: "buy", labelKey: "menu.buy" as const },
  { href: "/supply", action: "sell", labelKey: "menu.sellNow" as const },
  { href: "/machinery", action: "machinery", labelKey: "menu.machinery" as const },
  { href: "/animals", action: "animals", labelKey: "menu.animals" as const },
  { href: "/jobs", action: "orderJob", labelKey: "menu.jobs" as const },
  { href: "/shop/fertilizers", action: "fertilizers", labelKey: "menu.fertilizers" as const },
  { href: "/shop/seeds", action: "seeds", labelKey: "menu.seeds" as const },
  { href: "/shop/feed", action: "feed", labelKey: "menu.feed" as const },
  { href: "/shop/chemicals", action: "chemicals", labelKey: "menu.chemicals" as const },
  { href: "/shop/tools", action: "tools", labelKey: "menu.tools" as const },
  { href: "/shop/land", action: "land", labelKey: "menu.land" as const },
  { href: "/group-buy", action: "groupBuy", labelKey: "menu.groupBuy" as const },
] as const;

const FEED_TAKE = 6;
const FEED_FETCH = 18;

/** Always render on request — Prisma feeds must not run at build against empty SQLite. */
export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const [
    session,
    harvestsRaw,
    suppliesRaw,
    demands,
    jobs,
    campaigns,
    machineryRaw,
    animalsRaw,
    harvestCount,
    supplyCount,
    demandCount,
    jobCount,
    campaignCount,
    machineryCount,
    animalCount,
    defaultWeather,
  ] = await Promise.all([
    getSession(),
    safeQuery(
      () =>
        prisma.futureHarvest.findMany({
          where: { status: "ACTIVE" },
          select: {
            id: true,
            userId: true,
            title: true,
            qtyExpected: true,
            unit: true,
            harvestDate: true,
            priceAmd: true,
            imageUrls: true,
            product: { select: { slug: true, nameKey: true } },
            marz: { select: { slug: true } },
            village: {
              select: {
                slug: true,
                nameHy: true,
                nameRu: true,
                nameEn: true,
              },
            },
            preOffers: { select: { status: true, qtyWanted: true } },
          },
          orderBy: { harvestDate: "asc" },
          take: FEED_FETCH,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.supply.findMany({
          where: { status: "ACTIVE" },
          select: {
            id: true,
            userId: true,
            title: true,
            qtyAvailable: true,
            unit: true,
            readyInDays: true,
            priceAmd: true,
            imageUrls: true,
            product: { select: { slug: true, nameKey: true } },
            marz: { select: { slug: true } },
            village: {
              select: {
                slug: true,
                nameHy: true,
                nameRu: true,
                nameEn: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: FEED_FETCH,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.demand.findMany({
          where: { status: "ACTIVE" },
          select: {
            id: true,
            title: true,
            qtyMin: true,
            qtyMax: true,
            unit: true,
            neededBy: true,
            timingNote: true,
            priceMinAmd: true,
            priceMaxAmd: true,
            imageUrls: true,
            product: { select: { slug: true } },
            marz: { select: { slug: true } },
            village: {
              select: {
                slug: true,
                nameHy: true,
                nameRu: true,
                nameEn: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: FEED_TAKE,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.jobRequest.findMany({
          where: { status: "ACTIVE" },
          select: {
            id: true,
            title: true,
            jobType: true,
            areaNote: true,
            hectares: true,
            workDate: true,
            dateFrom: true,
            budgetAmd: true,
            marz: { select: { slug: true } },
            village: {
              select: {
                slug: true,
                nameHy: true,
                nameRu: true,
                nameEn: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: FEED_TAKE,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.groupBuyCampaign.findMany({
          where: { status: { in: ["OPEN", "QUOTED"] } },
          select: {
            id: true,
            title: true,
            targetQty: true,
            unit: true,
            deadline: true,
            pricePerUnitAmd: true,
            product: { select: { slug: true } },
            marz: { select: { slug: true } },
            joins: { where: { status: "JOINED" }, select: { qty: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 4,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.machineryListing.findMany({
          where: { status: "ACTIVE" },
          select: {
            id: true,
            userId: true,
            title: true,
            machineryType: true,
            make: true,
            model: true,
            priceAmd: true,
            imageUrls: true,
            marz: { select: { slug: true } },
            village: {
              select: {
                slug: true,
                nameHy: true,
                nameRu: true,
                nameEn: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: FEED_FETCH,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.animalListing.findMany({
          where: { status: "ACTIVE" },
          select: {
            id: true,
            userId: true,
            title: true,
            animalType: true,
            breed: true,
            priceAmd: true,
            imageUrls: true,
            marz: { select: { slug: true } },
            village: {
              select: {
                slug: true,
                nameHy: true,
                nameRu: true,
                nameEn: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: FEED_FETCH,
        }),
      [],
    ),
    safeQuery(() => prisma.futureHarvest.count({ where: { status: "ACTIVE" } }), 0),
    safeQuery(() => prisma.supply.count({ where: { status: "ACTIVE" } }), 0),
    safeQuery(() => prisma.demand.count({ where: { status: "ACTIVE" } }), 0),
    safeQuery(() => prisma.jobRequest.count({ where: { status: "ACTIVE" } }), 0),
    safeQuery(
      () =>
        prisma.groupBuyCampaign.count({
          where: { status: { in: ["OPEN", "QUOTED"] } },
        }),
      0,
    ),
    safeQuery(() => prisma.machineryListing.count({ where: { status: "ACTIVE" } }), 0),
    safeQuery(() => prisma.animalListing.count({ where: { status: "ACTIVE" } }), 0),
    fetchMarzWeather("Ararat", locale),
  ]);

  const [
    harvestBoost,
    supplyBoost,
    machBoost,
    animalBoost,
    harvestPro,
    supplyPro,
    machPro,
    animalPro,
    plots,
  ] = await Promise.all([
    getActiveBoostMap(
      "FUTURE_HARVEST",
      harvestsRaw.map((h) => h.id),
    ),
    getActiveBoostMap(
      "SUPPLY",
      suppliesRaw.map((s) => s.id),
    ),
    getActiveBoostMap(
      "MACHINERY",
      machineryRaw.map((m) => m.id),
    ),
    getActiveBoostMap(
      "ANIMAL",
      animalsRaw.map((a) => a.id),
    ),
    getProUserIds(harvestsRaw.map((h) => h.userId)),
    getProUserIds(suppliesRaw.map((s) => s.userId)),
    getProUserIds(machineryRaw.map((m) => m.userId)),
    getProUserIds(animalsRaw.map((a) => a.userId)),
    session?.user?.id ? loadPlots(session.user.id) : Promise.resolve([]),
  ]);

  const harvests = sortByMonetization(harvestsRaw, harvestBoost, harvestPro).slice(
    0,
    FEED_TAKE,
  );
  const supplies = sortByMonetization(suppliesRaw, supplyBoost, supplyPro).slice(
    0,
    FEED_TAKE,
  );
  const machinery = sortByMonetization(machineryRaw, machBoost, machPro).slice(0, 4);
  const animals = sortByMonetization(animalsRaw, animalBoost, animalPro).slice(0, 4);

  let weatherBrief = defaultWeather;
  if (plots[0]) {
    weatherBrief = await fetchMarzWeather(plots[0].marzId, locale);
  }

  const openTasks = plots.flatMap((p) =>
    p.tasks.map((task) => ({
      plotId: p.id,
      plotName: p.name,
      taskId: task.id,
      title: task.title,
    })),
  );

  const marzLabel = (slug: string) => t(`marzes.${slug}` as "marzes.Yerevan");
  const day = (d: Date) => d.toISOString().slice(0, 10);

  const recommended = buildRecommended({
    machinery: machineryRaw,
    animals: animalsRaw,
    supplies: suppliesRaw,
    machBoost,
    animalBoost,
    supplyBoost,
    machPro,
    animalPro,
    supplyPro,
    marzLabel,
    locale,
    t,
  });

  const categoryItems = CATEGORIES.map((cat) => ({
    href: cat.href,
    action: cat.action,
    label: t(cat.labelKey),
  }));

  const weatherSummary = weatherBrief.summary;
  const heroGreeting =
    session && weatherSummary
      ? `${t("dashboard.greeting", { name: session.user?.name || "" })} · ${weatherSummary}`
      : session
        ? t("dashboard.greeting", { name: session.user?.name || "" })
        : undefined;

  const pulseStats = [
    {
      href: "/forward",
      label: t("home.forwardTitle"),
      count: harvestCount,
      accent: "gold" as const,
    },
    {
      href: "/supply",
      label: t("home.supplyTitle"),
      count: supplyCount,
      accent: "pine" as const,
    },
    {
      href: "/demand",
      label: t("home.demandTitle"),
      count: demandCount,
      accent: "sky" as const,
    },
    {
      href: "/machinery",
      label: t("home.machineryTitle"),
      count: machineryCount,
      accent: "wheat" as const,
    },
    {
      href: "/animals",
      label: t("home.animalsTitle"),
      count: animalCount,
      accent: "pine" as const,
    },
    {
      href: "/jobs",
      label: t("home.jobsTitle"),
      count: jobCount,
      accent: "gold" as const,
    },
  ];

  return (
    <div className="home-vendo home-vendo-clean home-vendo-banners home-vendo-cockpit">
      <section className="section home-categories-scroll home-categories-primary" aria-label={t("home.chooseAction")}>
        <CategoryScroll items={categoryItems} />
      </section>

      <div className="section home-promo-slider">
        <HeroPromoSlider />
      </div>

      <Reveal as="section" className="section home-early-bird" delayMs={15}>
        <EarlyBirdBanner variant="hero" />
      </Reveal>

      <XndzorHero greeting={heroGreeting} />

      <div className="home-cockpit-block">
      <Reveal as="section" className="section home-market-pulse-wrap" delayMs={30}>
        <MarketPulse
          title={t("home.marketPulseTitle")}
          subtitle={t("home.marketPulseSubtitle")}
          liveLabel={t("home.marketPulseLive")}
          stats={pulseStats}
        />
      </Reveal>

      <Reveal as="section" className="section home-weather-row" delayMs={45}>
        <HomeWeatherCard
          weather={{
            ...weatherBrief,
            placeLabel: plots[0]?.marz?.slug
              ? marzLabel(plots[0].marz.slug)
              : marzLabel("Ararat"),
          }}
          title={t("home.weatherTitle")}
          cta={t("home.weatherCta")}
          ctaHref="/farm/risks"
          demoLabel={t("home.weatherDemo")}
          liveLabel={t("home.weatherLive")}
        />
        <div className="home-quick-actions">
          <p className="home-quick-eyebrow">{t("home.quickActions")}</p>
          <p className="home-quick-cue">{t("home.quickCue")}</p>
          <div className="home-quick-grid">
            <PrefetchLink href="/supply/new" className="home-quick-chip" pressable>
              {t("home.quickSell")}
            </PrefetchLink>
            <PrefetchLink href="/demand/new" className="home-quick-chip" pressable>
              {t("home.quickBuy")}
            </PrefetchLink>
            <PrefetchLink href="/machinery" className="home-quick-chip" pressable>
              {t("home.quickMachinery")}
            </PrefetchLink>
            <PrefetchLink href="/farm" className="home-quick-chip home-quick-chip-farm" pressable>
              {t("home.quickFarm")}
            </PrefetchLink>
          </div>
          <p className="home-search-hint muted">{t("home.searchHint")}</p>
        </div>
      </Reveal>
      </div>

      <RecentlyViewedStrip />

      <Reveal as="section" className="section home-trust-banner" delayMs={40}>
        <WelcomeTrustBanner />
      </Reveal>

      <Reveal as="section" className="section home-trust-strip home-trust-strip-compact" delayMs={70}>
        <TrustValueStrip />
      </Reveal>

      <Reveal as="section" className="section home-banner-gallery" delayMs={90}>
        <BannerGallery />
      </Reveal>

      {recommended.length > 0 ? (
        <HomeSection
          action="machinery"
          title={t("home.recommendedTitle")}
          subtitle={t("home.recommendedSubtitle")}
          href="/machinery"
          seeAllLabel={t("home.seeAll")}
          centered
        >
          <ListingCarousel ariaLabel={t("home.recommendedTitle")}>
            {recommended.map((item) => (
              <PostCard key={item.key} {...item.card} />
            ))}
          </ListingCarousel>
        </HomeSection>
      ) : null}

      {session ? (
        <Reveal as="section" className="section home-farm-strip" id="today">
          <div className="home-feed-head">
            <h2>
              <span className="home-feed-icon action-today" aria-hidden>
                <ActionIcon action="today" size={20} />
              </span>
              {t("today.title")}
            </h2>
            <PrefetchLink href="/plots" className="text-link home-feed-more" pressable>
              {t("plots.title")} →
            </PrefetchLink>
          </div>

          {openTasks.length === 0 ? (
            <div className="empty-state-cta">
              <p>{plots.length === 0 ? t("plots.empty") : t("today.noTasks")}</p>
              <Link href={plots.length === 0 ? "/plots/new" : "/plots"} className="btn primary">
                {plots.length === 0 ? t("plots.add") : t("plots.title")}
              </Link>
            </div>
          ) : (
            <div className="classified-list">
              {openTasks.slice(0, 4).map((row) => (
                <ClassifiedRow
                  key={row.taskId}
                  href={`/plots/${row.plotId}`}
                  title={resolveTaskCopy((k, v) => t(k as "today.irrigationDue", v), row.title)}
                  meta={row.plotName}
                />
              ))}
            </div>
          )}

          {plots.length > 0 ? (
            <div className="plot-strip">
              {plots.map((p) => {
                const tons = p.yieldEstimate ? effectiveTons(p.yieldEstimate) : null;
                return (
                  <PrefetchLink key={p.id} href={`/plots/${p.id}`} className="plot-chip" pressable>
                    <span className="plot-chip-icon" aria-hidden>
                      <ProductIcon slugOrKey={p.cropProduct.slug} size={18} />
                    </span>
                    <span className="plot-chip-body">
                      <strong>{p.name}</strong>
                      <span>
                        {p.hectares} {t("farmos.ha")}
                        {tons != null ? ` · ~${tons} ${t("units.ton")}` : ""}
                      </span>
                    </span>
                  </PrefetchLink>
                );
              })}
            </div>
          ) : null}
        </Reveal>
      ) : (
        <Reveal as="section" className="section home-feature-row" stagger>
          <PrefetchLink href="/auth/login" className="feature-tile feature-today" pressable>
            <span className="feature-tile-icon" aria-hidden>
              <ActionIcon action="today" size={32} />
            </span>
            <strong>{t("menu.today")}</strong>
            <span>{t("menu.todayDesc")}</span>
          </PrefetchLink>
          <PrefetchLink href="/grow" className="feature-tile feature-forward" pressable>
            <span className="feature-tile-icon" aria-hidden>
              <ActionIcon action="grow" size={32} />
            </span>
            <strong>{t("menu.grow")}</strong>
            <span>{t("menu.growDesc")}</span>
          </PrefetchLink>
        </Reveal>
      )}

      <HomeSection
        action="forward"
        title={t("home.forwardTitle")}
        href="/forward"
        seeAllLabel={t("home.seeAll")}
        count={harvestCount}
        cue={t("home.sectionCueBrowse")}
      >
        {harvests.length === 0 ? (
          <EmptyFeed message={t("forwardBoard.empty")} href="/forward/new" label={t("common.add")} />
        ) : (
          <div className="listing-card-grid">
            {harvests.map((h) => {
              const reserved = h.preOffers
                .filter((o) => o.status !== "DECLINED")
                .reduce((s, o) => s + o.qtyWanted, 0);
              const top = harvestBoost.has(h.id);
              return (
                <PostCard
                  key={h.id}
                  href={`/forward/${h.id}`}
                  title={h.title}
                  thumb={parseImageUrls(h.imageUrls ?? "[]")[0]}
                  icon={<ProductIcon slugOrKey={h.product.slug} size={28} />}
                  categoryPill={t(h.product.nameKey as "products.tomato")}
                  facts={[
                    `${formatAmd(h.qtyExpected)} ${t(`units.${h.unit}` as "units.kg")}`,
                    day(h.harvestDate),
                  ]}
                  badge={
                    top || reserved > 0 ? (
                      <>
                        {top ? <MonetizationPills boosted /> : null}
                        {reserved > 0
                          ? t("forwardBoard.reserved", {
                              qty: reserved,
                              total: h.qtyExpected,
                            })
                          : null}
                      </>
                    ) : null
                  }
                  value={h.priceAmd != null ? `${formatAmd(h.priceAmd)} ֏` : undefined}
                  place={
                    <>
                      {h.village ? <VillageLink village={h.village} locale={locale} /> : null}
                      <span className="post-card-marz">{marzLabel(h.marz.slug)}</span>
                    </>
                  }
                />
              );
            })}
          </div>
        )}
      </HomeSection>

      <HomeSection
        action="sell"
        title={t("home.supplyTitle")}
        href="/supply"
        seeAllLabel={t("home.seeAll")}
        count={supplyCount}
      >
        {supplies.length === 0 ? (
          <EmptyFeed message={t("supplyBoard.empty")} href="/supply/new" label={t("common.add")} />
        ) : (
          <div className="listing-card-grid">
            {supplies.map((s) => (
              <PostCard
                key={s.id}
                href={`/supply/${s.id}`}
                title={s.title}
                thumb={parseImageUrls(s.imageUrls ?? "[]")[0]}
                icon={<ProductIcon slugOrKey={s.product.slug} size={28} />}
                categoryPill={t("nav.supply")}
                facts={[
                  formatQty(s.qtyAvailable, null, s.unit, (k) => t(k as "units.kg")),
                  s.readyInDays === 0
                    ? t("supply.readyNow")
                    : t("supply.readyIn", { days: s.readyInDays }),
                ]}
                badge={
                  supplyBoost.has(s.id) || supplyPro.has(s.userId) ? (
                    <MonetizationPills
                      boosted={supplyBoost.has(s.id)}
                      isPro={supplyPro.has(s.userId)}
                    />
                  ) : null
                }
                value={
                  s.priceAmd != null
                    ? formatPriceRange(s.priceAmd, s.priceAmd, s.unit, (k) => t(k as "common.amd"))
                    : undefined
                }
                place={
                  <>
                    {s.village ? <VillageLink village={s.village} locale={locale} /> : null}
                    <span className="post-card-marz">{marzLabel(s.marz.slug)}</span>
                  </>
                }
              />
            ))}
          </div>
        )}
      </HomeSection>

      <HomeSection
        action="buy"
        title={t("home.demandTitle")}
        href="/demand"
        seeAllLabel={t("home.seeAll")}
        count={demandCount}
      >
        {demands.length === 0 ? (
          <EmptyFeed message={t("demandBoard.empty")} href="/demand/new" label={t("common.add")} />
        ) : (
          <div className="listing-card-grid">
            {demands.map((d) => (
              <PostCard
                key={d.id}
                href={`/demand/${d.id}`}
                title={d.title}
                thumb={parseImageUrls(d.imageUrls ?? "[]")[0]}
                icon={<ProductIcon slugOrKey={d.product.slug} size={28} />}
                categoryPill={t("nav.demand")}
                facts={[
                  formatQty(d.qtyMin, d.qtyMax, d.unit, (k) => t(k as "units.kg")),
                  d.neededBy ? day(d.neededBy) : d.timingNote,
                ]}
                value={formatPriceRange(d.priceMinAmd, d.priceMaxAmd, d.unit, (k) =>
                  t(k as "common.amd"),
                )}
                place={
                  <>
                    {d.village ? <VillageLink village={d.village} locale={locale} /> : null}
                    <span className="post-card-marz">{marzLabel(d.marz.slug)}</span>
                  </>
                }
              />
            ))}
          </div>
        )}
      </HomeSection>

      <HomeSection
        action="machinery"
        title={t("home.machineryTitle")}
        href="/machinery"
        seeAllLabel={t("home.seeAll")}
        count={machineryCount}
      >
        {machinery.length === 0 ? (
          <EmptyFeed message={t("machineryBoard.empty")} href="/machinery/new" label={t("common.add")} />
        ) : (
          <div className="listing-card-grid">
            {machinery.map((m) => (
              <PostCard
                key={m.id}
                href={`/machinery/${m.id}`}
                title={m.title}
                thumb={parseImageUrls(m.imageUrls ?? "[]")[0]}
                icon={<ActionIcon action="machinery" size={28} />}
                categoryPill={t(`machineryTypes.${m.machineryType}` as "machineryTypes.TRACTOR")}
                facts={[`${m.make} ${m.model}`, marzLabel(m.marz.slug)]}
                badge={
                  <MonetizationPills
                    boosted={machBoost.has(m.id)}
                    isPro={machPro.has(m.userId)}
                  />
                }
                value={m.priceAmd != null ? `${formatAmd(m.priceAmd)} ֏` : undefined}
                place={
                  m.village ? (
                    <>
                      <VillageLink village={m.village} locale={locale} />
                      <span className="post-card-marz">{marzLabel(m.marz.slug)}</span>
                    </>
                  ) : (
                    <span className="post-card-marz">{marzLabel(m.marz.slug)}</span>
                  )
                }
              />
            ))}
          </div>
        )}
      </HomeSection>

      <HomeSection
        action="animals"
        title={t("home.animalsTitle")}
        href="/animals"
        seeAllLabel={t("home.seeAll")}
        count={animalCount}
      >
        {animals.length === 0 ? (
          <EmptyFeed message={t("animalsBoard.empty")} href="/animals/new" label={t("common.add")} />
        ) : (
          <div className="listing-card-grid">
            {animals.map((a) => (
              <PostCard
                key={a.id}
                href={`/animals/${a.id}`}
                title={a.title}
                thumb={parseImageUrls(a.imageUrls ?? "[]")[0]}
                icon={<ActionIcon action="animals" size={28} />}
                categoryPill={t(`animalTypes.${a.animalType}` as "animalTypes.COW")}
                facts={[a.breed, marzLabel(a.marz.slug)]}
                badge={
                  <MonetizationPills
                    boosted={animalBoost.has(a.id)}
                    isPro={animalPro.has(a.userId)}
                  />
                }
                value={a.priceAmd != null ? `${formatAmd(a.priceAmd)} ֏` : undefined}
                place={
                  a.village ? (
                    <>
                      <VillageLink village={a.village} locale={locale} />
                      <span className="post-card-marz">{marzLabel(a.marz.slug)}</span>
                    </>
                  ) : (
                    <span className="post-card-marz">{marzLabel(a.marz.slug)}</span>
                  )
                }
              />
            ))}
          </div>
        )}
      </HomeSection>

      <HomeSection
        action="orderJob"
        title={t("home.jobsTitle")}
        href="/jobs"
        seeAllLabel={t("home.seeAll")}
        count={jobCount}
      >
        {jobs.length === 0 ? (
          <EmptyFeed message={t("jobsBoard.empty")} href="/jobs/new" label={t("common.add")} />
        ) : (
          <div className="listing-card-grid">
            {jobs.map((j) => (
              <PostCard
                key={j.id}
                href={`/jobs/${j.id}`}
                title={j.title}
                icon={<JobTypeIcon type={j.jobType} size={28} />}
                categoryPill={t(`jobTypes.${j.jobType}` as "jobTypes.HARVEST")}
                facts={[
                  j.areaNote || (j.hectares != null ? `${j.hectares} ${t("farmos.ha")}` : null),
                  j.workDate ? day(j.workDate) : j.dateFrom ? day(j.dateFrom) : null,
                ]}
                value={j.budgetAmd != null ? `${formatAmd(j.budgetAmd)} ֏` : undefined}
                place={
                  <>
                    {j.village ? <VillageLink village={j.village} locale={locale} /> : null}
                    <span className="post-card-marz">{marzLabel(j.marz.slug)}</span>
                  </>
                }
              />
            ))}
          </div>
        )}
      </HomeSection>

      <HomeSection
        action="groupBuy"
        title={t("home.groupBuyTitle")}
        href="/group-buy"
        seeAllLabel={t("home.seeAll")}
        count={campaignCount}
      >
        {campaigns.length === 0 ? (
          <EmptyFeed message={t("groupBuy.empty")} href="/group-buy" label={t("common.open")} />
        ) : (
          <div className="listing-card-grid">
            {campaigns.map((c) => {
              const joinedQty = c.joins.reduce((s, j) => s + j.qty, 0);
              const pct = Math.min(100, Math.round((joinedQty / c.targetQty) * 100));
              return (
                <PostCard
                  key={c.id}
                  href="/group-buy"
                  title={c.title}
                  icon={<ProductIcon slugOrKey={c.product.slug} size={28} />}
                  categoryPill={t("nav.groupBuy")}
                  facts={[t("home.participants", { n: c.joins.length }), c.deadline ? day(c.deadline) : null]}
                  progress={{
                    pct,
                    label: t("groupBuy.progress", {
                      joined: formatAmd(joinedQty),
                      target: formatAmd(c.targetQty),
                      unit: t(`units.${c.unit}` as "units.kg"),
                    }),
                  }}
                  value={
                    c.pricePerUnitAmd != null ? `~${formatAmd(c.pricePerUnitAmd)} ֏` : undefined
                  }
                  place={
                    c.marz ? <span className="post-card-marz">{marzLabel(c.marz.slug)}</span> : null
                  }
                />
              );
            })}
          </div>
        )}
      </HomeSection>

      <Reveal as="section" className="section home-pricing-cta">
        <div className="home-pricing-cta-inner">
          <div>
            <p className="eyebrow">{t("nav.pricing")}</p>
            <h2>{t("home.pricingCtaTitle")}</h2>
            <p className="lede">{t("home.pricingCtaLede")}</p>
          </div>
          <div className="grow-cta-row">
            <PrefetchLink href="/pricing" className="btn primary" pressable>
              {t("home.pricingCtaButton")}
            </PrefetchLink>
            <PrefetchLink href={session ? "/forward" : "/auth/register"} className="btn ghost" pressable>
              {session ? t("nav.forward") : t("nav.register")}
            </PrefetchLink>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function loadPlots(userId: string) {
  return safeQuery(
    () =>
      prisma.plot.findMany({
        where: { userId, status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          hectares: true,
          marzId: true,
          cropProduct: { select: { slug: true } },
          marz: { select: { slug: true } },
          yieldEstimate: true,
          tasks: {
            where: { status: "OPEN" },
            orderBy: { priority: "desc" },
            take: 4,
            select: { id: true, title: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
    [],
  );
}

type RecommendedEntry = {
  key: string;
  score: number;
  card: ComponentProps<typeof PostCard>;
};

function buildRecommended({
  machinery,
  animals,
  supplies,
  machBoost,
  animalBoost,
  supplyBoost,
  machPro,
  animalPro,
  supplyPro,
  marzLabel,
  locale,
  t,
}: {
  machinery: Array<{
    id: string;
    userId: string;
    title: string;
    machineryType: string;
    make: string;
    model: string;
    priceAmd: number | null;
    imageUrls: string | null;
    marz: { slug: string };
    village?: Parameters<typeof VillageLink>[0]["village"] | null;
  }>;
  animals: Array<{
    id: string;
    userId: string;
    title: string;
    animalType: string;
    breed: string;
    priceAmd: number | null;
    imageUrls: string | null;
    marz: { slug: string };
    village?: Parameters<typeof VillageLink>[0]["village"] | null;
  }>;
  supplies: Array<{
    id: string;
    userId: string;
    title: string;
    priceAmd: number | null;
    imageUrls: string | null;
    qtyAvailable: number;
    unit: string;
    product: { slug: string; nameKey: string };
    marz: { slug: string };
    village?: Parameters<typeof VillageLink>[0]["village"] | null;
  }>;
  machBoost: Map<string, Date>;
  animalBoost: Map<string, Date>;
  supplyBoost: Map<string, Date>;
  machPro: Set<string>;
  animalPro: Set<string>;
  supplyPro: Set<string>;
  marzLabel: (slug: string) => string;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations>>;
}): RecommendedEntry[] {
  const items: RecommendedEntry[] = [];

  const pushMachinery = (m: (typeof machinery)[number], score: number) => {
    const boosted = machBoost.has(m.id);
    items.push({
      key: `m-${m.id}`,
      score,
      card: {
        href: `/machinery/${m.id}`,
        title: m.title,
        thumb: parseImageUrls(m.imageUrls ?? "[]")[0],
        icon: <ActionIcon action="machinery" size={28} />,
        categoryPill: t(`machineryTypes.${m.machineryType}` as "machineryTypes.TRACTOR"),
        facts: [`${m.make} ${m.model}`],
        value: m.priceAmd != null ? `${formatAmd(m.priceAmd, locale)} ֏` : undefined,
        badge: (
          <MonetizationPills boosted={boosted} isPro={machPro.has(m.userId)} />
        ),
        place: m.village ? (
          <>
            <VillageLink village={m.village} locale={locale} />
            <span className="post-card-marz">{marzLabel(m.marz.slug)}</span>
          </>
        ) : (
          <span className="post-card-marz">{marzLabel(m.marz.slug)}</span>
        ),
      },
    });
  };

  for (const m of machinery) {
    const boosted = machBoost.has(m.id);
    const isPro = machPro.has(m.userId);
    if (boosted || isPro) pushMachinery(m, boosted ? 3 : 1);
  }

  for (const a of animals) {
    const boosted = animalBoost.has(a.id);
    const isPro = animalPro.has(a.userId);
    if (!boosted && !isPro) continue;
    items.push({
      key: `a-${a.id}`,
      score: boosted ? 3 : 1,
      card: {
        href: `/animals/${a.id}`,
        title: a.title,
        thumb: parseImageUrls(a.imageUrls ?? "[]")[0],
        icon: <ActionIcon action="animals" size={28} />,
        categoryPill: t(`animalTypes.${a.animalType}` as "animalTypes.COW"),
        facts: [a.breed],
        value: a.priceAmd != null ? `${formatAmd(a.priceAmd, locale)} ֏` : undefined,
        badge: <MonetizationPills boosted={boosted} isPro={isPro} />,
        place: a.village ? (
          <>
            <VillageLink village={a.village} locale={locale} />
            <span className="post-card-marz">{marzLabel(a.marz.slug)}</span>
          </>
        ) : (
          <span className="post-card-marz">{marzLabel(a.marz.slug)}</span>
        ),
      },
    });
  }

  for (const s of supplies) {
    const boosted = supplyBoost.has(s.id);
    const isPro = supplyPro.has(s.userId);
    if (!boosted && !isPro) continue;
    items.push({
      key: `s-${s.id}`,
      score: boosted ? 3 : 1,
      card: {
        href: `/supply/${s.id}`,
        title: s.title,
        thumb: parseImageUrls(s.imageUrls ?? "[]")[0],
        icon: <ProductIcon slugOrKey={s.product.slug} size={28} />,
        categoryPill: t(s.product.nameKey as "products.tomato"),
        facts: [formatQty(s.qtyAvailable, null, s.unit, (k) => t(k as "units.kg"))],
        value:
          s.priceAmd != null
            ? formatPriceRange(s.priceAmd, s.priceAmd, s.unit, (k) => t(k as "common.amd"))
            : undefined,
        badge: <MonetizationPills boosted={boosted} isPro={isPro} />,
        place: s.village ? (
          <>
            <VillageLink village={s.village} locale={locale} />
            <span className="post-card-marz">{marzLabel(s.marz.slug)}</span>
          </>
        ) : (
          <span className="post-card-marz">{marzLabel(s.marz.slug)}</span>
        ),
      },
    });
  }

  if (items.length === 0) {
    sortByMonetization(
      machinery as Array<{ id: string; userId: string }>,
      machBoost,
      machPro,
    )
      .slice(0, 3)
      .forEach((m) => pushMachinery(m as (typeof machinery)[number], machBoost.has(m.id) ? 2 : 0));

    sortByMonetization(
      animals as Array<{ id: string; userId: string }>,
      animalBoost,
      animalPro,
    )
      .slice(0, 2)
      .forEach((a) => {
        const row = a as (typeof animals)[number];
        items.push({
          key: `a-${row.id}`,
          score: animalBoost.has(row.id) ? 2 : 0,
          card: {
            href: `/animals/${row.id}`,
            title: row.title,
            thumb: parseImageUrls(row.imageUrls ?? "[]")[0],
            icon: <ActionIcon action="animals" size={28} />,
            categoryPill: t(`animalTypes.${row.animalType}` as "animalTypes.COW"),
            facts: [row.breed],
            value: row.priceAmd != null ? `${formatAmd(row.priceAmd, locale)} ֏` : undefined,
            place: row.village ? (
              <>
                <VillageLink village={row.village} locale={locale} />
                <span className="post-card-marz">{marzLabel(row.marz.slug)}</span>
              </>
            ) : (
              <span className="post-card-marz">{marzLabel(row.marz.slug)}</span>
            ),
          },
        });
      });

    sortByMonetization(
      supplies as Array<{ id: string; userId: string }>,
      supplyBoost,
      supplyPro,
    )
      .slice(0, 2)
      .forEach((s) => {
        const row = s as (typeof supplies)[number];
        items.push({
          key: `s-${row.id}`,
          score: supplyBoost.has(row.id) ? 2 : 0,
          card: {
            href: `/supply/${row.id}`,
            title: row.title,
            thumb: parseImageUrls(row.imageUrls ?? "[]")[0],
            icon: <ProductIcon slugOrKey={row.product.slug} size={28} />,
            categoryPill: t(row.product.nameKey as "products.tomato"),
            facts: [formatQty(row.qtyAvailable, null, row.unit, (k) => t(k as "units.kg"))],
            value:
              row.priceAmd != null
                ? formatPriceRange(row.priceAmd, row.priceAmd, row.unit, (k) =>
                    t(k as "common.amd"),
                  )
                : undefined,
            place: row.village ? (
              <>
                <VillageLink village={row.village} locale={locale} />
                <span className="post-card-marz">{marzLabel(row.marz.slug)}</span>
              </>
            ) : (
              <span className="post-card-marz">{marzLabel(row.marz.slug)}</span>
            ),
          },
        });
      });
  }

  return items.sort((a, b) => b.score - a.score).slice(0, 10);
}

function EmptyFeed({
  message,
  href,
  label,
}: {
  message: string;
  href: string;
  label: string;
}) {
  return (
    <div className="empty-state-cta empty-state--polished">
      <span className="empty-state-motif" aria-hidden />
      <p>{message}</p>
      <Link href={href} className="btn primary">
        {label}
      </Link>
    </div>
  );
}
