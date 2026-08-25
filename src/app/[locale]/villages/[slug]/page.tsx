import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ClassifiedRow } from "@/components/ClassifiedRow";
import { VillageMap } from "@/components/VillageMap";
import { JobTypeIcon, ProductIcon } from "@/components/AgIcons";
import { localizedPlaceName } from "@/lib/places";
import { formatAmd, formatPriceRange, formatQty, parseImageUrls } from "@/lib/utils";

export default async function VillagePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const village = await prisma.village.findUnique({
    where: { slug },
    include: { marz: true },
  });
  if (!village) notFound();

  const [supplies, demands, jobs, harvests, providers] = await Promise.all([
    prisma.supply.findMany({
      where: { villageId: village.id, status: "ACTIVE" },
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.demand.findMany({
      where: { villageId: village.id, status: "ACTIVE" },
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.jobRequest.findMany({
      where: { villageId: village.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.futureHarvest.findMany({
      where: { villageId: village.id, status: "ACTIVE" },
      include: { product: true },
      orderBy: { harvestDate: "asc" },
      take: 12,
    }),
    prisma.serviceProvider.findMany({
      where: { villageId: village.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const villageName = localizedPlaceName(village, locale);
  const marzLabel = t(`marzes.${village.marz.slug}` as "marzes.Yerevan");
  const total =
    supplies.length + demands.length + jobs.length + harvests.length + providers.length;

  return (
    <div className="section page-board village-page">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { href: `/supply?marz=${village.marzId}`, label: marzLabel },
          { label: villageName },
        ]}
      />

      <div className="section-head">
        <div>
          <h1>{villageName}</h1>
          <p className="lede">
            {marzLabel} · {t(`village.kind.${village.kind}` as "village.kind.settlement")}
          </p>
        </div>
        <div className="section-head-actions">
          <Link href={`/supply?marz=${village.marzId}&village=${village.id}`} className="btn ghost">
            {t("nav.supply")}
          </Link>
          <Link href={`/demand?marz=${village.marzId}&village=${village.id}`} className="btn ghost">
            {t("nav.demand")}
          </Link>
        </div>
      </div>

      <VillageMap
        village={village}
        marzNameEn={village.marz.nameEn}
        title={t("village.mapTitle", { village: villageName })}
        openLabel={t("village.openInOsm")}
        noCoordsLabel={t("village.noCoords")}
      />

      {total === 0 ? (
        <div className="empty-state-cta">
          <p>{t("village.noPosts", { village: villageName })}</p>
          <Link href="/supply/new" className="btn primary">
            {t("common.add")}
          </Link>
        </div>
      ) : null}

      {harvests.length > 0 ? (
        <section className="compact-section">
          <div className="section-head">
            <h2>{t("forwardBoard.title")}</h2>
          </div>
          <div className="classified-list">
            {harvests.map((h) => (
              <ClassifiedRow
                key={h.id}
                href={`/forward/${h.id}`}
                title={h.title}
                meta={[
                  t(h.product.nameKey as "products.tomato"),
                  `${formatAmd(h.qtyExpected)} ${t(`units.${h.unit}` as "units.kg")}`,
                  h.harvestDate.toISOString().slice(0, 10),
                ].join(" · ")}
                value={h.priceAmd != null ? `${formatAmd(h.priceAmd)} ֏` : undefined}
                icon={<ProductIcon slugOrKey={h.product.slug} size={20} />}
              />
            ))}
          </div>
        </section>
      ) : null}

      {supplies.length > 0 ? (
        <section className="compact-section">
          <div className="section-head">
            <h2>{t("supplyBoard.title")}</h2>
          </div>
          <div className="classified-list">
            {supplies.map((s) => (
              <ClassifiedRow
                key={s.id}
                href={`/supply/${s.id}`}
                title={s.title}
                meta={[
                  t(s.product.nameKey as "products.tomato"),
                  formatQty(s.qtyAvailable, null, s.unit, (k) => t(k as "units.kg")),
                  s.readyInDays === 0
                    ? t("supply.readyNow")
                    : t("supply.readyIn", { days: s.readyInDays }),
                ].join(" · ")}
                value={
                  s.priceAmd != null
                    ? formatPriceRange(s.priceAmd, s.priceAmd, s.unit, (k) => t(k as "common.amd"))
                    : undefined
                }
                thumb={parseImageUrls(s.imageUrls)[0]}
                icon={<ProductIcon slugOrKey={s.product.slug} size={20} />}
              />
            ))}
          </div>
        </section>
      ) : null}

      {demands.length > 0 ? (
        <section className="compact-section">
          <div className="section-head">
            <h2>{t("demandBoard.title")}</h2>
          </div>
          <div className="classified-list">
            {demands.map((d) => (
              <ClassifiedRow
                key={d.id}
                href={`/demand/${d.id}`}
                title={d.title}
                meta={[
                  t(d.product.nameKey as "products.tomato"),
                  formatQty(d.qtyMin, d.qtyMax, d.unit, (k) => t(k as "units.kg")),
                ].join(" · ")}
                value={formatPriceRange(d.priceMinAmd, d.priceMaxAmd, d.unit, (k) =>
                  t(k as "common.amd")
                )}
                icon={<ProductIcon slugOrKey={d.product.slug} size={20} />}
              />
            ))}
          </div>
        </section>
      ) : null}

      {jobs.length > 0 ? (
        <section className="compact-section">
          <div className="section-head">
            <h2>{t("jobsBoard.title")}</h2>
          </div>
          <div className="classified-list">
            {jobs.map((j) => (
              <ClassifiedRow
                key={j.id}
                href={`/jobs/${j.id}`}
                title={j.title}
                meta={[
                  t(`jobTypes.${j.jobType}` as "jobTypes.HARVEST"),
                  j.areaNote || (j.hectares != null ? `${j.hectares} ${t("farmos.ha")}` : null),
                  j.workDate ? j.workDate.toISOString().slice(0, 10) : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                value={j.budgetAmd != null ? `${formatAmd(j.budgetAmd)} ֏` : undefined}
                icon={<JobTypeIcon type={j.jobType} size={20} />}
              />
            ))}
          </div>
        </section>
      ) : null}

      {providers.length > 0 ? (
        <section className="compact-section">
          <div className="section-head">
            <h2>{t("providersBoard.title")}</h2>
          </div>
          <div className="classified-list">
            {providers.map((p) => (
              <ClassifiedRow
                key={p.id}
                href={`/providers/${p.id}`}
                title={p.title}
                meta={p.coverageNote || marzLabel}
                value={p.rateAmd != null ? `${formatAmd(p.rateAmd)} ֏` : undefined}
                icon={<JobTypeIcon type="OTHER" size={20} />}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
