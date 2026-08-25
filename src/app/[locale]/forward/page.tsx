import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { formatAmd } from "@/lib/utils";
import { ProductIcon } from "@/components/AgIcons";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ClassifiedRow } from "@/components/ClassifiedRow";
import { EmptyState } from "@/components/EmptyState";
import { VillageLink } from "@/components/VillageLink";

export default async function ForwardBoardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const crops = await prisma.futureHarvest.findMany({
    where: { status: "ACTIVE" },
    include: {
      product: true,
      marz: true,
      village: true,
      plot: true,
      preOffers: { where: { status: { in: ["SENT", "RESERVED"] } } },
    },
    orderBy: { harvestDate: "asc" },
  });

  const demandByProduct = await prisma.demand.groupBy({
    by: ["productId"],
    where: { status: "ACTIVE" },
    _count: true,
  });
  const products = await prisma.product.findMany();
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

      {demandByProduct.length > 0 ? (
        <section className="match-section compact-section">
          <h2>{t("forwardBoard.dashboard")}</h2>
          <div className="classified-list">
            {demandByProduct.map((row) => {
              const p = productMap[row.productId];
              if (!p) return null;
              const offered = crops
                .filter((c) => c.productId === row.productId)
                .reduce((s, c) => s + c.qtyExpected, 0);
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

      {crops.length === 0 ? (
        <EmptyState
          message={t("forwardBoard.empty")}
          actionHref="/forward/new"
          actionLabel={t("common.add")}
        />
      ) : (
        <div className="classified-list">
          {crops.map((c) => {
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
                key={c.id}
                href={`/forward/${c.id}`}
                title={c.title}
                meta={meta}
                value={c.priceAmd != null ? `${formatAmd(c.priceAmd)} ֏` : undefined}
                icon={<ProductIcon slugOrKey={c.product.slug} size={20} />}
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
