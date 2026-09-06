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
  const freeMode = globalFree || showFreePricing;
  const userCheckoutFree = globalFree || checkoutFree;

  const farmMonthly = PRICING_PRODUCTS.FARM_PRO_MONTHLY;
  const farmYearly = PRICING_PRODUCTS.FARM_PRO_YEARLY;
  const buyer = PRICING_PRODUCTS.BUYER_PRO_MONTHLY;
  const verified = PRICING_PRODUCTS.VERIFIED_FARM_YEARLY;
  const boost7 = PRICING_PRODUCTS.BOOST_7;
  const boost30 = PRICING_PRODUCTS.BOOST_30;

  function priceLabel(amountAmd: number, suffix: string) {
    if (freeMode) {
      return (
        <p className="pricing-amount">
          <strong>{t("pricing.free")}</strong>
          <span>{suffix ? ` ${suffix}` : ""}</span>
        </p>
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
              : freeMode
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
      ) : freeMode && stats.remaining > 0 ? (
        <div className="demo-mode-banner early-bird-pricing-badge" role="status">
          <p className="demo-mode-banner-title">
            {t("earlyBird.pricingBadge", { remaining: stats.remaining })}
          </p>
          <p className="demo-mode-banner-note">
            {t("earlyBird.pricingBadgeNote", {
              registered: stats.totalRegistered,
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

      {!freeMode ? <AcceptedPayments badgesOnly /> : null}

      {/* TOP BOOST — primary monetization: pay site to appear at top of lists */}
      <article className="pricing-card pricing-card-featured pricing-card-top">
        <p className="pricing-pill">{t("pricing.boost.heroPill")}</p>
        <h2>{t("pricing.boost.name")}</h2>
        <p className="pricing-tagline">
          {freeMode ? t("pricing.boost.taglineFree") : t("pricing.boost.tagline")}
        </p>
        <div className="pricing-amount-row">
          {freeMode ? (
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
        <ul className="pricing-features">
          <li>{t("pricing.boost.f1")}</li>
          <li>{t("pricing.boost.f2")}</li>
          <li>{freeMode ? t("pricing.boost.f3Free") : t("pricing.boost.f3")}</li>
          <li>{t("pricing.boost.f4")}</li>
        </ul>
        <p className="tiny muted">
          {freeMode ? t("pricing.boost.fromListingFree") : t("pricing.boost.fromListing")}
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
          {!freeMode ? (
            <p className="pricing-alt">
              {formatAmd(farmYearly.amountAmd)} ֏ / {t("pricing.perYear")}
            </p>
          ) : (
            <p className="pricing-alt">
              {t("pricing.free")} / {t("pricing.perYear")}
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
            {freeMode
              ? t("pricing.verifiedFarm.taglineFree")
              : t("pricing.verifiedFarm.tagline")}
          </p>
          {priceLabel(verified.amountAmd, `/${t("pricing.perYear")}`)}
          <ul className="pricing-features">
            <li>{t("pricing.verifiedFarm.f1")}</li>
            <li>
              {freeMode
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
        {freeMode ? t("pricing.offlineNoteFree") : t("pricing.offlineNote")}
      </p>
    </div>
  );
}
