import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { BoardFilters } from "@/components/BoardFilters";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { TradeCard } from "@/components/TradeCard";
import { ProductIcon } from "@/components/AgIcons";
import { EmptyState } from "@/components/EmptyState";
import { formatPriceRange, formatQty } from "@/lib/utils";

export default async function SupplyBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ product?: string; marz?: string; village?: string; q?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();

  const [products, supplies] = await Promise.all([
    prisma.product.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.supply.findMany({
      where: {
        status: "ACTIVE",
        ...(sp.marz ? { marzId: sp.marz } : {}),
        ...(sp.village ? { villageId: sp.village } : {}),
        ...(sp.product ? { product: { slug: sp.product } } : {}),
        ...(sp.q
          ? {
              OR: [{ title: { contains: sp.q } }, { description: { contains: sp.q } }],
            }
          : {}),
      },
      include: { product: true, marz: true, village: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="section page-board">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { label: t("supplyBoard.title") },
        ]}
      />
      <div className="section-head">
        <div>
          <h1>{t("supplyBoard.title")}</h1>
          <p className="lede">{t("supplyBoard.lede")}</p>
        </div>
        <Link href="/supply/new" className="btn primary">
          {t("common.add")}
        </Link>
      </div>

      <div className="category-shortcuts" aria-label={t("board.product")}>
        <Link href="/supply" className={!sp.product ? "active" : undefined}>
          {t("board.allProducts")}
        </Link>
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/supply?product=${p.slug}`}
            className={sp.product === p.slug ? "active" : undefined}
          >
            <ProductIcon slugOrKey={p.slug} size={15} />
            {t(p.nameKey as "products.tomato")}
          </Link>
        ))}
      </div>

      <BoardFilters
        basePath="/supply"
        products={products}
        product={sp.product}
        marz={sp.marz}
        village={sp.village}
        q={sp.q}
      />

      {supplies.length === 0 ? (
        <EmptyState
          message={t("supplyBoard.empty")}
          actionHref="/supply/new"
          actionLabel={t("common.add")}
        />
      ) : (
        <div className="classified-list">
          {supplies.map((s) => (
            <TradeCard
              key={s.id}
              kind="supply"
              id={s.id}
              title={s.title}
              productNameKey={s.product.nameKey}
              productSlug={s.product.slug}
              qtyLabel={formatQty(s.qtyAvailable, null, s.unit, (k) => t(k as "units.kg"))}
              priceLabel={
                s.priceAmd != null
                  ? formatPriceRange(s.priceAmd, s.priceAmd, s.unit, (k) => t(k as "common.amd"))
                  : undefined
              }
              marz={{ ...s.marz, slug: s.marz.slug }}
              village={s.village}
              imageUrls={s.imageUrls}
              meta={
                s.readyInDays === 0
                  ? t("supply.readyNow")
                  : t("supply.readyIn", { days: s.readyInDays })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
