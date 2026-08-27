import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ActionIcon, JobTypeIcon, ProductIcon } from "@/components/AgIcons";
import { ClassifiedRow } from "@/components/ClassifiedRow";
import { HomeSection } from "@/components/HomeSection";
import { OverproductionSignal, signalLabel } from "@/components/OverproductionSignal";
import { PostCard } from "@/components/PostCard";
import { Reveal } from "@/components/Reveal";
import { SearchBar } from "@/components/SearchBar";
import { VillageLink } from "@/components/VillageLink";
import { resolveTaskCopy } from "@/lib/task-copy";
import { fetchMarzWeather } from "@/lib/weather";
import { formatAmd, formatPriceRange, formatQty, parseImageUrls } from "@/lib/utils";
import { effectiveTons } from "@/lib/yield";
import { getCropRankings } from "@/lib/exchange";
import {
  getActiveBoostMap,
  getProUserIds,
  sortByMonetization,
} from "@/lib/monetization";
import { MonetizationPills } from "@/components/MonetizationBadges";

const CATEGORIES = [
  { href: "/grow", action: "grow", labelKey: "menu.grow" as const },
  { href: "/plots", action: "plot", labelKey: "menu.plots" as const },
  { href: "/forward", action: "forward", labelKey: "menu.forward" as const },
  { href: "/demand", action: "buy", labelKey: "menu.buy" as const },
  { href: "/machinery", action: "machinery", labelKey: "menu.machinery" as const },
  { href: "/animals", action: "animals", labelKey: "menu.animals" as const },
  { href: "/jobs", action: "orderJob", labelKey: "menu.jobs" as const },
  { href: "/shop/fertilizers", action: "fertilizers", labelKey: "menu.fertilizers" as const },
] as const;

const FEED_TAKE = 6;
const FEED_FETCH = 24;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();

  const [
    rankings,
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
  ] = await Promise.all([
    getCropRankings(),
    prisma.futureHarvest.findMany({
      where: { status: "ACTIVE" },
      include: { product: true, marz: true, village: true, preOffers: true },
      orderBy: { harvestDate: "asc" },
      take: FEED_FETCH,
    }),
    prisma.supply.findMany({
      where: { status: "ACTIVE" },
      include: { product: true, marz: true, village: true },
      orderBy: { createdAt: "desc" },
      take: FEED_FETCH,
    }),
    prisma.demand.findMany({
      where: { status: "ACTIVE" },
      include: { product: true, marz: true, village: true },
      orderBy: { createdAt: "desc" },
      take: FEED_TAKE,
    }),
    prisma.jobRequest.findMany({
      where: { status: "ACTIVE" },
      include: { marz: true, village: true },
      orderBy: { createdAt: "desc" },
      take: FEED_TAKE,
    }),
    prisma.groupBuyCampaign.findMany({
      where: { status: { in: ["OPEN", "QUOTED"] } },
      include: { product: true, marz: true, joins: { where: { status: "JOINED" } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.machineryListing.findMany({
      where: { status: "ACTIVE" },
      include: { marz: true, village: true },
      orderBy: { createdAt: "desc" },
      take: FEED_FETCH,
    }),
    prisma.animalListing.findMany({
      where: { status: "ACTIVE" },
      include: { marz: true, village: true },
      orderBy: { createdAt: "desc" },
      take: FEED_FETCH,
    }),
    prisma.futureHarvest.count({ where: { status: "ACTIVE" } }),
    prisma.supply.count({ where: { status: "ACTIVE" } }),
    prisma.demand.count({ where: { status: "ACTIVE" } }),
    prisma.jobRequest.count({ where: { status: "ACTIVE" } }),
    prisma.groupBuyCampaign.count({ where: { status: { in: ["OPEN", "QUOTED"] } } }),
    prisma.machineryListing.count({ where: { status: "ACTIVE" } }),
    prisma.animalListing.count({ where: { status: "ACTIVE" } }),
  ]);

  const [harvestBoost, supplyBoost, machBoost, animalBoost] = await Promise.all([
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
  ]);
  const [harvestPro, supplyPro, machPro, animalPro] = await Promise.all([
    getProUserIds(harvestsRaw.map((h) => h.userId)),
    getProUserIds(suppliesRaw.map((s) => s.userId)),
    getProUserIds(machineryRaw.map((m) => m.userId)),
    getProUserIds(animalsRaw.map((a) => a.userId)),
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

  let plots: Awaited<ReturnType<typeof loadPlots>> = [];
  let weatherSummary: string | null = null;
  if (session?.user?.id) {
    plots = await loadPlots(session.user.id);
    if (plots[0]) {
      weatherSummary = (await fetchMarzWeather(plots[0].marzId, locale)).summary;
    }
  }

  const openTasks = plots.flatMap((p) =>
    p.tasks.map((task) => ({
      plotId: p.id,
      plotName: p.name,
      taskId: task.id,
      title: task.title,
    }))
  );

  const overExample = rankings.find((r) => r.signal === "OVER") || null;
  const underExample = rankings.find((r) => r.signal === "UNDER") || null;
  const highlight = overExample || underExample || rankings[0] || null;

  const marzLabel = (slug: string) => t(`marzes.${slug}` as "marzes.Yerevan");
  const day = (d: Date) => d.toISOString().slice(0, 10);
  const postHref = session ? (plots.length === 0 ? "/plots/new" : "/forward/new") : "/auth/register";

  return (
    <div className="home-listam">
      <section className="home-search-block motion-hero">
        <div className="home-search-inner animate-rise">
          <h1 className="sr-only">{t("brand")}</h1>
          <SearchBar large />
          <Link href={postHref} className="btn primary home-post-btn">
            {t("nav.post")}
          </Link>
        </div>
        <p className="home-welcome muted animate-fade-delay">
          {session
            ? `${t("dashboard.greeting", { name: session.user?.name || "" })}${weatherSummary ? ` · ${weatherSummary}` : ""}`
            : t("tagline")}
        </p>
      </section>

      <section className="section home-categories">
        <div className="category-icon-grid motion-chip-stagger">
          {CATEGORIES.map((cat) => (
            <Link key={cat.labelKey} href={cat.href} className="category-icon-tile">
              <span className={`cat-icon action-${cat.action}`} aria-hidden>
                <ActionIcon action={cat.action} size={26} />
              </span>
              <span>{t(cat.labelKey)}</span>
            </Link>
          ))}
        </div>
      </section>

      <Reveal as="section" className="section home-grow-spotlight" stagger>
        <div className="grow-spotlight-card">
          <div className="grow-spotlight-copy">
            <p className="eyebrow">{t("grow.eyebrow")}</p>
            <h2>{t("grow.homeHeadline")}</h2>
            <p className="lede">{t("grow.homeLede")}</p>
            <div className="grow-cta-row">
              <Link href="/grow" className="btn primary">
                {t("grow.ctaBoard")}
              </Link>
              <Link href={session ? "/plots/new" : "/auth/register"} className="btn ghost">
                {t("grow.ctaPlot")}
              </Link>
            </div>
          </div>
          {highlight ? (
            <div className="grow-spotlight-signal">
              <OverproductionSignal
                row={highlight}
                t={(k, v) => t(k as "grow.signalOverTitle", v)}
                locale={locale}
                compact
                showMethod={false}
              />
            </div>
          ) : null}
        </div>

        {rankings.length > 0 ? (
          <ol className="crop-rank-list home-rank">
            {rankings.slice(0, 5).map((r, i) => (
              <li key={r.productId}>
                <Link href={`/grow?crop=${r.productId}`} className="rank-link">
                  <span className="rank-n">{i + 1}</span>
                  <ProductIcon slugOrKey={r.slug} size={20} />
                  <span className="rank-body">
                    <strong>{t(r.nameKey as "products.tomato")}</strong>
                    <em>
                      {r.demandTons} {t("units.ton")} · {r.buyerCount} {t("grow.buyers")}
                      {r.avgPriceAmdPerKg != null
                        ? ` · ~${formatAmd(r.avgPriceAmdPerKg, locale)} ֏/${t("units.kg")}`
                        : ""}
                    </em>
                  </span>
                  <span className={`signal-chip is-${r.signal.toLowerCase()} signal-pulse-once`}>
                    {signalLabel(r.signal, (k, v) => t(k as "grow.chipOver", v))}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : null}
      </Reveal>

      {session ? (
        <Reveal as="section" className="section home-farm-strip" id="today">
          <div className="home-feed-head">
            <h2>
              <span className="home-feed-icon action-today" aria-hidden>
                <ActionIcon action="today" size={20} />
              </span>
              {t("today.title")}
            </h2>
            <Link href="/plots" className="text-link home-feed-more">
              {t("plots.title")} →
            </Link>
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
                  <Link key={p.id} href={`/plots/${p.id}`} className="plot-chip">
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
                  </Link>
                );
              })}
            </div>
          ) : null}
        </Reveal>
      ) : (
        <Reveal as="section" className="section home-feature-row" stagger>
          <Link href="/auth/login" className="feature-tile feature-today">
            <span className="feature-tile-icon" aria-hidden>
              <ActionIcon action="today" size={32} />
            </span>
            <strong>{t("menu.today")}</strong>
            <span>{t("menu.todayDesc")}</span>
          </Link>
          <Link href="/grow" className="feature-tile feature-forward">
            <span className="feature-tile-icon" aria-hidden>
              <ActionIcon action="grow" size={32} />
            </span>
            <strong>{t("menu.grow")}</strong>
            <span>{t("menu.growDesc")}</span>
          </Link>
        </Reveal>
      )}

      <HomeSection
        action="forward"
        title={t("home.forwardTitle")}
        href="/forward"
        seeAllLabel={t("home.seeAll")}
        count={harvestCount}
      >
        {harvests.length === 0 ? (
          <EmptyFeed message={t("forwardBoard.empty")} href="/forward/new" label={t("common.add")} />
        ) : (
          <div className="post-grid">
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
                  icon={<ProductIcon slugOrKey={h.product.slug} size={22} />}
                  facts={[
                    t(h.product.nameKey as "products.tomato"),
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
          <div className="post-grid">
            {supplies.map((s) => (
              <PostCard
                key={s.id}
                href={`/supply/${s.id}`}
                title={s.title}
                thumb={parseImageUrls(s.imageUrls)[0]}
                icon={<ProductIcon slugOrKey={s.product.slug} size={22} />}
                facts={[
                  t(s.product.nameKey as "products.tomato"),
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
          <div className="post-grid">
            {demands.map((d) => (
              <PostCard
                key={d.id}
                href={`/demand/${d.id}`}
                title={d.title}
                icon={<ProductIcon slugOrKey={d.product.slug} size={22} />}
                facts={[
                  t(d.product.nameKey as "products.tomato"),
                  formatQty(d.qtyMin, d.qtyMax, d.unit, (k) => t(k as "units.kg")),
                  d.neededBy ? day(d.neededBy) : d.timingNote,
                ]}
                value={formatPriceRange(d.priceMinAmd, d.priceMaxAmd, d.unit, (k) =>
                  t(k as "common.amd")
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
          <div className="classified-list">
            {machinery.map((m) => (
              <ClassifiedRow
                key={m.id}
                href={`/machinery/${m.id}`}
                title={m.title}
                meta={`${t(`machineryTypes.${m.machineryType}` as "machineryTypes.TRACTOR")} · ${m.make} ${m.model} · ${marzLabel(m.marz.slug)}`}
                value={m.priceAmd != null ? `${formatAmd(m.priceAmd)} ֏` : undefined}
                thumb={parseImageUrls(m.imageUrls)[0]}
                icon={<ActionIcon action="machinery" size={20} />}
                badge={
                  <MonetizationPills
                    boosted={machBoost.has(m.id)}
                    isPro={machPro.has(m.userId)}
                  />
                }
                place={
                  m.village ? <VillageLink village={m.village} locale={locale} /> : undefined
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
          <div className="classified-list">
            {animals.map((a) => (
              <ClassifiedRow
                key={a.id}
                href={`/animals/${a.id}`}
                title={a.title}
                meta={`${t(`animalTypes.${a.animalType}` as "animalTypes.COW")} · ${a.breed} · ${marzLabel(a.marz.slug)}`}
                value={a.priceAmd != null ? `${formatAmd(a.priceAmd)} ֏` : undefined}
                thumb={parseImageUrls(a.imageUrls)[0]}
                icon={<ActionIcon action="animals" size={20} />}
                badge={
                  <MonetizationPills
                    boosted={animalBoost.has(a.id)}
                    isPro={animalPro.has(a.userId)}
                  />
                }
                place={
                  a.village ? <VillageLink village={a.village} locale={locale} /> : undefined
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
          <div className="post-grid">
            {jobs.map((j) => (
              <PostCard
                key={j.id}
                href={`/jobs/${j.id}`}
                title={j.title}
                icon={<JobTypeIcon type={j.jobType} size={22} />}
                facts={[
                  t(`jobTypes.${j.jobType}` as "jobTypes.HARVEST"),
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
          <div className="post-grid">
            {campaigns.map((c) => {
              const joinedQty = c.joins.reduce((s, j) => s + j.qty, 0);
              const pct = Math.min(100, Math.round((joinedQty / c.targetQty) * 100));
              return (
                <PostCard
                  key={c.id}
                  href="/group-buy"
                  title={c.title}
                  icon={<ProductIcon slugOrKey={c.product.slug} size={22} />}
                  facts={[
                    t("home.participants", { n: c.joins.length }),
                    c.deadline ? day(c.deadline) : null,
                  ]}
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
            <Link href="/pricing" className="btn primary">
              {t("home.pricingCtaButton")}
            </Link>
            <Link href={session ? "/forward" : "/auth/register"} className="btn ghost">
              {session ? t("nav.forward") : t("nav.register")}
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function loadPlots(userId: string) {
  return prisma.plot.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      cropProduct: true,
      marz: true,
      village: true,
      yieldEstimate: true,
      tasks: { where: { status: "OPEN" }, orderBy: { priority: "desc" }, take: 4 },
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });
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
    <div className="empty-state-cta">
      <p>{message}</p>
      <Link href={href} className="btn primary">
        {label}
      </Link>
    </div>
  );
}
