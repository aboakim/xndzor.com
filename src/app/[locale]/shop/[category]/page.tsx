import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
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
  }>;
}) {
  const { locale, category: slug } = await params;
  const sp = await searchParams;
  const category = categoryFromRoute(slug);
  if (!category) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  const route = CATALOG_ROUTE[category];

  const listings = await prisma.catalogListing.findMany({
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
    orderBy: { createdAt: "desc" },
  });

  const boostMap = await getActiveBoostMap(
    "CATALOG",
    listings.map((r) => r.id),
  );
  const proIds = await getProUserIds(listings.map((r) => r.userId));
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

      <CatalogFilters
        category={category}
        subtype={sp.subtype}
        marz={sp.marz}
        village={sp.village}
        q={sp.q}
        priceMin={sp.priceMin}
        priceMax={sp.priceMax}
      />

      {ranked.length === 0 ? (
        <EmptyState
          message={t("catalogBoard.empty")}
          actionHref={`/shop/${route}/new`}
          actionLabel={t("common.add")}
        />
      ) : (
        <div className="classified-list">
          {ranked.map((row) => (
            <CatalogCard
              key={row.id}
              id={row.id}
              category={category}
              title={row.title}
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
        </div>
      )}
    </div>
  );
}
