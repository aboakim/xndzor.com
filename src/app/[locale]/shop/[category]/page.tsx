import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { browseOrderBy } from "@/lib/browse-sort";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import { ListingBrowseLayout } from "@/components/ListingBrowseLayout";
import { CatalogCard } from "@/components/CatalogCard";
import { CatalogFilters } from "@/components/CatalogFilters";
import { ActionIcon } from "@/components/AgIcons";
import {
  CATALOG_ROUTE,
  CATALOG_SUBTYPES,
  categoryFromRoute,
} from "@/lib/catalog";
import { getSession } from "@/lib/session";
import {
  getActiveBoostMap,
  getProUserIds,
  sortByMonetization,
} from "@/lib/monetization";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category: slug } = await params;
  const category = categoryFromRoute(slug);
  if (!category) return {};
  const t = await getTranslations({ locale, namespace: "seo" });
  const catKey = `shopCategory.${slug}.title` as "shopCategory.fertilizers.title";
  const useCat = t.has(catKey);
  return buildPageMetadata({
    locale,
    path: `/shop/${slug}`,
    title: useCat ? t(catKey) : t("shop.title"),
    description: useCat
      ? t(`shopCategory.${slug}.description` as "shopCategory.fertilizers.description")
      : t("shop.description"),
  });
}

export default async function CatalogBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; category: string }>;
  searchParams: Promise<{
    subtype?: string;
    marz?: string;
    village?: string;
    q?: string;
    priceMin?: string;
    priceMax?: string;
    sort?: string;
  }>;
}) {
  const { locale, category: slug } = await params;
  const sp = await searchParams;
  const category = categoryFromRoute(slug);
  if (!category) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const route = CATALOG_ROUTE[category];

  const [session, listings] = await Promise.all([
    getSession(),
    prisma.catalogListing.findMany({
      where: {
        category,
        status: "ACTIVE",
        ...(sp.subtype ? { subtype: sp.subtype } : {}),
        ...(sp.marz ? { marzId: sp.marz } : {}),
        ...(sp.village ? { villageId: sp.village } : {}),
        ...(sp.priceMin || sp.priceMax
          ? {
              priceAmd: {
                ...(sp.priceMin ? { gte: Number(sp.priceMin) } : {}),
                ...(sp.priceMax ? { lte: Number(sp.priceMax) } : {}),
              },
            }
          : {}),
        ...(sp.q
          ? {
              OR: [
                { title: { contains: sp.q } },
                { description: { contains: sp.q } },
                { brand: { contains: sp.q } },
              ],
            }
          : {}),
      },
      include: { marz: true, village: true },
      orderBy: browseOrderBy(sp.sort),
    }),
  ]);

  const [boostMap, proIds] = await Promise.all([
    getActiveBoostMap(
      "CATALOG",
      listings.map((r) => r.id),
    ),
    getProUserIds(listings.map((r) => r.userId)),
  ]);
  const ranked = sortByMonetization(listings, boostMap, proIds);

  return (
    <div className="section page-board">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { label: t(`catalogCategories.${category}` as "catalogCategories.FERTILIZER") },
        ]}
      />
      <div className="section-head">
        <div>
          <h1>{t(`catalogCategories.${category}` as "catalogCategories.FERTILIZER")}</h1>
          <p className="lede">{t(`catalogLedes.${category}` as "catalogLedes.FERTILIZER")}</p>
        </div>
        <div className="section-head-actions">
          {session ? (
            <Link href="/my/shop" className="btn ghost">
              {t("myCatalog.title")}
            </Link>
          ) : null}
          <Link href={`/shop/${route}/new`} className="btn primary">
            {t("common.add")}
          </Link>
        </div>
      </div>

      <div className="category-shortcuts">
        <Link href={`/shop/${route}`} className={!sp.subtype ? "active" : undefined}>
          {t("catalogBoard.allSubtypes")}
        </Link>
        {CATALOG_SUBTYPES[category].map((s) => (
          <Link
            key={s}
            href={`/shop/${route}?subtype=${s}`}
            className={sp.subtype === s ? "active" : undefined}
          >
            <ActionIcon action={route} size={14} />
            {t(`catalogSubtypes.${category}.${s}` as "catalogSubtypes.FERTILIZER.NPK")}
          </Link>
        ))}
      </div>

      <ListingBrowseLayout
        sort={sp.sort}
        hasResults={ranked.length > 0}
        resultCount={ranked.length}
        empty={
          <EmptyState
            message={t("catalogBoard.empty")}
            actionHref={`/shop/${route}/new`}
            actionLabel={t("common.add")}
          />
        }
        sidebar={
          <CatalogFilters
            category={category}
            subtype={sp.subtype}
            marz={sp.marz}
            village={sp.village}
            q={sp.q}
            priceMin={sp.priceMin}
            priceMax={sp.priceMax}
          />
        }
      >
        {ranked.map((row) => (
          <CatalogCard
            key={row.id}
            id={row.id}
            category={category}
            title={row.title}
            description={row.description}
            subtype={row.subtype}
            brand={row.brand}
            quantity={row.quantity}
            unit={row.unit}
            priceAmd={row.priceAmd}
            priceNegotiable={row.priceNegotiable}
            priceUnit={row.priceUnit}
            marz={{ ...row.marz, slug: row.marz.slug }}
            village={row.village}
            imageUrls={row.imageUrls}
            isPro={proIds.has(row.userId)}
            boosted={boostMap.has(row.id)}
          />
        ))}
      </ListingBrowseLayout>
    </div>
  );
}
