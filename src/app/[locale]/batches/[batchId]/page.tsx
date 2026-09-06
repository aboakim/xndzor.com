import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { formatFarmId, normalizeBatchCode } from "@/lib/farm-id";
import { getFarmScore } from "@/lib/farm-score";
import { qrSvgDataUrl } from "@/lib/qr";
import { FarmScoreBadge } from "@/components/FarmScoreBadge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductIcon } from "@/components/AgIcons";
import { VillageLink } from "@/components/VillageLink";

export const dynamic = "force-dynamic";

export default async function ProductBatchPage({
  params,
}: {
  params: Promise<{ locale: string; batchId: string }>;
}) {
  const { locale, batchId: raw } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const code = normalizeBatchCode(raw);

  const batch = await prisma.productBatch.findFirst({
    where: {
      OR: [{ batchCode: code }, { id: raw }],
      status: "PUBLISHED",
    },
    include: {
      product: true,
      plot: true,
      futureHarvest: true,
      user: {
        select: {
          id: true,
          name: true,
          farmName: true,
          farmId: true,
          farmVerified: true,
          marz: true,
          village: true,
        },
      },
    },
  });
  if (!batch || !batch.user.farmId) notFound();

  const score = await getFarmScore(batch.userId);
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") || "http";
  const publicUrl = `${proto}://${host}/${locale}/batches/${batch.batchCode}`;
  const qr = await qrSvgDataUrl(publicUrl, 200);

  const farmLabel = batch.user.farmName || batch.user.name;

  return (
    <div className="section detail-page product-passport">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          {
            href: `/farms/${batch.user.farmId}`,
            label: t("farmPassport.title"),
          },
          { label: batch.batchCode },
        ]}
      />

      <div className="passport-hero">
        <div className="passport-hero-main">
          <p className="eyebrow">{t("productPassport.eyebrow")}</p>
          <h1>{batch.batchCode}</h1>
          <p className="detail-product icon-label">
            <ProductIcon slugOrKey={batch.product.slug} size={18} />
            {t(batch.product.nameKey as "products.tomato")}
          </p>
          <div className="detail-stats">
            <div>
              <span>{t("productPassport.qty")}</span>
              <strong>
                {batch.qtyTons} {t("units.ton")}
              </strong>
            </div>
            <div>
              <span>{t("productPassport.harvestDate")}</span>
              <strong>{batch.harvestDate.toISOString().slice(0, 10)}</strong>
            </div>
            <div>
              <span>{t("productPassport.published")}</span>
              <strong>{batch.publishedAt.toISOString().slice(0, 10)}</strong>
            </div>
          </div>
        </div>
        <aside className="passport-qr-block print-friendly">
          <p className="scan-farm-label">{t("productPassport.scanBatch")}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt={t("productPassport.qrAlt")} className="passport-qr" width={200} height={200} />
          <p className="passport-qr-url">{batch.batchCode}</p>
        </aside>
      </div>

      <section className="match-section chain-section">
        <h2>{t("productPassport.chain")}</h2>
        <ol className="passport-chain">
          <li>
            <span className="chain-step">{t("productPassport.chainFarm")}</span>
            <Link href={`/farms/${batch.user.farmId}`}>
              <strong>{farmLabel}</strong> {formatFarmId(batch.user.farmId)}
              {batch.user.farmVerified ? (
                <span className="verified-farm-badge">{t("farmPassport.verified")}</span>
              ) : null}
            </Link>
            <p className="muted">
              {batch.user.village ? (
                <>
                  <VillageLink village={batch.user.village} locale={locale} />
                  {", "}
                </>
              ) : null}
              {batch.user.marz
                ? t(`marzes.${batch.user.marz.slug}` as "marzes.Yerevan")
                : null}
            </p>
            {score ? (
              <FarmScoreBadge
                score={score.score}
                band={score.band}
                color={score.bandColor}
                size="sm"
              />
            ) : null}
          </li>
          <li>
            <span className="chain-step">{t("productPassport.chainHarvest")}</span>
            {batch.plot ? (
              <p>
                {t("productPassport.plot")}: <strong>{batch.plot.name}</strong>
              </p>
            ) : null}
            {batch.futureHarvest ? (
              <p>
                <Link href={`/forward/${batch.futureHarvest.id}`}>
                  {batch.futureHarvest.title}
                </Link>
              </p>
            ) : (
              <p className="muted">{t("productPassport.directPlot")}</p>
            )}
          </li>
          <li>
            <span className="chain-step">{t("productPassport.chainBatch")}</span>
            <p>
              <strong>{batch.batchCode}</strong> · {batch.qtyTons} {t("units.ton")}
            </p>
          </li>
        </ol>
      </section>

      {batch.note ? <p className="pre-wrap">{batch.note}</p> : null}

      <p>
        <Link href={`/farms/${batch.user.farmId}`} className="btn ghost">
          {t("productPassport.viewFarm")}
        </Link>
      </p>
    </div>
  );
}
