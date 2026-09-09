import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { OwnerContactActions } from "@/components/OwnerContactActions";
import { ShareButtons } from "@/components/ShareButtons";
import { OfferButton } from "@/components/OfferButton";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ListingGallery } from "@/components/ListingGallery";
import { findMatchesForSupply } from "@/lib/matching";
import { formatAmd, formatPriceRange, formatQty, parseImageUrls } from "@/lib/utils";
import { localizedPlaceName } from "@/lib/places";
import { getSession } from "@/lib/session";
import { BoostButton } from "@/components/BoostButton";
import { MyListingActions } from "@/components/MyListingActions";
import { ReportListingButton } from "@/components/ReportListingButton";
import { getActiveBoostMap, getUserEntitlements } from "@/lib/monetization";
import { resolveOwnerFreeCheckout } from "@/lib/early-bird";
import { ProductIcon } from "@/components/AgIcons";
import { VillageLink } from "@/components/VillageLink";
import { TrackRecentView } from "@/components/TrackRecentView";
import { SellerCard } from "@/components/SellerCard";
import { USER_PROFILE_SELECT } from "@/lib/profile-privacy";

export const dynamic = "force-dynamic";

export default async function SupplyDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();

  const supply = await prisma.supply.findUnique({
    where: { id },
    include: {
      product: true,
      marz: true,
      village: true,
      user: { select: USER_PROFILE_SELECT },
    },
  });
  if (!supply || supply.status === "HIDDEN") notFound();

  const demands = await prisma.demand.findMany({
    where: { status: "ACTIVE", productId: supply.productId },
    include: { product: true, marz: true, village: true, user: { select: { name: true } } },
  });

  const matches = findMatchesForSupply(supply, demands);
  const byId = Object.fromEntries(demands.map((d) => [d.id, d]));
  const ranked = matches.map((m) => ({ ...m, demand: byId[m.demandId] })).filter((m) => m.demand);

  const marzLabel = t(`marzes.${supply.marz.slug}` as "marzes.Yerevan");
  const isOwner = session?.user?.id === supply.userId;
  const images = parseImageUrls(supply.imageUrls);
  const boostMap = await getActiveBoostMap("SUPPLY", [supply.id]);
  const boostedUntil = boostMap.get(supply.id);
  const ownerEnt =
    isOwner && session?.user?.id ? await getUserEntitlements(session.user.id) : null;
  const ownerFreeCheckout =
    isOwner && session?.user?.id
      ? await resolveOwnerFreeCheckout(session.user.id)
      : false;

  const priceLabel =
    supply.priceAmd != null
      ? formatPriceRange(supply.priceAmd, supply.priceAmd, supply.unit, (k) =>
          t(k as "common.amd")
        )
      : t("detail.priceOpen");

  return (
    <div className="section detail-page detail-listam">
      <TrackRecentView
        id={supply.id}
        href={`/supply/${supply.id}`}
        title={supply.title}
        kind="supply"
        thumb={images[0] ?? null}
        subtitle={t(supply.product.nameKey as "products.tomato")}
      />
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { href: "/supply", label: t("supplyBoard.title") },
          {
            href: `/supply?product=${supply.product.slug}`,
            label: t(supply.product.nameKey as "products.tomato"),
          },
          { href: `/supply?marz=${supply.marzId}`, label: marzLabel },
          { label: supply.title },
        ]}
      />

      <div className="detail-split">
        <div className="detail-split-main">
          <ListingGallery images={images} />

          <div className="detail-body">
            <h2>{t("detail.description")}</h2>
            <p className="pre-wrap detail-desc">{supply.description}</p>
          </div>

          <section className="match-section killer-flow">
            <h2>{t("findBuyer.title")}</h2>
            <p className="lede">{t("findBuyer.lede")}</p>
            {ranked.length === 0 ? (
              <p className="empty-state">{t("detail.noMatches")}</p>
            ) : (
              <ul className="match-list">
                {ranked.map(({ demand, score, reasons }) => (
                  <li key={demand.id} className="match-row">
                    <div>
                      <Link href={`/demand/${demand.id}`}>
                        <strong>{demand.title}</strong>
                      </Link>
                      <p>
                        {formatQty(demand.qtyMin, demand.qtyMax, demand.unit, (k) =>
                          t(k as "units.kg")
                        )}
                        {demand.priceMaxAmd != null
                          ? ` · ≤ ${formatAmd(demand.priceMaxAmd)} ${t("common.amd")}`
                          : ""}
                        {" · "}
                        {demand.village ? `${localizedPlaceName(demand.village, locale)}, ` : ""}
                        {t(`marzes.${demand.marz.slug}` as "marzes.Yerevan")}
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
                        ownerId={demand.userId}
                        phone={demand.phone}
                        whatsapp={demand.whatsapp}
                      />
                      {isOwner ? (
                        <OfferButton
                          supplyId={supply.id}
                          demandId={demand.id}
                          defaultMessage={
                            locale === "hy"
                              ? `Կարող եմ մատակարարել ${supply.qtyAvailable} ${t(`units.${supply.unit}` as "units.kg")}.`
                              : `I can supply ${supply.qtyAvailable} ${supply.unit}.`
                          }
                        />
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
            <p className="eyebrow">{t("pillars.supply")}</p>
            <h1 className="detail-offer-title">{supply.title}</h1>
            <p className="detail-offer-price">{priceLabel}</p>
            <p className="detail-product">
              <ProductIcon slugOrKey={supply.product.slug} size={18} />
              {t(supply.product.nameKey as "products.tomato")}
            </p>
            <p className="detail-location">
              {supply.village ? (
                <>
                  <VillageLink village={supply.village} locale={locale} />
                  {", "}
                </>
              ) : null}
              {marzLabel}
            </p>

            <div className="detail-stats">
              <div>
                <span>{t("detail.qty")}</span>
                <strong>
                  {formatQty(supply.qtyAvailable, null, supply.unit, (k) => t(k as "units.kg"))}
                </strong>
              </div>
              <div>
                <span>{t("detail.price")}</span>
                <strong>{priceLabel}</strong>
              </div>
              <div>
                <span>{t("detail.ready")}</span>
                <strong>
                  {supply.readyInDays === 0
                    ? t("supply.readyNow")
                    : t("supply.readyIn", { days: supply.readyInDays })}
                </strong>
              </div>
            </div>

            <SellerCard
              user={supply.user}
              viewerId={session?.user?.id}
              locale={locale}
              compact
            />

            <ShareButtons title={supply.title} priceSnippet={priceLabel} />

            <OwnerContactActions
              ownerId={supply.userId}
              phone={supply.phone}
              whatsapp={supply.whatsapp}
              waText={
                locale === "hy"
                  ? `Բարև, հետաքրքրված եմ՝ ${supply.title}`
                  : `Hi, interested in: ${supply.title}`
              }
            />

            {!isOwner ? (
              <ReportListingButton
                listingPath={`/supply/${supply.id}`}
                listingTitle={supply.title}
              />
            ) : null}

            {isOwner ? (
              <section className="owner-panel">
                <MyListingActions id={supply.id} status={supply.status} apiBase="/api/supply" />
                <h2>{t("pricing.boost.cta")}</h2>
                <BoostButton
                  targetType="SUPPLY"
                  targetId={supply.id}
                  isPro={Boolean(ownerEnt?.isPro)}
                  boostQuotaRemaining={ownerEnt?.boostQuotaRemaining ?? 0}
                  currentlyBoostedUntil={boostedUntil?.toISOString() ?? null}
                  freeMode={ownerFreeCheckout}
                />
              </section>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
