import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { ContactActions } from "@/components/ContactActions";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ListingGallery } from "@/components/ListingGallery";
import { MachineryTypeIcon } from "@/components/AgIcons";
import { MachineryListingActions } from "@/components/MachineryListingActions";
import { CommentSection } from "@/components/CommentSection";
import { VillageLink } from "@/components/VillageLink";
import { formatAmd, parseImageUrls } from "@/lib/utils";
import { tContent } from "@/lib/content-locale";
import { getSession } from "@/lib/session";
import { BoostButton } from "@/components/BoostButton";
import { MonetizationPills } from "@/components/MonetizationBadges";
import { getActiveBoostMap, getUserEntitlements } from "@/lib/monetization";

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
      user: { select: { id: true, name: true } },
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
  const ownerEnt = isOwner && session?.user?.id
    ? await getUserEntitlements(session.user.id)
    : null;

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

  return (
    <div className="section detail-page machinery-detail">
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

      <ListingGallery images={images} />

      <p className="eyebrow">
        <MachineryTypeIcon type={listing.machineryType} size={16} />{" "}
        {t("pillars.machinery")}
        {statusBadge ? ` · ${statusBadge}` : null}
      </p>
      <h1>{title}</h1>
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

      <div className="detail-stats">
        <div>
          <span>{t("detail.price")}</span>
          <strong>{priceLabel}</strong>
        </div>
        <div>
          <span>{t("machinery.detail.condition")}</span>
          <strong>
            {t(`machineryConditions.${listing.condition}` as "machineryConditions.USED")}
          </strong>
        </div>
        {listing.powerHp != null ? (
          <div>
            <span>{t("machinery.detail.powerHp")}</span>
            <strong>
              {listing.powerHp} {t("machinery.hp")}
            </strong>
          </div>
        ) : null}
      </div>

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
        <p className="muted">
          {t("detail.postedBy")} {listing.user.name}
        </p>
      </div>

      <ContactActions
        phone={listing.phone}
        whatsapp={listing.whatsapp}
        waText={
          locale === "hy"
            ? `Բարև, հետաքրքրված եմ տեխնիկայով՝ ${title}`
            : locale === "ru"
              ? `Здравствуйте, интересуюсь техникой: ${title}`
              : `Hi, interested in machinery: ${title}`
        }
      />

      <CommentSection targetType="MACHINERY" targetId={listing.id} />

      {isOwner ? (
        <section className="owner-panel">
          <h2>{t("myMachinery.manage")}</h2>
          <BoostButton
            targetType="MACHINERY"
            targetId={listing.id}
            isPro={Boolean(ownerEnt?.isPro)}
            boostQuotaRemaining={ownerEnt?.boostQuotaRemaining ?? 0}
            currentlyBoostedUntil={boostedUntil?.toISOString() ?? null}
          />
          <MachineryListingActions id={listing.id} status={listing.status} />
          <p className="muted">
            <Link href="/my/machinery">{t("myMachinery.title")}</Link>
          </p>
        </section>
      ) : null}
    </div>
  );
}
