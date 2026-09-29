import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { formatAmd, formatPriceRange, formatQty, parseImageUrls } from "@/lib/utils";
import { upcomingSupplyWhere } from "@/lib/upcoming-supply";
import { ProductIcon } from "@/components/AgIcons";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ClassifiedRow } from "@/components/ClassifiedRow";
import { EmptyState } from "@/components/EmptyState";
import { VillageLink } from "@/components/VillageLink";
import { TrustedPill } from "@/components/FarmScoreBadge";
import { MonetizationPills } from "@/components/MonetizationBadges";
import { getFarmScoreSnippets, TRUSTED_SCORE_MIN } from "@/lib/farm-score";
import {
  getActiveBoostMap,
  getProUserIds,
  sortByMonetization,
} from "@/lib/monetization";
import { getProducts } from "@/lib/products";

import { seoMessagesMetadata } from "@/lib/seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return seoMessagesMetadata(locale, "/forward", "forward");
}

export const dynamic = "force-dynamic";
export default async function ForwardBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ trusted?: string; marz?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  const trustedOnly = sp.trusted === "1" || sp.trusted === "true";

  const [crops, upcomingSupplies] = await Promise.all([
    prisma.futureHarvest.findMany({
      where: {
        status: "ACTIVE",
        ...(sp.marz ? { marzId: sp.marz } : {}),
      },
      include: {
        product: true,
        marz: true,
        village: true,
        plot: true,
        preOffers: { where: { status: { in: ["SENT", "RESERVED"] } } },
      },
      orderBy: { harvestDate: "asc" },
    }),
    prisma.supply.findMany({
      where: upcomingSupplyWhere(sp.marz ? { marzId: sp.marz } : undefined),
      include: {
        product: true,
        marz: true,
        village: true,
      },
      orderBy: { readyInDays: "asc" },
    }),
  ]);

  const userIds = [
    ...crops.map((c) => c.userId),
    ...upcomingSupplies.map((s) => s.userId),
  ];
  const [snippets, harvestBoost, supplyBoost, proIds] = await Promise.all([
    getFarmScoreSnippets(userIds),
    getActiveBoostMap(
      "FUTURE_HARVEST",
      crops.map((c) => c.id),
    ),
    getActiveBoostMap(
      "SUPPLY",
      upcomingSupplies.map((s) => s.id),
    ),
    getProUserIds(userIds),
  ]);
  const boostMap = new Map([...harvestBoost, ...supplyBoost]);

  const now = Date.now();
  const dayMs = 86_400_000;
  const board = [
    ...crops.map((c) => ({
      kind: "harvest" as const,
      id: c.id,
      userId: c.userId,
      at: c.harvestDate.getTime(),
      c,
    })),
    ...upcomingSupplies.map((s) => ({
      kind: "supply" as const,
      id: s.id,
      userId: s.userId,
      at: now + s.readyInDays * dayMs,
      s,
    })),
  ].sort((a, b) => a.at - b.at);

  let ranked = sortByMonetization(board, boostMap, proIds);
  if (trustedOnly) {
    ranked = ranked.filter((r) => snippets.get(r.userId)?.trusted ?? false);
  }

  const demandByProduct = await prisma.demand.groupBy({
    by: ["productId"],
    where: { status: "ACTIVE" },
    _count: true,
  });
  const products = await getProducts();
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  return (
    <div className="section page-board">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { label: t("forwardBoard.title") },
        ]}
      />
      <div className="section-head">
        <div>
          <h1>{t("forwardBoard.title")}</h1>
          <p className="lede">{t("forwardBoard.lede")}</p>
        </div>
        <div className="section-head-actions">
          <Link href="/supply" className="btn ghost">
            {t("nav.supply")}
          </Link>
          <Link href="/forward/new" className="btn primary">
            {t("common.add")}
          </Link>
        </div>
      </div>

      <div className="trust-filter-row">
        <Link href="/forward" className={!trustedOnly ? "active" : undefined}>
          {t("farmPassport.filterAll")}
        </Link>
        <Link
          href="/forward?trusted=1"
          className={trustedOnly ? "active" : undefined}
        >
          {t("farmPassport.filterTrusted", { min: TRUSTED_SCORE_MIN })}
        </Link>
      </div>

      {demandByProduct.length > 0 ? (
        <section className="match-section compact-section">
          <h2>{t("forwardBoard.dashboard")}</h2>
          <div className="classified-list">
            {demandByProduct.map((row) => {
              const p = productMap[row.productId];
              if (!p) return null;
              const offered =
                crops
                  .filter((c) => c.productId === row.productId)
                  .reduce((s, c) => s + c.qtyExpected, 0) +
                upcomingSupplies
                  .filter((s) => s.productId === row.productId)
                  .reduce((s, c) => s + c.qtyAvailable, 0);
              return (
                <ClassifiedRow
                  key={row.productId}
                  href={`/demand?product=${p.slug}`}
                  title={t(p.nameKey as "products.tomato")}
                  meta={`${t("forwardBoard.buyersSeek", { n: row._count })} · ${t("forwardBoard.offered", { qty: offered })}`}
                  icon={<ProductIcon slugOrKey={p.slug} size={20} />}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      {ranked.length === 0 ? (
        <EmptyState
          message={t("forwardBoard.empty")}
          actionHref="/forward/new"
          actionLabel={t("common.add")}
        />
      ) : (
        <div className="classified-list">
          {ranked.map((row) => {
            const sn = snippets.get(row.userId);
            const farmScore = sn?.score ?? null;
            const trusted = sn?.trusted ?? false;
            const boosted = boostMap.has(row.id);
            const isPro = proIds.has(row.userId);
            const badge = (
              <>
                <MonetizationPills isPro={isPro} boosted={boosted} />
                {trusted && farmScore != null ? <TrustedPill score={farmScore} /> : null}
              </>
            );

            if (row.kind === "supply") {
              const s = row.s;
              const marzLabel = t(`marzes.${s.marz.slug}` as "marzes.Yerevan");
              const meta = [
                t(s.product.nameKey as "products.tomato"),
                formatQty(s.qtyAvailable, null, s.unit, (k) => t(k as "units.kg")),
                t("supply.readyIn", { days: s.readyInDays }),
                s.village ? null : marzLabel,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <ClassifiedRow
                  key={`supply-${s.id}`}
                  href={`/supply/${s.id}`}
                  title={s.title}
                  productNameKey={s.product.nameKey}
                  meta={meta}
                  value={
                    s.priceAmd != null
                      ? formatPriceRange(s.priceAmd, s.priceAmd, s.unit, (k) =>
                          t(k as "common.amd"),
                        )
                      : undefined
                  }
                  thumb={parseImageUrls(s.imageUrls)[0]}
                  icon={<ProductIcon slugOrKey={s.product.slug} size={20} />}
                  badge={badge}
                  place={
                    s.village ? (
                      <>
                        <VillageLink village={s.village} locale={locale} />
                        <span className="classified-marz">{marzLabel}</span>
                      </>
                    ) : null
                  }
                />
              );
            }

            const c = row.c;
            const reserved = c.preOffers.reduce((s, i) => s + i.qtyWanted, 0);
            const marzLabel = t(`marzes.${c.marz.slug}` as "marzes.Yerevan");
            const meta = [
              t(c.product.nameKey as "products.tomato"),
              `${formatAmd(c.qtyExpected)} ${t(`units.${c.unit}` as "units.kg")}`,
              c.harvestDate.toISOString().slice(0, 10),
              c.village ? null : marzLabel,
              c.plot ? c.plot.name : null,
              t("forwardBoard.reserved", { qty: reserved, total: c.qtyExpected }),
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <ClassifiedRow
                key={`harvest-${c.id}`}
                href={`/forward/${c.id}`}
                title={c.title}
                productNameKey={c.product.nameKey}
                meta={meta}
                value={c.priceAmd != null ? `${formatAmd(c.priceAmd)} ֏` : undefined}
                thumb={parseImageUrls(c.imageUrls)[0]}
                icon={<ProductIcon slugOrKey={c.product.slug} size={20} />}
                badge={badge}
                place={
                  c.village ? (
                    <>
                      <VillageLink village={c.village} locale={locale} />
                      <span className="classified-marz">{marzLabel}</span>
                    </>
                  ) : null
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
