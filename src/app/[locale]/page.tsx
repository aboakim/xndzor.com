import { getTranslations, setRequestLocale } from "next-intl/server";
import nextDynamic from "next/dynamic";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { getSession } from "@/lib/session";
import { ActionIcon, JobTypeIcon, ProductIcon } from "@/components/AgIcons";
import { CategoryScroll } from "@/components/CategoryScroll";
import { ClassifiedRow } from "@/components/ClassifiedRow";
import { HomeSection } from "@/components/HomeSection";
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
import { HomeStripSkeleton } from "@/components/HomeBannerSkeleton";
import { PrefetchLink } from "@/components/PrefetchLink";
import { HomeMoreFeeds } from "@/components/HomeMoreFeeds";

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

const RecentlyViewedStrip = nextDynamic(
  () =>
    import("@/components/RecentlyViewedStrip").then((m) => ({
      default: m.RecentlyViewedStrip,
    })),
);

/**
 * Homepage categories: Top 5 first, then a few farm helpers.
 * Shop & niche sections stay in Բաժիններ mega menu — not a wall of icons.
 */
const CATEGORIES = [
  { href: "/supply", action: "sell", labelKey: "menu.sellNow" as const },
  { href: "/demand", action: "buy", labelKey: "menu.buy" as const },
  { href: "/forward", action: "forward", labelKey: "menu.forward" as const },
  { href: "/group-buy", action: "groupBuy", labelKey: "menu.groupBuy" as const },
  { href: "/grow", action: "grow", labelKey: "menu.grow" as const },
  { href: "/jobs", action: "orderJob", labelKey: "menu.jobs" as const },
  { href: "/machinery", action: "machinery", labelKey: "menu.machinery" as const },
  { href: "/animals", action: "animals", labelKey: "menu.animals" as const },
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
    harvestCount,
    supplyCount,
    demandCount,
    jobCount,
    campaignCount,
    machineryCount,
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
    fetchMarzWeather("Ararat", locale),
  ]);

  const [harvestBoost, supplyBoost, machBoost, harvestPro, supplyPro, machPro, plots] =
    await Promise.all([
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
      getProUserIds(harvestsRaw.map((h) => h.userId)),
      getProUserIds(suppliesRaw.map((s) => s.userId)),
      getProUserIds(machineryRaw.map((m) => m.userId)),
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

  return (
    <div className="home-vendo home-vendo-clean home-vendo-banners home-vendo-cockpit home-village">
      <p className="home-welcome-line home-purpose animate-fade">{t("home.purpose")}</p>

      <section className="section home-categories-scroll home-categories-primary" aria-label={t("home.chooseAction")}>
        <CategoryScroll items={categoryItems} />
      </section>

      <Reveal as="section" className="section home-early-bird" delayMs={20}>
        <EarlyBirdBanner variant="strip" />
      </Reveal>

      <Reveal as="section" className="section home-trust-banner" delayMs={40}>
        <WelcomeTrustBanner />
      </Reveal>

      <XndzorHero greeting={heroGreeting} />

      <HomeSection
        action="sell"
        className="home-feed--sell"
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
        className="home-feed--buy"
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
        action="groupBuy"
        className="home-feed--group-buy"
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

      <Reveal as="div" className="section home-promo-slider" delayMs={60}>
        <HeroPromoSlider />
      </Reveal>

      <HomeMoreFeeds label={t("home.moreFeeds")}>
      <HomeSection
        action="forward"
        className="home-feed--forward"
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

      <RecentlyViewedStrip />

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
      ) : null}

      <HomeSection
        action="orderJob"
        className="home-feed--jobs"
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
        action="machinery"
        className="home-feed--machinery"
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
      </HomeMoreFeeds>
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
