import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { OwnerContactActions } from "@/components/OwnerContactActions";
import { ShareButtons } from "@/components/ShareButtons";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ListingGallery } from "@/components/ListingGallery";
import { AnimalTypeIcon, ActionIcon } from "@/components/AgIcons";
import { AnimalListingActions } from "@/components/AnimalListingActions";
import { CommentSection } from "@/components/CommentSection";
import { VillageLink } from "@/components/VillageLink";
import { PostCard } from "@/components/PostCard";
import { tContent } from "@/lib/content-locale";
import { formatAmd, parseImageUrls } from "@/lib/utils";
import { getSession } from "@/lib/session";
import { BoostButton } from "@/components/BoostButton";
import { ReportListingButton } from "@/components/ReportListingButton";
import { getActiveBoostMap, getUserEntitlements } from "@/lib/monetization";
import { resolveOwnerFreeCheckout } from "@/lib/early-bird";
import { TrackRecentView } from "@/components/TrackRecentView";
import { SellerCard } from "@/components/SellerCard";
import { USER_PROFILE_SELECT } from "@/lib/profile-privacy";

export const dynamic = "force-dynamic";

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
      user: { select: USER_PROFILE_SELECT },
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
  const ownerFreeCheckout =
    isOwner && session?.user?.id
      ? await resolveOwnerFreeCheckout(session.user.id)
      : false;

  const similar = await prisma.animalListing.findMany({
    where: {
      status: "ACTIVE",
      id: { not: listing.id },
      OR: [{ animalType: listing.animalType }, { marzId: listing.marzId }],
    },
    include: { marz: true, village: true },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

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
    <div className="section detail-page machinery-detail detail-listam">
      <TrackRecentView
        id={listing.id}
        href={`/animals/${listing.id}`}
        title={title}
        kind="animals"
        thumb={images[0] ?? null}
        subtitle={listing.breed}
      />
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
          </div>

          <CommentSection targetType="ANIMAL" targetId={listing.id} />
        </div>

        <aside className="detail-split-aside">
          <div className="detail-offer-card">
            <p className="eyebrow">
              <AnimalTypeIcon type={listing.animalType} size={16} />{" "}
              {t("nav.animals")}
              {statusBadge ? ` · ${statusBadge}` : null}
            </p>
            <h1 className="detail-offer-title">{title}</h1>
            <p className="detail-offer-price">{priceLabel}</p>
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
                listingPath={`/animals/${listing.id}`}
                listingTitle={title}
              />
            ) : null}
          </div>

          {similar.length > 0 ? (
            <div className="detail-similar">
              <h2>{t("home.animalsTitle")}</h2>
              <div className="detail-similar-list">
                {similar.map((a) => (
                  <PostCard
                    key={a.id}
                    href={`/animals/${a.id}`}
                    title={tContent(locale, a.title)}
                    thumb={parseImageUrls(a.imageUrls ?? "[]")[0]}
                    icon={<ActionIcon action="animals" size={22} />}
                    categoryPill={t(`animalTypes.${a.animalType}` as "animalTypes.COW")}
                    value={a.priceAmd != null ? `${formatAmd(a.priceAmd, locale)} ֏` : undefined}
                    place={
                      <span className="post-card-marz">
                        {t(`marzes.${a.marz.slug}` as "marzes.Yerevan")}
                      </span>
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}

          {isOwner ? (
            <section className="owner-panel">
              <h2>{t("myAnimals.manage")}</h2>
              <BoostButton
                targetType="ANIMAL"
                targetId={listing.id}
                isPro={Boolean(ownerEnt?.isPro)}
                boostQuotaRemaining={ownerEnt?.boostQuotaRemaining ?? 0}
                currentlyBoostedUntil={boostedUntil?.toISOString() ?? null}
                freeMode={ownerFreeCheckout}
              />
              <AnimalListingActions id={listing.id} status={listing.status} />
              <p className="muted">
                <Link href="/my/animals">{t("myAnimals.title")}</Link>
              </p>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
