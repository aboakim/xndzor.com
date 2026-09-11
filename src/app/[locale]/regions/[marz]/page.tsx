import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ClassifiedRow } from "@/components/ClassifiedRow";
import { JsonLd } from "@/components/JsonLd";
import { ProductIcon, JobTypeIcon } from "@/components/AgIcons";
import { MARZES } from "@/lib/places";
import { absoluteUrl, breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";
import { marzPlaceJsonLd, marzRegionPath, resolveMarzSlug } from "@/lib/marz-seo";
import { formatAmd, formatPriceRange, formatQty, parseImageUrls } from "@/lib/utils";
import { safeQuery } from "@/lib/safe-query";

export function generateStaticParams() {
  return MARZES.map((marz) => ({ marz }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; marz: string }>;
}) {
  const { locale, marz: marzParam } = await params;
  const marzId = resolveMarzSlug(marzParam);
  if (!marzId) return {};

  const t = await getTranslations({ locale, namespace: "seo" });
  const tRoot = await getTranslations({ locale });
  const marzName = tRoot(`marzes.${marzId}` as "marzes.Yerevan");

  return buildPageMetadata({
    locale,
    path: marzRegionPath(marzId),
    title: t("region.title", { marz: marzName }),
    description: t("region.description", { marz: marzName }),
  });
}

export const dynamic = "force-dynamic";

const TAKE = 12;

export default async function MarzRegionPage({
  params,
}: {
  params: Promise<{ locale: string; marz: string }>;
}) {
  const { locale, marz: marzParam } = await params;
  setRequestLocale(locale);
  const marzId = resolveMarzSlug(marzParam);
  if (!marzId) notFound();

  const t = await getTranslations();
  const marzName = t(`marzes.${marzId}` as "marzes.Yerevan");
  const path = marzRegionPath(marzId);
  const pageUrl = absoluteUrl(locale, path);

  const empty: never[] = [];
  const [supplies, demands, forwards, jobs, animals, machinery] = await Promise.all([
    safeQuery(
      () =>
        prisma.supply.findMany({
          where: { status: "ACTIVE", marzId },
          include: { product: true },
          orderBy: { createdAt: "desc" },
          take: TAKE,
        }),
      empty,
    ),
    safeQuery(
      () =>
        prisma.demand.findMany({
          where: { status: "ACTIVE", marzId },
          include: { product: true },
          orderBy: { createdAt: "desc" },
          take: TAKE,
        }),
      empty,
    ),
    safeQuery(
      () =>
        prisma.futureHarvest.findMany({
          where: { status: "ACTIVE", marzId },
          include: { product: true },
          orderBy: { harvestDate: "asc" },
          take: TAKE,
        }),
      empty,
    ),
    safeQuery(
      () =>
        prisma.jobRequest.findMany({
          where: { status: "ACTIVE", marzId },
          orderBy: { createdAt: "desc" },
          take: TAKE,
        }),
      empty,
    ),
    safeQuery(
      () =>
        prisma.animalListing.findMany({
          where: { status: "ACTIVE", marzId },
          orderBy: { createdAt: "desc" },
          take: TAKE,
        }),
      empty,
    ),
    safeQuery(
      () =>
        prisma.machineryListing.findMany({
          where: { status: "ACTIVE", marzId },
          orderBy: { createdAt: "desc" },
          take: TAKE,
        }),
      empty,
    ),
  ]);

  const total =
    supplies.length +
    demands.length +
    forwards.length +
    jobs.length +
    animals.length +
    machinery.length;

  const listItems = [
    ...supplies.map((s) => ({
      url: absoluteUrl(locale, `/supply/${s.id}`),
      name: s.title,
    })),
    ...demands.map((d) => ({
      url: absoluteUrl(locale, `/demand/${d.id}`),
      name: d.title,
    })),
    ...forwards.map((h) => ({
      url: absoluteUrl(locale, `/forward/${h.id}`),
      name: h.title,
    })),
    ...jobs.map((j) => ({
      url: absoluteUrl(locale, `/jobs/${j.id}`),
      name: j.title,
    })),
    ...animals.map((a) => ({
      url: absoluteUrl(locale, `/animals/${a.id}`),
      name: a.title,
    })),
    ...machinery.map((m) => ({
      url: absoluteUrl(locale, `/machinery/${m.id}`),
      name: m.title,
    })),
  ].slice(0, 30);

  const otherMarzes = MARZES.filter((m) => m !== marzId);

  return (
    <div className="section page-board">
      <JsonLd
        data={[
          breadcrumbJsonLd(locale, [
            { href: "/", label: t("nav.home") },
            { href: "/regions", label: t("regions.title") },
            { label: marzName },
          ]),
          marzPlaceJsonLd({
            locale,
            marzId,
            marzName,
            pageUrl,
          }),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: t("regions.listingsIn", { marz: marzName }),
            numberOfItems: listItems.length,
            itemListElement: listItems.map((item, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: item.url,
              name: item.name,
            })),
          },
        ]}
      />

      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { href: "/regions", label: t("regions.title") },
          { label: marzName },
        ]}
      />

      <div className="section-head">
        <div>
          <h1>{t("regions.heading", { marz: marzName })}</h1>
          <p className="lede">{t("regions.marzLede", { marz: marzName })}</p>
        </div>
        <div className="section-head-actions">
          <Link href={`/supply?marz=${marzId}`} className="btn primary">
            {t("nav.supply")}
          </Link>
          <Link href={`/demand?marz=${marzId}`} className="btn ghost">
            {t("demandBoard.title")}
          </Link>
        </div>
      </div>

      <nav className="chip-row region-board-chips" aria-label={t("regions.boards")}>
        <Link href={`/supply?marz=${marzId}`} className="chip">
          {t("nav.supply")}
        </Link>
        <Link href={`/demand?marz=${marzId}`} className="chip">
          {t("demandBoard.title")}
        </Link>
        <Link href={`/forward?marz=${marzId}`} className="chip">
          {t("forwardBoard.title")}
        </Link>
        <Link href={`/jobs?marz=${marzId}`} className="chip">
          {t("jobsBoard.title")}
        </Link>
        <Link href={`/animals?marz=${marzId}`} className="chip">
          {t("animalsBoard.title")}
        </Link>
        <Link href={`/machinery?marz=${marzId}`} className="chip">
          {t("machineryBoard.title")}
        </Link>
      </nav>

      {total === 0 ? (
        <div className="empty-state-cta">
          <p>{t("regions.empty", { marz: marzName })}</p>
          <Link href="/supply/new" className="btn primary">
            {t("common.add")}
          </Link>
        </div>
      ) : null}

      {forwards.length > 0 ? (
        <section className="compact-section">
          <div className="section-head">
            <h2>{t("forwardBoard.title")}</h2>
            <Link href={`/forward?marz=${marzId}`} className="text-link">
              {t("home.seeAll")} →
            </Link>
          </div>
          <div className="classified-list">
            {forwards.map((h) => (
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
            <Link href={`/supply?marz=${marzId}`} className="text-link">
              {t("home.seeAll")} →
            </Link>
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
                    ? formatPriceRange(s.priceAmd, s.priceAmd, s.unit, (k) =>
                        t(k as "common.amd"),
                      )
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
            <Link href={`/demand?marz=${marzId}`} className="text-link">
              {t("home.seeAll")} →
            </Link>
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
                  t(k as "common.amd"),
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
            <Link href={`/jobs?marz=${marzId}`} className="text-link">
              {t("home.seeAll")} →
            </Link>
          </div>
          <div className="classified-list">
            {jobs.map((j) => (
              <ClassifiedRow
                key={j.id}
                href={`/jobs/${j.id}`}
                title={j.title}
                meta={[
                  t(`jobTypes.${j.jobType}` as "jobTypes.HARVEST"),
                  j.areaNote ||
                    (j.hectares != null ? `${j.hectares} ${t("farmos.ha")}` : null),
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

      {animals.length > 0 ? (
        <section className="compact-section">
          <div className="section-head">
            <h2>{t("animalsBoard.title")}</h2>
            <Link href={`/animals?marz=${marzId}`} className="text-link">
              {t("home.seeAll")} →
            </Link>
          </div>
          <div className="classified-list">
            {animals.map((a) => (
              <ClassifiedRow
                key={a.id}
                href={`/animals/${a.id}`}
                title={a.title}
                meta={marzName}
                value={a.priceAmd != null ? `${formatAmd(a.priceAmd)} ֏` : undefined}
                thumb={parseImageUrls(a.imageUrls ?? "[]")[0]}
              />
            ))}
          </div>
        </section>
      ) : null}

      {machinery.length > 0 ? (
        <section className="compact-section">
          <div className="section-head">
            <h2>{t("machineryBoard.title")}</h2>
            <Link href={`/machinery?marz=${marzId}`} className="text-link">
              {t("home.seeAll")} →
            </Link>
          </div>
          <div className="classified-list">
            {machinery.map((m) => (
              <ClassifiedRow
                key={m.id}
                href={`/machinery/${m.id}`}
                title={m.title}
                meta={marzName}
                value={m.priceAmd != null ? `${formatAmd(m.priceAmd)} ֏` : undefined}
                thumb={parseImageUrls(m.imageUrls ?? "[]")[0]}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="compact-section">
        <div className="section-head">
          <h2>{t("regions.otherMarzes")}</h2>
          <Link href="/regions" className="text-link">
            {t("regions.title")} →
          </Link>
        </div>
        <nav className="chip-row" aria-label={t("regions.otherMarzes")}>
          {otherMarzes.map((id) => (
            <Link key={id} href={marzRegionPath(id)} className="chip">
              {t(`marzes.${id}` as "marzes.Yerevan")}
            </Link>
          ))}
        </nav>
      </section>
    </div>
  );
}
