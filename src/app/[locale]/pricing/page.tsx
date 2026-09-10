import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CheckoutButton } from "@/components/CheckoutButton";
import { AcceptedPayments } from "@/components/AcceptedPayments";
import { EarlyBirdBanner } from "@/components/xndzor/EarlyBirdBanner";
import { formatAmd } from "@/lib/utils";
import {
  AMD_PER_USD,
  FARM_PRO_BOOST_QUOTA,
  PRICING_PRODUCTS,
  arePackagesFree,
  isDemoModeAllowed,
} from "@/lib/pricing";
import { getEarlyBirdUserContext } from "@/lib/early-bird";
import { getSession } from "@/lib/session";
import { getUserEntitlements } from "@/lib/monetization";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  const entitlements = session?.user?.id
    ? await getUserEntitlements(session.user.id)
    : null;
  const demoMode = isDemoModeAllowed();
  const globalFree = arePackagesFree();
  const earlyBirdCtx = await getEarlyBirdUserContext(session?.user?.id);
  const { stats, showFreePricing, earlyBirdFree, checkoutFree } = earlyBirdCtx;
  /** Public early-bird offer still open (spots remain) */
  const earlyBirdOfferOpen = !globalFree && showFreePricing && stats.remaining > 0;
  /** Cards show free-now UI (global free OR early-bird spots left OR user already claimed) */
  const showFreeOfferUi = globalFree || earlyBirdOfferOpen || earlyBirdFree;
  const userCheckoutFree = globalFree || checkoutFree || earlyBirdOfferOpen;

  const farmMonthly = PRICING_PRODUCTS.FARM_PRO_MONTHLY;
  const farmYearly = PRICING_PRODUCTS.FARM_PRO_YEARLY;
  const buyer = PRICING_PRODUCTS.BUYER_PRO_MONTHLY;
  const verified = PRICING_PRODUCTS.VERIFIED_FARM_YEARLY;
  const boost7 = PRICING_PRODUCTS.BOOST_7;
  const boost30 = PRICING_PRODUCTS.BOOST_30;
  const urgent3 = PRICING_PRODUCTS.URGENT_3;
  const urgent7 = PRICING_PRODUCTS.URGENT_7;

  function remainingSpotsLine() {
    if (!earlyBirdOfferOpen) return null;
    return (
      <p className="pricing-remaining-spots">
        {t("pricing.remainingFreeSpots", { remaining: stats.remaining })}
      </p>
    );
  }

  function priceLabel(amountAmd: number, suffix: string) {
    if (globalFree) {
      return (
        <p className="pricing-amount">
          <strong>{t("pricing.free")}</strong>
          <span>{suffix ? ` ${suffix}` : ""}</span>
        </p>
      );
    }
    if (earlyBirdOfferOpen || earlyBirdFree) {
      return (
        <div className="pricing-amount-block">
          <p className="pricing-amount pricing-amount-early">
            <span className="pricing-regular-price">
              <s>
                {formatAmd(amountAmd)} ֏
              </s>
            </span>
            <strong className="pricing-free-now">{t("pricing.freeNow")}</strong>
            <span>{suffix ? ` ${suffix}` : ""}</span>
          </p>
          {remainingSpotsLine()}
        </div>
      );
    }
    return (
      <p className="pricing-amount">
        <strong>{formatAmd(amountAmd)}</strong> ֏
        <span>{suffix}</span>
      </p>
    );
  }

  return (
    <div className="section pricing-page">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { label: t("pricing.title") },
        ]}
      />

      {!globalFree ? <EarlyBirdBanner variant="strip" /> : null}

      <div className="section-head">
        <div>
          <p className="eyebrow">{t("pricing.eyebrow")}</p>
          <h1>{t("pricing.title")}</h1>
          <p className="lede">
            {globalFree
              ? t("pricing.ledeFree")
              : earlyBirdOfferOpen
                ? t("pricing.ledeEarlyBird", { remaining: stats.remaining })
                : t("pricing.lede")}
          </p>
        </div>
        {session ? (
          <Link href="/account/billing" className="btn ghost">
            {t("pricing.myBilling")}
          </Link>
        ) : null}
      </div>

      {earlyBirdFree && !globalFree ? (
        <div className="early-bird-user-banner" role="status">
          <p className="early-bird-user-banner-title">
            {t("earlyBird.pricingQualified")}
          </p>
          <p className="early-bird-user-banner-note">
            {stats.slotsFull
              ? t("earlyBird.pricingQualifiedFull")
              : t("earlyBird.pricingQualifiedOpen", { remaining: stats.remaining })}
          </p>
        </div>
      ) : null}

      {globalFree ? (
        <div className="demo-mode-banner" role="status">
          <p className="demo-mode-banner-title">{t("pricing.freeBannerTitle")}</p>
          <p className="demo-mode-banner-note">{t("pricing.freeBanner")}</p>
        </div>
      ) : earlyBirdOfferOpen ? (
        <div className="demo-mode-banner early-bird-pricing-badge" role="status">
          <p className="demo-mode-banner-title">
            {t("earlyBird.pricingBadge", { remaining: stats.remaining })}
          </p>
          <p className="demo-mode-banner-note">
            {t("earlyBird.pricingBadgeNote", {
              claimed: stats.earlyBirdClaimed,
              limit: stats.freeLimit,
            })}
          </p>
        </div>
      ) : demoMode ? (
        <div className="demo-mode-banner" role="status">
          <p className="demo-mode-banner-title">{t("pricing.demoModeTitle")}</p>
          <p className="demo-mode-banner-note">{t("pricing.demoBanner")}</p>
        </div>
      ) : (
        <p className="tiny muted">{t("pricing.stripeNote", { rate: AMD_PER_USD })}</p>
      )}

      {!showFreeOfferUi ? <AcceptedPayments badgesOnly /> : null}

      {/* TOP BOOST — primary monetization: pay site to appear at top of lists */}
      <article className="pricing-card pricing-card-featured pricing-card-top">
        <p className="pricing-pill">{t("pricing.boost.heroPill")}</p>
        <h2>{t("pricing.boost.name")}</h2>
        <p className="pricing-tagline">
          {showFreeOfferUi ? t("pricing.boost.taglineFree") : t("pricing.boost.tagline")}
        </p>
        <div className="pricing-amount-row">
          {globalFree ? (
            <>
              <p className="pricing-amount">
                <strong>{t("pricing.free")}</strong>
                <span>/ 7 {t("pricing.days")}</span>
              </p>
              <p className="pricing-amount">
                <strong>{t("pricing.free")}</strong>
                <span>/ 30 {t("pricing.days")}</span>
              </p>
            </>
          ) : earlyBirdOfferOpen || earlyBirdFree ? (
            <>
              <div className="pricing-amount-block">
                <p className="pricing-amount pricing-amount-early">
                  <span className="pricing-regular-price">
                    <s>
                      {formatAmd(boost7.amountAmd)} ֏
                    </s>
                  </span>
                  <strong className="pricing-free-now">{t("pricing.freeNow")}</strong>
                  <span>/ 7 {t("pricing.days")}</span>
                </p>
              </div>
              <div className="pricing-amount-block">
                <p className="pricing-amount pricing-amount-early">
                  <span className="pricing-regular-price">
                    <s>
                      {formatAmd(boost30.amountAmd)} ֏
                    </s>
                  </span>
                  <strong className="pricing-free-now">{t("pricing.freeNow")}</strong>
                  <span>/ 30 {t("pricing.days")}</span>
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="pricing-amount">
                <strong>{formatAmd(boost7.amountAmd)}</strong> ֏
                <span>/ 7 {t("pricing.days")}</span>
              </p>
              <p className="pricing-amount">
                <strong>{formatAmd(boost30.amountAmd)}</strong> ֏
                <span>/ 30 {t("pricing.days")}</span>
              </p>
            </>
          )}
        </div>
        {earlyBirdOfferOpen ? remainingSpotsLine() : null}
        <ul className="pricing-features">
          <li>{t("pricing.boost.f1")}</li>
          <li>{t("pricing.boost.f2")}</li>
          <li>{showFreeOfferUi ? t("pricing.boost.f3Free") : t("pricing.boost.f3")}</li>
          <li>{t("pricing.boost.f4")}</li>
        </ul>
        <p className="tiny muted">
          {showFreeOfferUi
            ? t("pricing.boost.fromListingFree")
            : t("pricing.boost.fromListing")}
        </p>
        <div className="pricing-actions">
          {session ? (
            <>
              <Link href="/my/machinery" className="btn primary">
                {t("pricing.boost.openListings")}
              </Link>
              <Link href="/my/animals" className="btn ghost">
                {t("nav.animals")}
              </Link>
              <Link href="/forward" className="btn ghost">
                {t("nav.forward")}
              </Link>
            </>
          ) : (
            <Link href="/auth/register" className="btn primary">
              {t("pricing.boost.cta")}
            </Link>
          )}
        </div>
      </article>

      {/* URGENT SALE — homepage «Շտապ վաճառք» placement (Supply) */}
      <article className="pricing-card pricing-card-urgent">
        <p className="pricing-pill pricing-pill-urgent">{t("pricing.urgent.heroPill")}</p>
        <h2>{t("pricing.urgent.name")}</h2>
        <p className="pricing-tagline">
          {showFreeOfferUi ? t("pricing.urgent.taglineFree") : t("pricing.urgent.tagline")}
        </p>
        <div className="pricing-amount-row">
          {globalFree ? (
            <>
              <p className="pricing-amount">
                <strong>{t("pricing.free")}</strong>
                <span>/ 3 {t("pricing.days")}</span>
              </p>
              <p className="pricing-amount">
                <strong>{t("pricing.free")}</strong>
                <span>/ 7 {t("pricing.days")}</span>
              </p>
            </>
          ) : earlyBirdOfferOpen || earlyBirdFree ? (
            <>
              <div className="pricing-amount-block">
                <p className="pricing-amount pricing-amount-early">
                  <span className="pricing-regular-price">
                    <s>{formatAmd(urgent3.amountAmd)} ֏</s>
                  </span>
                  <strong className="pricing-free-now">{t("pricing.freeNow")}</strong>
                  <span>/ 3 {t("pricing.days")}</span>
                </p>
              </div>
              <div className="pricing-amount-block">
                <p className="pricing-amount pricing-amount-early">
                  <span className="pricing-regular-price">
                    <s>{formatAmd(urgent7.amountAmd)} ֏</s>
                  </span>
                  <strong className="pricing-free-now">{t("pricing.freeNow")}</strong>
                  <span>/ 7 {t("pricing.days")}</span>
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="pricing-amount">
                <strong>{formatAmd(urgent3.amountAmd)}</strong> ֏
                <span>/ 3 {t("pricing.days")}</span>
              </p>
              <p className="pricing-amount">
                <strong>{formatAmd(urgent7.amountAmd)}</strong> ֏
                <span>/ 7 {t("pricing.days")}</span>
              </p>
            </>
          )}
        </div>
        {earlyBirdOfferOpen ? remainingSpotsLine() : null}
        <ul className="pricing-features">
          <li>{t("pricing.urgent.f1")}</li>
          <li>{t("pricing.urgent.f2")}</li>
          <li>{showFreeOfferUi ? t("pricing.urgent.f3Free") : t("pricing.urgent.f3")}</li>
          <li>{t("pricing.urgent.f4")}</li>
        </ul>
        <p className="tiny muted">
          {showFreeOfferUi
            ? t("pricing.urgent.fromListingFree")
            : t("pricing.urgent.fromListing")}
        </p>
        <div className="pricing-actions">
          {session ? (
            <Link href="/supply" className="btn primary">
              {t("pricing.urgent.openListings")}
            </Link>
          ) : (
            <Link href="/auth/register" className="btn primary">
              {t("pricing.urgent.cta")}
            </Link>
          )}
        </div>
      </article>

      {entitlements?.isPro ? (
        <p className="pro-active-banner">
          {t("pricing.youArePro", {
            date: entitlements.proUntil
              ? entitlements.proUntil.toLocaleDateString(locale)
              : "—",
          })}
        </p>
      ) : null}

      <div className="pricing-grid">
        <article className="pricing-card">
          <h2>{t("pricing.farmPro.name")}</h2>
          <p className="pricing-tagline">{t("pricing.farmPro.tagline")}</p>
          {priceLabel(farmMonthly.amountAmd, `/${t("pricing.perMonth")}`)}
          {globalFree ? (
            <p className="pricing-alt">
              {t("pricing.free")} / {t("pricing.perYear")}
            </p>
          ) : earlyBirdOfferOpen || earlyBirdFree ? (
            <p className="pricing-alt pricing-alt-early">
              <s>
                {formatAmd(farmYearly.amountAmd)} ֏
              </s>{" "}
              <span className="pricing-free-now">{t("pricing.freeNow")}</span> /{" "}
              {t("pricing.perYear")}
            </p>
          ) : (
            <p className="pricing-alt">
              {formatAmd(farmYearly.amountAmd)} ֏ / {t("pricing.perYear")}
            </p>
          )}
          <ul className="pricing-features">
            <li>{t("pricing.farmPro.f1")}</li>
            <li>{t("pricing.farmPro.f2")}</li>
            <li>{t("pricing.farmPro.f3", { n: FARM_PRO_BOOST_QUOTA })}</li>
            <li>{t("pricing.farmPro.f4")}</li>
            <li>{t("pricing.farmPro.f5")}</li>
          </ul>
          <div className="pricing-actions">
            <CheckoutButton
              productCode="FARM_PRO_MONTHLY"
              label={
                userCheckoutFree
                  ? t("pricing.activateMonth")
                  : t("pricing.farmPro.ctaMonth")
              }
              disabled={Boolean(entitlements?.isPro)}
              freeMode={userCheckoutFree}
            />
            <CheckoutButton
              productCode="FARM_PRO_YEARLY"
              className="btn ghost"
              label={
                userCheckoutFree
                  ? t("pricing.activateYear")
                  : t("pricing.farmPro.ctaYear")
              }
              disabled={Boolean(entitlements?.isPro)}
              freeMode={userCheckoutFree}
            />
          </div>
        </article>

        <article className="pricing-card">
          <h2>{t("pricing.verifiedFarm.name")}</h2>
          <p className="pricing-tagline">
            {showFreeOfferUi
              ? t("pricing.verifiedFarm.taglineFree")
              : t("pricing.verifiedFarm.tagline")}
          </p>
          {priceLabel(verified.amountAmd, `/${t("pricing.perYear")}`)}
          <ul className="pricing-features">
            <li>{t("pricing.verifiedFarm.f1")}</li>
            <li>
              {showFreeOfferUi
                ? t("pricing.verifiedFarm.f2Free")
                : t("pricing.verifiedFarm.f2")}
            </li>
          </ul>
          <CheckoutButton
            productCode="VERIFIED_FARM_YEARLY"
            label={
              userCheckoutFree ? t("pricing.activate") : t("pricing.verifiedFarm.cta")
            }
            disabled={Boolean(entitlements?.isVerifiedPaid)}
            freeMode={userCheckoutFree}
          />
        </article>

        <article className="pricing-card">
          <h2>{t("pricing.buyerPro.name")}</h2>
          <p className="pricing-tagline">{t("pricing.buyerPro.tagline")}</p>
          {priceLabel(buyer.amountAmd, `/${t("pricing.perMonth")}`)}
          <ul className="pricing-features">
            <li>{t("pricing.buyerPro.f1")}</li>
            <li>{t("pricing.buyerPro.f2")}</li>
            <li>{t("pricing.buyerPro.f3")}</li>
          </ul>
          <CheckoutButton
            productCode="BUYER_PRO_MONTHLY"
            label={userCheckoutFree ? t("pricing.activate") : t("pricing.buyerPro.cta")}
            disabled={Boolean(entitlements?.isBuyerPro)}
            freeMode={userCheckoutFree}
          />
        </article>
      </div>

      <p className="tiny muted pricing-footnote">
        {showFreeOfferUi ? t("pricing.offlineNoteFree") : t("pricing.offlineNote")}
      </p>
    </div>
  );
}
