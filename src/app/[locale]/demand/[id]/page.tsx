import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { OwnerContactActions } from "@/components/OwnerContactActions";
import { ShareButtons } from "@/components/ShareButtons";
import { OfferButton } from "@/components/OfferButton";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ListingGallery } from "@/components/ListingGallery";
import { findMatchesForDemand } from "@/lib/matching";
import { formatAmd, formatPriceRange, formatQty, parseImageUrls } from "@/lib/utils";
import { localizedPlaceName } from "@/lib/places";
import { getSession } from "@/lib/session";
import { ProductIcon } from "@/components/AgIcons";
import { VillageLink } from "@/components/VillageLink";
import { SellerCard } from "@/components/SellerCard";
import { USER_PROFILE_SELECT } from "@/lib/profile-privacy";
import { MyListingActions } from "@/components/MyListingActions";

export const dynamic = "force-dynamic";

export default async function DemandDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();

  const demand = await prisma.demand.findUnique({
    where: { id },
    include: {
      product: true,
      marz: true,
      village: true,
      user: { select: USER_PROFILE_SELECT },
    },
  });
  if (!demand || demand.status === "HIDDEN") notFound();
  const isOwner = session?.user?.id === demand.userId;

  const supplies = await prisma.supply.findMany({
    where: { status: "ACTIVE", productId: demand.productId },
    include: { product: true, marz: true, village: true, user: { select: { name: true } } },
  });

  const matches = findMatchesForDemand(demand, supplies);
  const byId = Object.fromEntries(supplies.map((s) => [s.id, s]));
  const ranked = matches.map((m) => ({ ...m, supply: byId[m.supplyId] })).filter((m) => m.supply);

  const marzLabel = t(`marzes.${demand.marz.slug}` as "marzes.Yerevan");
  const images = parseImageUrls(demand.imageUrls);
  const priceLabel =
    formatPriceRange(demand.priceMinAmd, demand.priceMaxAmd, demand.unit, (k) =>
      t(k as "common.amd")
    ) || t("detail.priceOpen");

  return (
    <div className="section detail-page detail-listam">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { href: "/demand", label: t("demandBoard.title") },
          {
            href: `/demand?product=${demand.product.slug}`,
            label: t(demand.product.nameKey as "products.tomato"),
          },
          { href: `/demand?marz=${demand.marzId}`, label: marzLabel },
          { label: demand.title },
        ]}
      />

      <div className="detail-split">
        <div className="detail-split-main">
          <ListingGallery images={images} />

          <div className="detail-body">
            <h2>{t("detail.description")}</h2>
            <p className="pre-wrap detail-desc">{demand.description}</p>
          </div>

          <section className="match-section">
            <h2>{t("detail.matchingSupply")}</h2>
            {ranked.length === 0 ? (
              <p className="empty-state">{t("detail.noMatches")}</p>
            ) : (
              <ul className="match-list">
                {ranked.map(({ supply, score, reasons }) => (
                  <li key={supply.id} className="match-row">
                    <div>
                      <Link href={`/supply/${supply.id}`}>
                        <strong>{supply.title}</strong>
                      </Link>
                      <p>
                        {formatQty(supply.qtyAvailable, null, supply.unit, (k) =>
                          t(k as "units.kg")
                        )}
                        {supply.priceAmd != null
                          ? ` · ${formatAmd(supply.priceAmd)} ${t("common.amd")}`
                          : ""}
                        {" · "}
                        {supply.village ? `${localizedPlaceName(supply.village, locale)}, ` : ""}
                        {t(`marzes.${supply.marz.slug}` as "marzes.Yerevan")}
                      </p>
                      <p className="match-score">
                        {t("detail.score", { score })} ·{" "}
                        {reasons
                          .map((r) => t(`reasons.${r}` as "reasons.same_product"))
                          .join(", ")}
                      </p>
                    </div>
                    <div className="match-actions">
                      <OwnerContactActions
                        ownerId={supply.userId}
                        phone={supply.phone}
                        whatsapp={supply.whatsapp}
                      />
                      {session?.user?.id === supply.userId ||
                      session?.user?.id === demand.userId ? (
                        <OfferButton supplyId={supply.id} demandId={demand.id} />
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="detail-split-aside">
          <div className="detail-offer-card">
            <p className="eyebrow">{t("pillars.demand")}</p>
            <h1 className="detail-offer-title">{demand.title}</h1>
            <p className="detail-offer-price">{priceLabel}</p>
            <p className="detail-product">
              <ProductIcon slugOrKey={demand.product.slug} size={18} />
              {t(demand.product.nameKey as "products.tomato")}
            </p>
            <p className="detail-location">
              {demand.village ? (
                <>
                  <VillageLink village={demand.village} locale={locale} />
                  {", "}
                </>
              ) : null}
              {marzLabel}
            </p>

            <div className="detail-stats">
              <div>
                <span>{t("detail.qty")}</span>
                <strong>
                  {formatQty(demand.qtyMin, demand.qtyMax, demand.unit, (k) => t(k as "units.kg"))}
                </strong>
              </div>
              <div>
                <span>{t("detail.price")}</span>
                <strong>{priceLabel}</strong>
              </div>
              {demand.timingNote ? (
                <div>
                  <span>{t("detail.timing")}</span>
                  <strong>{demand.timingNote}</strong>
                </div>
              ) : null}
            </div>

            <SellerCard
              user={demand.user}
              viewerId={session?.user?.id}
              locale={locale}
              compact
            />

            <ShareButtons title={demand.title} priceSnippet={priceLabel} />

            <OwnerContactActions
              ownerId={demand.userId}
              phone={demand.phone}
              whatsapp={demand.whatsapp}
              waText={
                locale === "hy"
                  ? `Բարև, կարող եմ մատակարարել՝ ${demand.title}`
                  : `Hi, I can supply for: ${demand.title}`
              }
            />

            {isOwner ? (
              <section className="owner-panel">
                <MyListingActions id={demand.id} status={demand.status} apiBase="/api/demand" />
              </section>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
