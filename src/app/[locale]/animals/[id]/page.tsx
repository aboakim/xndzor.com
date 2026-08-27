import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { ContactActions } from "@/components/ContactActions";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ListingGallery } from "@/components/ListingGallery";
import { AnimalTypeIcon } from "@/components/AgIcons";
import { AnimalListingActions } from "@/components/AnimalListingActions";
import { CommentSection } from "@/components/CommentSection";
import { VillageLink } from "@/components/VillageLink";
import { tContent } from "@/lib/content-locale";
import { formatAmd, parseImageUrls } from "@/lib/utils";
import { getSession } from "@/lib/session";
import { BoostButton } from "@/components/BoostButton";
import { getActiveBoostMap, getUserEntitlements } from "@/lib/monetization";

export default async function AnimalDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();

  const listing = await prisma.animalListing.findUnique({
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
  const boostMap = await getActiveBoostMap("ANIMAL", [listing.id]);
  const boostedUntil = boostMap.get(listing.id);
  const ownerEnt =
    isOwner && session?.user?.id ? await getUserEntitlements(session.user.id) : null;

  const specs: { label: string; value: string }[] = [
    {
      label: t("animals.detail.type"),
      value: t(`animalTypes.${listing.animalType}` as "animalTypes.COW"),
    },
    { label: t("animals.detail.breed"), value: listing.breed },
    {
      label: t("animals.detail.sex"),
      value: t(`animalSexes.${listing.sex}` as "animalSexes.MIXED"),
    },
    {
      label: t("animals.detail.purpose"),
      value: t(`animalPurposes.${listing.purpose}` as "animalPurposes.DAIRY"),
    },
    { label: t("animals.detail.quantity"), value: t("animals.heads", { n: listing.quantity }) },
  ];
  if (listing.ageValue != null) {
    specs.push({
      label: t("animals.detail.age"),
      value: `${listing.ageValue} ${t(`animalAgeUnits.${listing.ageUnit}` as "animalAgeUnits.MONTHS")}`,
    });
  }
  if (listing.weightKg != null) {
    specs.push({
      label: t("animals.detail.weight"),
      value: `${listing.weightKg} ${t("animals.kg")}`,
    });
  }
  specs.push({
    label: t("animals.detail.vaccinated"),
    value: listing.vaccinated ? t("animals.yes") : t("animals.no"),
  });

  let priceLabel = t("detail.priceOpen");
  if (listing.priceAmd != null) {
    priceLabel = `${formatAmd(listing.priceAmd, locale)} ֏`;
    if (listing.priceMode === "PER_HEAD") priceLabel += ` / ${t("animals.perHead")}`;
    if (listing.priceNegotiable) priceLabel += ` · ${t("animals.negotiable")}`;
  } else if (listing.priceNegotiable) {
    priceLabel = t("detail.priceOpen");
  }

  const statusBadge =
    listing.status === "SOLD"
      ? t("animals.status.SOLD")
      : listing.status === "ACTIVE"
        ? null
        : listing.status;

  const waText =
    locale === "hy"
      ? `Բարև, հետաքրքրված եմ կենդանիներով՝ ${title}`
      : locale === "ru"
        ? `Здравствуйте, интересуюсь животными: ${title}`
        : `Hi, interested in animals: ${title}`;

  return (
    <div className="section detail-page machinery-detail">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { href: "/animals", label: t("animalsBoard.title") },
          {
            href: `/animals?type=${listing.animalType}`,
            label: t(`animalTypes.${listing.animalType}` as "animalTypes.COW"),
          },
          { href: `/animals?marz=${listing.marzId}`, label: marzLabel },
          { label: title },
        ]}
      />

      <ListingGallery images={images} />

      <p className="eyebrow">
        <AnimalTypeIcon type={listing.animalType} size={16} />{" "}
        {t("nav.animals")}
        {statusBadge ? ` · ${statusBadge}` : null}
      </p>
      <h1>{title}</h1>
      <p className="detail-product">
        {listing.breed} · {t(`animalPurposes.${listing.purpose}` as "animalPurposes.DAIRY")}
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
          <span>{t("animals.detail.quantity")}</span>
          <strong>{t("animals.heads", { n: listing.quantity })}</strong>
        </div>
        <div>
          <span>{t("animals.detail.sex")}</span>
          <strong>{t(`animalSexes.${listing.sex}` as "animalSexes.MIXED")}</strong>
        </div>
      </div>

      <div className="specs-grid">
        {specs.map((s) => (
          <div key={s.label} className="spec-cell">
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </div>
        ))}
      </div>

      {listing.healthNotes ? (
        <div className="detail-body">
          <h2>{t("animals.detail.healthNotes")}</h2>
          <p className="pre-wrap detail-desc">{tContent(locale, listing.healthNotes)}</p>
        </div>
      ) : null}

      {listing.pedigreeNote ? (
        <div className="detail-body">
          <h2>{t("animals.detail.pedigreeNote")}</h2>
          <p className="pre-wrap detail-desc">{tContent(locale, listing.pedigreeNote)}</p>
        </div>
      ) : null}

      {listing.documentsNote ? (
        <div className="detail-body">
          <h2>{t("animals.detail.documentsNote")}</h2>
          <p className="pre-wrap detail-desc">{tContent(locale, listing.documentsNote)}</p>
        </div>
      ) : null}

      <div className="detail-body">
        <h2>{t("detail.description")}</h2>
        <p className="pre-wrap detail-desc">{description}</p>
        <p className="muted">
          {t("detail.postedBy")} {listing.user.name}
        </p>
      </div>

      <ContactActions phone={listing.phone} whatsapp={listing.whatsapp} waText={waText} />

      <CommentSection targetType="ANIMAL" targetId={listing.id} />

      {isOwner ? (
        <section className="owner-panel">
          <h2>{t("myAnimals.manage")}</h2>
          <BoostButton
            targetType="ANIMAL"
            targetId={listing.id}
            isPro={Boolean(ownerEnt?.isPro)}
            boostQuotaRemaining={ownerEnt?.boostQuotaRemaining ?? 0}
            currentlyBoostedUntil={boostedUntil?.toISOString() ?? null}
          />
          <AnimalListingActions id={listing.id} status={listing.status} />
          <p className="muted">
            <Link href="/my/animals">{t("myAnimals.title")}</Link>
          </p>
        </section>
      ) : null}
    </div>
  );
}
