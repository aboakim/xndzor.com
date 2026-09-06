import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { formatFarmId, normalizeFarmId, ensureFarmId } from "@/lib/farm-id";
import { getFarmScore } from "@/lib/farm-score";
import { qrSvgDataUrl } from "@/lib/qr";
import { FarmScoreBadge } from "@/components/FarmScoreBadge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductIcon } from "@/components/AgIcons";
import { VillageLink } from "@/components/VillageLink";
import { getSession } from "@/lib/session";
import { getCropRankings } from "@/lib/exchange";
import { GoProLink } from "@/components/CheckoutButton";
import { ProBadge } from "@/components/MonetizationBadges";
import { DemandAlertForm } from "@/components/DemandAlertForm";
import { getUserEntitlements } from "@/lib/monetization";
import { getXndzorScore } from "@/lib/farm-os/xndzor-score";
import { XndzorScoreCard } from "@/components/farm-os/XndzorScoreCard";

export const dynamic = "force-dynamic";

export default async function FarmPassportPage({
  params,
}: {
  params: Promise<{ locale: string; farmId: string }>;
}) {
  const { locale, farmId: raw } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();

  // Special path: /farms/me → own passport
  let code = normalizeFarmId(raw);
  if (raw === "me" || raw === "my") {
    if (!session?.user?.id) {
      redirect(`/${locale}/auth/login?callbackUrl=/${locale}/farms/me`);
    }
    code = await ensureFarmId(session.user.id);
  }

  const user = await prisma.user.findFirst({
    where: { farmId: code },
    include: {
      marz: true,
      village: true,
      productBatches: {
        where: { status: "PUBLISHED" },
        include: { product: true },
        orderBy: { publishedAt: "desc" },
        take: 12,
      },
      farmReviewsReceived: {
        include: { fromUser: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
    },
  });
  if (!user) notFound();

  const score = await getFarmScore(user.id);
  if (!score) notFound();
  const xndzorScore = await getXndzorScore(user.id);

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") || "http";
  const publicUrl = `${proto}://${host}/${locale}/farms/${user.farmId}`;
  const qr = await qrSvgDataUrl(publicUrl, 200);

  const rankings = await getCropRankings();
  const farmerCropSlugs = new Set(score.stats.mainCrops.map((c) => c.slug));
  const demandSignals = rankings
    .filter((r) => farmerCropSlugs.has(r.slug))
    .slice(0, 5);

  const displayName = user.farmName || user.name;
  const isOwner = session?.user?.id === user.id;
  const ent = await getUserEntitlements(user.id);
  const products = await prisma.product.findMany({ orderBy: { sortOrder: "asc" } });
  const ownerAlerts =
    isOwner && session?.user?.id
      ? await prisma.demandAlert.findMany({
          where: { userId: session.user.id, active: true },
          select: { productId: true },
        })
      : [];

  return (
    <div className="section detail-page farm-passport">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { label: t("farmPassport.title") },
        ]}
      />

      <div className="passport-hero">
        <div className="passport-hero-main">
          <p className="eyebrow">{t("farmPassport.eyebrow")}</p>
          <h1>{displayName}</h1>
          <p className="farm-id-line">
            <span className="farm-id-code">{formatFarmId(user.farmId!)}</span>
            {user.farmVerified || ent?.isVerifiedPaid ? (
              <span className="verified-farm-badge">{t("farmPassport.verified")}</span>
            ) : null}
            {ent?.isPro ? <ProBadge /> : null}
          </p>
          <p className="detail-location">
            {user.village ? (
              <>
                <VillageLink village={user.village} locale={locale} />
                {", "}
              </>
            ) : null}
            {user.marz
              ? t(`marzes.${user.marz.slug}` as "marzes.Yerevan")
              : null}
          </p>
          <div id="farm-score">
          <FarmScoreBadge
            score={score.score}
            band={score.band}
            color={score.bandColor}
            size="lg"
          />
          </div>
          <p className="muted farm-score-disclaimer">{t("farmPassport.scoreDisclaimer")}</p>
        </div>

        <aside id="farm-qr" className="passport-qr-block print-friendly">
          <p className="scan-farm-label">{t("farmPassport.scanFarm")}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt={t("farmPassport.qrAlt")} className="passport-qr" width={200} height={200} />
          <p className="passport-qr-url">{formatFarmId(user.farmId!)}</p>
        </aside>
      </div>

      <div className="detail-stats passport-stats">
        <div>
          <span>{t("farmPassport.stats.ha")}</span>
          <strong>{score.stats.plotHa}</strong>
        </div>
        <div>
          <span>{t("farmPassport.stats.tonsSold")}</span>
          <strong>{score.stats.tonsSold}</strong>
        </div>
        <div>
          <span>{t("farmPassport.stats.deals")}</span>
          <strong>{score.stats.successfulDeals}</strong>
        </div>
        <div>
          <span>{t("farmPassport.stats.rating")}</span>
          <strong>
            {score.stats.buyerRatingAvg != null
              ? `${score.stats.buyerRatingAvg} (${score.stats.ratingCount})`
              : "—"}
          </strong>
        </div>
        <div>
          <span>
            {t("farmPassport.stats.onTime")}
            {score.stats.onTimeIsEstimate ? ` *` : ""}
          </span>
          <strong>
            {score.stats.onTimePct != null ? `${score.stats.onTimePct}%` : "—"}
          </strong>
        </div>
        {score.stats.livestockCount > 0 ? (
          <div>
            <span>{t("farmPassport.stats.livestock")}</span>
            <strong>{score.stats.livestockCount}</strong>
          </div>
        ) : null}
        {score.stats.machineryCount > 0 ? (
          <div>
            <span>{t("farmPassport.stats.machinery")}</span>
            <strong>{score.stats.machineryCount}</strong>
          </div>
        ) : null}
      </div>
      {score.stats.onTimeIsEstimate ? (
        <p className="muted tiny">{t("farmPassport.onTimeEstimateNote")}</p>
      ) : null}

      {xndzorScore ? (
        <div id="xndzor-score" style={{ marginTop: "1.5rem" }}>
          <XndzorScoreCard
            overall={xndzorScore.overall}
            axes={xndzorScore.axes}
            tips={xndzorScore.tips}
          />
        </div>
      ) : null}

      {score.stats.mainCrops.length > 0 ? (
        <section className="match-section">
          <h2>{t("farmPassport.mainCrops")}</h2>
          <ul className="crop-chip-list">
            {score.stats.mainCrops.map((c) => (
              <li key={c.slug} className="crop-chip">
                <ProductIcon slugOrKey={c.slug} size={16} />
                {t(c.nameKey as "products.tomato")} · {c.ha}{" "}
                {t("farmPassport.ha")}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="match-section">
        <h2>{t("farmPassport.vsDemand")}</h2>
        <p className="lede tight">{t("farmPassport.vsDemandLede")}</p>
        <Link href="/grow" className="btn ghost">
          {t("nav.grow")}
        </Link>
        {demandSignals.length > 0 ? (
          <ul className="match-list" style={{ marginTop: "1rem" }}>
            {demandSignals.map((r) => (
              <li key={r.productId} className="match-row">
                <div>
                  <strong>
                    <ProductIcon slugOrKey={r.slug} size={16} />{" "}
                    {t(r.nameKey as "products.tomato")}
                  </strong>
                  <p>
                    {t("farmPassport.signal", {
                      signal: r.signal,
                      demand: Math.round(r.demandTons),
                      supply: Math.round(r.supplyTons),
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">{t("farmPassport.noCropDemand")}</p>
        )}
      </section>

      <section className="match-section">
        <h2>{t("farmPassport.unlocksTitle")}</h2>
        <ul className="unlock-list">
          <li className={score.trusted ? "is-on" : ""}>
            {t("farmPassport.unlocks.trusted")}
          </li>
          <li className={score.score >= 55 || ent?.isPro ? "is-on" : ""}>
            {t("farmPassport.unlocks.visibility")}
          </li>
          <li className={user.farmVerified || ent?.isVerifiedPaid ? "is-on" : ""}>
            {t("farmPassport.unlocks.verified")}
          </li>
          <li className={score.stats.batchCount > 0 ? "is-on" : ""}>
            {t("farmPassport.unlocks.batches")}
          </li>
        </ul>
        {isOwner && !ent?.isPro ? (
          <div className="pro-cta-row">
            <GoProLink className="btn primary" />
          </div>
        ) : null}
      </section>

      {isOwner ? (
        <section className="match-section">
          <h2>{t("pricing.farmPro.f4")}</h2>
          <DemandAlertForm
            products={products.map((p) => ({ id: p.id, nameKey: p.nameKey }))}
            isPro={Boolean(ent?.isPro)}
            existingProductIds={ownerAlerts.map((a) => a.productId)}
          />
        </section>
      ) : null}

      {user.productBatches.length > 0 ? (
        <section id="farm-batches" className="match-section">
          <h2>{t("farmPassport.batches")}</h2>
          <div className="classified-list">
            {user.productBatches.map((b) => (
              <Link
                key={b.id}
                href={`/batches/${b.batchCode}`}
                className="classified-row"
              >
                <span className="classified-body">
                  <span className="classified-title">{b.batchCode}</span>
                  <span className="classified-meta">
                    {t(b.product.nameKey as "products.tomato")} · {b.qtyTons}{" "}
                    {t("units.ton")} · {b.harvestDate.toISOString().slice(0, 10)}
                  </span>
                </span>
                <span className="classified-arrow">→</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {user.farmReviewsReceived.length > 0 ? (
        <section className="match-section">
          <h2>{t("farmPassport.reviews")}</h2>
          <ul className="match-list">
            {user.farmReviewsReceived.map((r) => (
              <li key={r.id} className="match-row">
                <div>
                  <strong>
                    {"★".repeat(r.rating)}{" "}
                    <span className="muted">{r.fromUser.name}</span>
                  </strong>
                  {r.body ? <p>{r.body}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {user.showPhoneOnPassport && user.phone ? (
        <p className="muted">{t("farmPassport.phone")}: {user.phone}</p>
      ) : (
        <p className="muted tiny">{t("farmPassport.phoneHidden")}</p>
      )}

      {isOwner ? (
        <p className="muted">
          <Link href="/advisor">{t("advisor.stubLink")}</Link>
        </p>
      ) : null}
    </div>
  );
}
