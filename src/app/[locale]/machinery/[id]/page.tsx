import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { OwnerContactActions } from "@/components/OwnerContactActions";
import { ShareButtons } from "@/components/ShareButtons";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ListingGallery } from "@/components/ListingGallery";
import { MachineryTypeIcon, ActionIcon } from "@/components/AgIcons";
import { MachineryListingActions } from "@/components/MachineryListingActions";
import { CommentSection } from "@/components/CommentSection";
import { VillageLink } from "@/components/VillageLink";
import { PostCard } from "@/components/PostCard";
import { formatAmd, parseImageUrls } from "@/lib/utils";
import { tContent } from "@/lib/content-locale";
import { getSession } from "@/lib/session";
import { BoostButton } from "@/components/BoostButton";
import { MonetizationPills } from "@/components/MonetizationBadges";
import { ReportListingButton } from "@/components/ReportListingButton";
import { getActiveBoostMap, getUserEntitlements } from "@/lib/monetization";
import { resolveOwnerFreeCheckout } from "@/lib/early-bird";
import { TrackRecentView } from "@/components/TrackRecentView";
import { SellerCard } from "@/components/SellerCard";
import { USER_PROFILE_SELECT } from "@/lib/profile-privacy";

export const dynamic = "force-dynamic";

export default async function MachineryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();

  const listing = await prisma.machineryListing.findUnique({
    where: { id },
    include: {
      marz: true,
      village: true,
      user: { select: USER_PROFILE_SELECT },
    },
  });
  if (!listing || listing.status === "HIDDEN") notFound();

  const title = tContent(locale, listing.title);
  const description = tContent(locale, listing.description);
  const marzLabel = t(`marzes.${listing.marz.slug}` as "marzes.Yerevan");
  const isOwner = session?.user?.id === listing.userId;
  const images = parseImageUrls(listing.imageUrls);
  const boostMap = await getActiveBoostMap("MACHINERY", [listing.id]);
  const boostedUntil = boostMap.get(listing.id);
  const seller = await prisma.user.findUnique({
    where: { id: listing.userId },
    select: { isPro: true, proUntil: true },
  });
  const sellerPro =
    Boolean(seller?.isPro && seller.proUntil && seller.proUntil > new Date());
  const ownerEnt =
    isOwner && session?.user?.id ? await getUserEntitlements(session.user.id) : null;
  const ownerFreeCheckout =
    isOwner && session?.user?.id
      ? await resolveOwnerFreeCheckout(session.user.id)
      : false;

  const similar = await prisma.machineryListing.findMany({
    where: {
      status: "ACTIVE",
      id: { not: listing.id },
      OR: [{ machineryType: listing.machineryType }, { marzId: listing.marzId }],
    },
    include: { marz: true, village: true },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const specs: { label: string; value: string }[] = [
    {
      label: t("machinery.detail.type"),
      value: t(`machineryTypes.${listing.machineryType}` as "machineryTypes.TRACTOR"),
    },
    { label: t("machinery.detail.make"), value: listing.make },
    { label: t("machinery.detail.model"), value: listing.model },
    { label: t("machinery.detail.year"), value: String(listing.year) },
    {
      label: t("machinery.detail.condition"),
      value: t(`machineryConditions.${listing.condition}` as "machineryConditions.USED"),
    },
  ];
  if (listing.powerHp != null) {
    specs.push({ label: t("machinery.detail.powerHp"), value: `${listing.powerHp} ${t("machinery.hp")}` });
  }
  if (listing.engineHours != null) {
    specs.push({
      label: t("machinery.detail.engineHours"),
      value: t("machinery.hours", { n: formatAmd(listing.engineHours) }),
    });
  }
  if (listing.mileageKm != null) {
    specs.push({
      label: t("machinery.detail.mileageKm"),
      value: t("machinery.km", { n: formatAmd(listing.mileageKm) }),
    });
  }
  if (listing.transmission) {
    specs.push({ label: t("machinery.detail.transmission"), value: listing.transmission });
  }
  if (listing.driveType) {
    specs.push({ label: t("machinery.detail.driveType"), value: listing.driveType });
  }
  if (listing.fuel) {
    specs.push({ label: t("machinery.detail.fuel"), value: listing.fuel });
  }
  if (listing.workingWidth) {
    specs.push({ label: t("machinery.detail.workingWidth"), value: listing.workingWidth });
  }
  if (listing.capacity) {
    specs.push({ label: t("machinery.detail.capacity"), value: listing.capacity });
  }

  let priceLabel = t("detail.priceOpen");
  if (listing.priceAmd != null) {
    priceLabel = `${formatAmd(listing.priceAmd)} ֏`;
    if (listing.priceNegotiable) priceLabel += ` · ${t("machinery.negotiable")}`;
  } else if (listing.priceNegotiable) {
    priceLabel = t("detail.priceOpen");
  }

  const statusBadge =
    listing.status === "SOLD"
      ? t("machinery.status.SOLD")
      : listing.status === "ACTIVE"
        ? null
        : listing.status;

  const waText =
    locale === "hy"
      ? `Բարև, հետաքրքրված եմ տեխնիկայով՝ ${title}`
      : locale === "ru"
        ? `Здравствуйте, интересуюсь техникой: ${title}`
        : `Hi, interested in machinery: ${title}`;

  return (
    <div className="section detail-page machinery-detail detail-listam">
      <TrackRecentView
        id={listing.id}
        href={`/machinery/${listing.id}`}
        title={title}
        kind="machinery"
        thumb={images[0] ?? null}
        subtitle={`${listing.make} ${listing.model}`}
      />
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { href: "/machinery", label: t("machineryBoard.title") },
          {
            href: `/machinery?type=${listing.machineryType}`,
            label: t(`machineryTypes.${listing.machineryType}` as "machineryTypes.TRACTOR"),
          },
          { href: `/machinery?marz=${listing.marzId}`, label: marzLabel },
          { label: title },
        ]}
      />

      <div className="detail-split">
        <div className="detail-split-main">
          <ListingGallery images={images} />

          <div className="specs-grid">
            {specs.map((s) => (
              <div key={s.label} className="spec-cell">
                <span>{s.label}</span>
                <strong>{s.value}</strong>
              </div>
            ))}
          </div>

          {listing.attachments ? (
            <div className="detail-body">
              <h2>{t("machinery.detail.attachments")}</h2>
              <p className="pre-wrap detail-desc">{listing.attachments}</p>
            </div>
          ) : null}

          {listing.documentsNote ? (
            <div className="detail-body">
              <h2>{t("machinery.detail.documentsNote")}</h2>
              <p className="pre-wrap detail-desc">{listing.documentsNote}</p>
            </div>
          ) : null}

          <div className="detail-body">
            <h2>{t("detail.description")}</h2>
            <p className="pre-wrap detail-desc">{description}</p>
          </div>

          <CommentSection targetType="MACHINERY" targetId={listing.id} />
        </div>

        <aside className="detail-split-aside">
          <div className="detail-offer-card">
            <p className="eyebrow">
              <MachineryTypeIcon type={listing.machineryType} size={16} />{" "}
              {t("pillars.machinery")}
              {statusBadge ? ` · ${statusBadge}` : null}
            </p>
            <h1 className="detail-offer-title">{title}</h1>
            <p className="detail-offer-price">{priceLabel}</p>
            <p className="detail-product">
              {listing.make} {listing.model} · {listing.year}{" "}
              <MonetizationPills isPro={sellerPro} boosted={Boolean(boostedUntil)} />
            </p>
            <p className="detail-location">
              {listing.village ? (
                <>
                  <VillageLink village={listing.village} locale={locale} />
                  {", "}
                </>
              ) : null}
              {marzLabel}
            </p>

            <SellerCard
              user={listing.user}
              viewerId={session?.user?.id}
              locale={locale}
            />

            <OwnerContactActions
              ownerId={listing.userId}
              phone={listing.phone}
              whatsapp={listing.whatsapp}
              waText={waText}
            />
            <ShareButtons title={title} priceSnippet={priceLabel} />

            {!isOwner ? (
              <ReportListingButton
                listingPath={`/machinery/${listing.id}`}
                listingTitle={title}
              />
            ) : null}
          </div>

          {similar.length > 0 ? (
            <div className="detail-similar">
              <h2>{t("home.machineryTitle")}</h2>
              <div className="detail-similar-list">
                {similar.map((m) => (
                  <PostCard
                    key={m.id}
                    href={`/machinery/${m.id}`}
                    title={tContent(locale, m.title)}
                    thumb={parseImageUrls(m.imageUrls ?? "[]")[0]}
                    icon={<ActionIcon action="machinery" size={22} />}
                    categoryPill={t(
                      `machineryTypes.${m.machineryType}` as "machineryTypes.TRACTOR",
                    )}
                    value={m.priceAmd != null ? `${formatAmd(m.priceAmd, locale)} ֏` : undefined}
                    place={
                      <span className="post-card-marz">
                        {t(`marzes.${m.marz.slug}` as "marzes.Yerevan")}
                      </span>
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}

          {isOwner ? (
            <section className="owner-panel">
              <h2>{t("myMachinery.manage")}</h2>
              <BoostButton
                targetType="MACHINERY"
                targetId={listing.id}
                isPro={Boolean(ownerEnt?.isPro)}
                boostQuotaRemaining={ownerEnt?.boostQuotaRemaining ?? 0}
                currentlyBoostedUntil={boostedUntil?.toISOString() ?? null}
                freeMode={ownerFreeCheckout}
              />
              <MachineryListingActions id={listing.id} status={listing.status} />
              <p className="muted">
                <Link href="/my/machinery">{t("myMachinery.title")}</Link>
              </p>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
