import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { OwnerContactActions } from "@/components/OwnerContactActions";
import { ShareButtons } from "@/components/ShareButtons";
import { ForwardInterestForm } from "@/components/ForwardInterestForm";
import { JsonLd } from "@/components/JsonLd";
import { formatAmd, parseImageUrls } from "@/lib/utils";
import { getSession } from "@/lib/session";
import { VillageLink } from "@/components/VillageLink";
import { CreateBatchButton } from "@/components/CreateBatchButton";
import { TrustedPill } from "@/components/FarmScoreBadge";
import { formatFarmId } from "@/lib/farm-id";
import { getFarmScore } from "@/lib/farm-score";
import { ListingGallery } from "@/components/ListingGallery";
import { BoostButton } from "@/components/BoostButton";
import { MyListingActions } from "@/components/MyListingActions";
import { getActiveBoostMap, getUserEntitlements } from "@/lib/monetization";
import { resolveOwnerFreeCheckout } from "@/lib/early-bird";
import { TrackRecentView } from "@/components/TrackRecentView";
import { listingPageMetadata, productJsonLd } from "@/lib/listing-seo";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const crop = await prisma.futureHarvest.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      priceAmd: true,
      status: true,
      imageUrls: true,
      marz: { select: { slug: true } },
    },
  });
  if (!crop || crop.status === "HIDDEN") return {};
  const t = await getTranslations({ locale, namespace: "seo" });
  const tRoot = await getTranslations({ locale });
  const region = tRoot(`marzes.${crop.marz.slug}` as "marzes.Yerevan");
  const priceLabel =
    crop.priceAmd != null
      ? `${formatAmd(crop.priceAmd, locale)} ֏`
      : t("listing.priceOpen");
  return listingPageMetadata({
    locale,
    path: `/forward/${id}`,
    title: crop.title,
    descriptionKey: "listing.forwardDesc",
    priceLabel,
    region,
    imageUrlsJson: crop.imageUrls,
    body: crop.description,
  });
}

export default async function ForwardDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();

  const crop = await prisma.futureHarvest.findUnique({
    where: { id },
    include: {
      product: true,
      marz: true,
      village: true,
      plot: true,
      user: { select: { id: true, name: true, farmId: true, farmVerified: true } },
      preOffers: {
        include: { fromUser: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!crop || crop.status === "HIDDEN") notFound();

  const reserved = crop.preOffers
    .filter((i) => i.status !== "DECLINED")
    .reduce((s, i) => s + i.qtyWanted, 0);
  const isOwner = session?.user?.id === crop.userId;
  const farmScore = await getFarmScore(crop.userId);
  const boostMap = await getActiveBoostMap("FUTURE_HARVEST", [crop.id]);
  const boostedUntil = boostMap.get(crop.id);
  const ownerEnt =
    isOwner && session?.user?.id ? await getUserEntitlements(session.user.id) : null;
  const ownerFreeCheckout =
    isOwner && session?.user?.id
      ? await resolveOwnerFreeCheckout(session.user.id)
      : false;
  const viewerEnt = session?.user?.id
    ? await getUserEntitlements(session.user.id)
    : null;
  const daysToHarvest = Math.ceil(
    (crop.harvestDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const earlyAccessLocked =
    !isOwner && daysToHarvest > 14 && !viewerEnt?.isBuyerPro;
  const images = parseImageUrls(crop.imageUrls ?? "[]");

  const matchingDemand = await prisma.demand.findMany({
    where: { status: "ACTIVE", productId: crop.productId },
    include: { user: { select: { name: true } }, marz: true },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="section detail-page">
      <JsonLd
        data={[
          breadcrumbJsonLd(locale, [
            { href: "/", label: t("nav.home") },
            { href: "/forward", label: t("forwardBoard.title") },
            { label: crop.title },
          ]),
          productJsonLd({
            name: crop.title,
            description: crop.description || crop.title,
            url: absoluteUrl(locale, `/forward/${crop.id}`),
            image: images[0] ?? null,
            priceAmd: crop.priceAmd,
            region: t(`marzes.${crop.marz.slug}` as "marzes.Yerevan"),
          }),
        ]}
      />
      <TrackRecentView
        id={crop.id}
        href={`/forward/${crop.id}`}
        title={crop.title}
        kind="forward"
        thumb={images[0] ?? null}
        subtitle={t(crop.product.nameKey as "products.tomato")}
      />
      <p className="eyebrow">{t("actions.forward.title")}</p>
      <ListingGallery images={images} />
      <h1>{crop.title}</h1>
      <p className="detail-product">{t(crop.product.nameKey as "products.tomato")}</p>
      <p className="detail-location">
        {crop.village ? (
          <>
            <VillageLink village={crop.village} locale={locale} />
            {", "}
          </>
        ) : null}
        {t(`marzes.${crop.marz.slug}` as "marzes.Yerevan")}
      </p>
      {crop.plot ? (
        <p className="muted">
          <Link href={`/plots/${crop.plot.id}`}>{crop.plot.name}</Link>
        </p>
      ) : null}
      <div className="detail-stats">
        <div>
          <span>{t("forwardForm.qty")}</span>
          <strong>
            {formatAmd(crop.qtyExpected)} {t(`units.${crop.unit}` as "units.kg")}
          </strong>
        </div>
        <div>
          <span>{t("forwardForm.harvestDate")}</span>
          <strong>{crop.harvestDate.toISOString().slice(0, 10)}</strong>
        </div>
        <div>
          <span>{t("forwardBoard.interestQty")}</span>
          <strong>
            {reserved} / {crop.qtyExpected}
          </strong>
        </div>
      </div>
      <p className="pre-wrap">{crop.description}</p>
      <ShareButtons
        title={crop.title}
        priceSnippet={`${formatAmd(crop.qtyExpected)} ${t(`units.${crop.unit}` as "units.kg")}`}
      />

      {earlyAccessLocked ? (
        <div className="buyer-pro-gate">
          <p>{t("pricing.buyerPro.f1")}</p>
          <Link href="/pricing" className="btn primary">
            {t("pricing.buyerPro.cta")}
          </Link>
        </div>
      ) : (
        <OwnerContactActions
          ownerId={crop.userId}
          phone={crop.phone}
          whatsapp={crop.whatsapp}
        />
      )}

      {crop.user.farmId ? (
        <p className="farm-link-row">
          <Link href={`/farms/${crop.user.farmId}`}>
            {crop.user.name} · {formatFarmId(crop.user.farmId)}
          </Link>
          {farmScore?.trusted ? <TrustedPill score={farmScore.score} /> : null}
        </p>
      ) : null}

      {isOwner ? (
        <div className="passport-create-batch owner-panel">
          <MyListingActions
            id={crop.id}
            status={crop.status}
            apiBase="/api/forward"
            editHref={`/forward/${crop.id}/edit`}
          />
          <BoostButton
            targetType="FUTURE_HARVEST"
            targetId={crop.id}
            isPro={Boolean(ownerEnt?.isPro)}
            boostQuotaRemaining={ownerEnt?.boostQuotaRemaining ?? 0}
            currentlyBoostedUntil={boostedUntil?.toISOString() ?? null}
            freeMode={ownerFreeCheckout}
          />
          <CreateBatchButton futureHarvestId={crop.id} />
        </div>
      ) : null}

      {isOwner && crop.preOffers.length > 0 ? (
        <section className="match-section">
          <h2>{t("plots.preOffers")}</h2>
          <ul className="match-list">
            {crop.preOffers.map((o) => (
              <li key={o.id} className="match-row">
                <div>
                  <strong>{o.fromUser.name}</strong>
                  <p>
                    {o.qtyWanted} {t(`units.${crop.unit}` as "units.kg")} · {o.status}
                    {o.message ? ` — ${o.message}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {matchingDemand.length > 0 ? (
        <section className="match-section">
          <h2>{t("plots.matchingDemand")}</h2>
          <ul className="match-list">
            {matchingDemand.map((d) => (
              <li key={d.id} className="match-row">
                <div>
                  <Link href={`/demand/${d.id}`}>
                    <strong>{d.title}</strong>
                  </Link>
                  <p>
                    {d.qtyMin}
                    {d.qtyMax ? `–${d.qtyMax}` : "+"} {t(`units.${d.unit}` as "units.kg")} ·{" "}
                    {d.user.name}
                  </p>
                </div>
                <Link href={`/demand/${d.id}`} className="btn secondary dark">
                  {t("common.open")}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!isOwner ? (
        <section className="match-section">
          <h2>{t("forwardInterest.title")}</h2>
          <ForwardInterestForm futureHarvestId={crop.id} />
        </section>
      ) : null}
    </div>
  );
}
