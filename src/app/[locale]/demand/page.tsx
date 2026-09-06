import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { BoardFilters } from "@/components/BoardFilters";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { TradeCard } from "@/components/TradeCard";
import { ProductIcon } from "@/components/AgIcons";
import { EmptyState } from "@/components/EmptyState";
import { formatPriceRange, formatQty } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DemandBoardPage({
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

  const [products, demands] = await Promise.all([
    prisma.product.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.demand.findMany({
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
          { label: t("demandBoard.title") },
        ]}
      />
      <div className="section-head">
        <div>
          <h1>{t("demandBoard.title")}</h1>
          <p className="lede">{t("demandBoard.lede")}</p>
        </div>
        <Link href="/demand/new" className="btn primary">
          {t("common.add")}
        </Link>
      </div>

      <div className="category-shortcuts" aria-label={t("board.product")}>
        <Link href="/demand" className={!sp.product ? "active" : undefined}>
          {t("board.allProducts")}
        </Link>
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/demand?product=${p.slug}`}
            className={sp.product === p.slug ? "active" : undefined}
          >
            <ProductIcon slugOrKey={p.slug} size={15} />
            {t(p.nameKey as "products.tomato")}
          </Link>
        ))}
      </div>

      <BoardFilters
        basePath="/demand"
        products={products}
        product={sp.product}
        marz={sp.marz}
        village={sp.village}
        q={sp.q}
      />

      {demands.length === 0 ? (
        <EmptyState
          message={t("demandBoard.empty")}
          actionHref="/demand/new"
          actionLabel={t("common.add")}
        />
      ) : (
        <div className="classified-list">
          {demands.map((d) => (
            <TradeCard
              key={d.id}
              kind="demand"
              id={d.id}
              title={d.title}
              productNameKey={d.product.nameKey}
              productSlug={d.product.slug}
              qtyLabel={formatQty(d.qtyMin, d.qtyMax, d.unit, (k) => t(k as "units.kg"))}
              priceLabel={formatPriceRange(d.priceMinAmd, d.priceMaxAmd, d.unit, (k) =>
                t(k as "common.amd")
              )}
              marz={{ ...d.marz, slug: d.marz.slug }}
              village={d.village}
              imageUrls={d.imageUrls}
              meta={d.timingNote || undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
