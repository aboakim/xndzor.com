import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GrowExchangeClient } from "@/components/GrowExchangeClient";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  getBuyerKindBreakdown,
  getCropRankings,
  getMarzBalances,
  getMatchLists,
} from "@/lib/exchange";

import { seoMessagesMetadata } from "@/lib/seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return seoMessagesMetadata(locale, "/grow", "grow");
}

export default async function GrowPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ crop?: string }>;
}) {
  const { locale } = await params;
  const { crop } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();

  const rankings = await getCropRankings();
  const productId =
    crop && rankings.some((r) => r.productId === crop)
      ? crop
      : rankings.find((r) => r.slug === crop)?.productId ||
        rankings[0]?.productId ||
        null;

  const [balances, matches, kindBreakdown] = await Promise.all([
    productId ? getMarzBalances(productId) : Promise.resolve([]),
    productId
      ? getMatchLists(productId)
      : Promise.resolve({ harvests: [], demands: [] }),
    productId ? getBuyerKindBreakdown(productId) : Promise.resolve([]),
  ]);

  return (
    <div className="section grow-page">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { label: t("grow.title") },
        ]}
      />
      <header className="grow-hero">
        <p className="eyebrow">{t("grow.eyebrow")}</p>
        <h1>{t("grow.title")}</h1>
        <p className="lede">{t("grow.lede")}</p>
        <div className="grow-cta-row">
          <Link href="/plots/new" className="btn primary">
            {t("grow.ctaPlot")}
          </Link>
          <Link href="/demand" className="btn ghost">
            {t("grow.ctaDemand")}
          </Link>
        </div>
      </header>

      {rankings.length === 0 ? (
        <div className="empty-state-cta">
          <p>{t("grow.empty")}</p>
          <Link href="/plots/new" className="btn primary">
            {t("grow.ctaPlot")}
          </Link>
        </div>
      ) : (
        <GrowExchangeClient
          rankings={rankings}
          initialProductId={productId}
          initialBalances={balances}
          harvests={matches.harvests.map((h) => ({
            id: h.id,
            title: h.title,
            qtyExpected: h.qtyExpected,
            unit: h.unit,
            harvestDate: h.harvestDate.toISOString(),
            marz: { slug: h.marz.slug },
          }))}
          demands={matches.demands.map((d) => ({
            id: d.id,
            title: d.title,
            buyerKind: d.buyerKind || "WHOLESALE",
            qtyMin: d.qtyMin,
            qtyMax: d.qtyMax,
            unit: d.unit,
            marz: { slug: d.marz.slug },
            user: { name: d.user.name },
          }))}
          kindBreakdown={kindBreakdown}
        />
      )}
    </div>
  );
}
