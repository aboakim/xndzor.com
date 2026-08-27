import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { ContactActions } from "@/components/ContactActions";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ListingGallery } from "@/components/ListingGallery";
import { CatalogListingActions } from "@/components/CatalogListingActions";
import { CommentSection } from "@/components/CommentSection";
import { VillageLink } from "@/components/VillageLink";
import { ActionIcon } from "@/components/AgIcons";
import {
  CATALOG_ROUTE,
  CATALOG_SPEC_FIELDS,
  categoryFromRoute,
  parseSpecs,
  type CatalogCategory,
} from "@/lib/catalog";
import { tContent, formatLocaleDate } from "@/lib/content-locale";
import { formatAmd, parseImageUrls } from "@/lib/utils";
import { getSession } from "@/lib/session";
import { BoostButton } from "@/components/BoostButton";
import { getActiveBoostMap, getUserEntitlements } from "@/lib/monetization";

export default async function CatalogDetailPage({
  params,
}: {
  params: Promise<{ locale: string; category: string; id: string }>;
}) {
  const { locale, category: slug, id } = await params;
  const category = categoryFromRoute(slug);
  if (!category) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  const route = CATALOG_ROUTE[category];

  const listing = await prisma.catalogListing.findUnique({
    where: { id },
    include: { marz: true, village: true, user: { select: { id: true, name: true } } },
  });
  if (!listing || listing.status === "HIDDEN" || listing.category !== category) notFound();

  const title = tContent(locale, listing.title);
  const description = tContent(locale, listing.description);
  const marzLabel = t(`marzes.${listing.marz.slug}` as "marzes.Yerevan");
  const isOwner = session?.user?.id === listing.userId;
  const images = parseImageUrls(listing.imageUrls);
  const specs = parseSpecs(listing.specsJson);
  const boostMap = await getActiveBoostMap("CATALOG", [listing.id]);
  const boostedUntil = boostMap.get(listing.id);
  const ownerEnt =
    isOwner && session?.user?.id ? await getUserEntitlements(session.user.id) : null;

  const specCells: { label: string; value: string }[] = [
    {
      label: t("catalogBoard.subtype"),
      value: t(`catalogSubtypes.${category}.${listing.subtype}` as "catalogSubtypes.FERTILIZER.NPK"),
    },
  ];
  if (listing.brand) specCells.push({ label: t("postCatalog.fields.brand"), value: listing.brand });
  if (listing.quantity != null) {
    specCells.push({
      label: t("postCatalog.fields.quantity"),
      value: `${listing.quantity}${listing.unit ? ` ${t(`catalogUnits.${listing.unit}` as "catalogUnits.kg")}` : ""}`,
    });
  }
  if (listing.packageSize) {
    specCells.push({ label: t("postCatalog.fields.packageSize"), value: listing.packageSize });
  }
  if (listing.expiryDate) {
    specCells.push({
      label: t("postCatalog.fields.expiryDate"),
      value: formatLocaleDate(listing.expiryDate, locale),
    });
  }
  for (const field of CATALOG_SPEC_FIELDS[category as CatalogCategory]) {
    const v = specs[field.key];
    if (v == null || v === "") continue;
    const display =
      typeof v === "boolean"
        ? v
          ? t("animals.yes")
          : t("animals.no")
        : String(v);
    specCells.push({
      label: t(`catalogSpecs.${field.key}` as "catalogSpecs.composition"),
      value: display,
    });
  }

  let priceLabel = t("detail.priceOpen");
  if (listing.priceAmd != null) {
    priceLabel = `${formatAmd(listing.priceAmd, locale)} ֏ · ${t(`catalogPriceUnits.${listing.priceUnit}` as "catalogPriceUnits.LOT")}`;
    if (listing.priceNegotiable) priceLabel += ` · ${t("catalog.negotiable")}`;
  }

  const waText =
    locale === "hy"
      ? `Բարև, հետաքրքրված եմ՝ ${title}`
      : locale === "ru"
        ? `Здравствуйте, интересуюсь: ${title}`
        : `Hi, interested in: ${title}`;

  return (
    <div className="section detail-page machinery-detail">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          {
            href: `/shop/${route}`,
            label: t(`catalogCategories.${category}` as "catalogCategories.FERTILIZER"),
          },
          { label: title },
        ]}
      />

      <ListingGallery images={images} />

      <p className="eyebrow">
        <ActionIcon action={route} size={16} />{" "}
        {t(`catalogCategories.${category}` as "catalogCategories.FERTILIZER")}
      </p>
      <h1>{title}</h1>
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
          <span>{t("catalogBoard.subtype")}</span>
          <strong>
            {t(`catalogSubtypes.${category}.${listing.subtype}` as "catalogSubtypes.FERTILIZER.NPK")}
          </strong>
        </div>
        {listing.quantity != null ? (
          <div>
            <span>{t("postCatalog.fields.quantity")}</span>
            <strong>
              {listing.quantity}
              {listing.unit ? ` ${t(`catalogUnits.${listing.unit}` as "catalogUnits.kg")}` : ""}
            </strong>
          </div>
        ) : null}
      </div>

      <div className="specs-grid">
        {specCells.map((s) => (
          <div key={s.label} className="spec-cell">
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </div>
        ))}
      </div>

      {category === "CHEMICAL" ? (
        <p className="disclaimer muted">{t("catalog.chemicalDisclaimer")}</p>
      ) : null}

      <div className="detail-body">
        <h2>{t("detail.description")}</h2>
        <p className="pre-wrap detail-desc">{description}</p>
        <p className="muted">
          {t("detail.postedBy")} {listing.user.name}
        </p>
      </div>

      <ContactActions phone={listing.phone} whatsapp={listing.whatsapp} waText={waText} />

      <CommentSection targetType="CATALOG" targetId={listing.id} />

      {isOwner ? (
        <section className="owner-panel">
          <h2>{t("myCatalog.manage")}</h2>
          <BoostButton
            targetType="CATALOG"
            targetId={listing.id}
            isPro={Boolean(ownerEnt?.isPro)}
            boostQuotaRemaining={ownerEnt?.boostQuotaRemaining ?? 0}
            currentlyBoostedUntil={boostedUntil?.toISOString() ?? null}
          />
          <CatalogListingActions id={listing.id} status={listing.status} />
          <p className="muted">
            <Link href="/my/shop">{t("myCatalog.title")}</Link>
          </p>
        </section>
      ) : null}
    </div>
  );
}
