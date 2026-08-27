import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CheckoutButton } from "@/components/CheckoutButton";
import { formatAmd } from "@/lib/utils";
import { AMD_PER_USD, FARM_PRO_BOOST_QUOTA, isStripeConfigured, PRICING_PRODUCTS } from "@/lib/pricing";
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
  const demoMode = !isStripeConfigured();

  const farmMonthly = PRICING_PRODUCTS.FARM_PRO_MONTHLY;
  const farmYearly = PRICING_PRODUCTS.FARM_PRO_YEARLY;
  const buyer = PRICING_PRODUCTS.BUYER_PRO_MONTHLY;
  const verified = PRICING_PRODUCTS.VERIFIED_FARM_YEARLY;
  const boost7 = PRICING_PRODUCTS.BOOST_7;
  const boost30 = PRICING_PRODUCTS.BOOST_30;

  return (
    <div className="section pricing-page">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { label: t("pricing.title") },
        ]}
      />

      <div className="section-head">
        <div>
          <p className="eyebrow">{t("pricing.eyebrow")}</p>
          <h1>{t("pricing.title")}</h1>
          <p className="lede">{t("pricing.lede")}</p>
        </div>
        {session ? (
          <Link href="/account/billing" className="btn ghost">
            {t("pricing.myBilling")}
          </Link>
        ) : null}
      </div>

      {demoMode ? (
        <p className="demo-pay-banner" role="status">
          {t("pricing.demoBanner")}
        </p>
      ) : (
        <p className="tiny muted">{t("pricing.stripeNote", { rate: AMD_PER_USD })}</p>
      )}

      {/* TOP BOOST — primary monetization: pay site to appear at top of lists */}
      <article className="pricing-card pricing-card-featured pricing-card-top">
        <p className="pricing-pill">{t("pricing.boost.heroPill")}</p>
        <h2>{t("pricing.boost.name")}</h2>
        <p className="pricing-tagline">{t("pricing.boost.tagline")}</p>
        <div className="pricing-amount-row">
          <p className="pricing-amount">
            <strong>{formatAmd(boost7.amountAmd)}</strong> ֏
            <span>/ 7 {t("pricing.days")}</span>
          </p>
          <p className="pricing-amount">
            <strong>{formatAmd(boost30.amountAmd)}</strong> ֏
            <span>/ 30 {t("pricing.days")}</span>
          </p>
        </div>
        <ul className="pricing-features">
          <li>{t("pricing.boost.f1")}</li>
          <li>{t("pricing.boost.f2")}</li>
          <li>{t("pricing.boost.f3")}</li>
          <li>{t("pricing.boost.f4")}</li>
        </ul>
        <p className="tiny muted">{t("pricing.boost.fromListing")}</p>
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
            <Link href="/auth/login" className="btn primary">
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
          <p className="pricing-amount">
            <strong>{formatAmd(farmMonthly.amountAmd)}</strong> ֏
            <span>/{t("pricing.perMonth")}</span>
          </p>
          <p className="pricing-alt">
            {formatAmd(farmYearly.amountAmd)} ֏ / {t("pricing.perYear")}
          </p>
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
              label={t("pricing.farmPro.ctaMonth")}
              disabled={Boolean(entitlements?.isPro)}
            />
            <CheckoutButton
              productCode="FARM_PRO_YEARLY"
              className="btn ghost"
              label={t("pricing.farmPro.ctaYear")}
              disabled={Boolean(entitlements?.isPro)}
            />
          </div>
        </article>

        <article className="pricing-card">
          <h2>{t("pricing.verifiedFarm.name")}</h2>
          <p className="pricing-tagline">{t("pricing.verifiedFarm.tagline")}</p>
          <p className="pricing-amount">
            <strong>{formatAmd(verified.amountAmd)}</strong> ֏
            <span>/{t("pricing.perYear")}</span>
          </p>
          <ul className="pricing-features">
            <li>{t("pricing.verifiedFarm.f1")}</li>
            <li>{t("pricing.verifiedFarm.f2")}</li>
          </ul>
          <CheckoutButton
            productCode="VERIFIED_FARM_YEARLY"
            label={t("pricing.verifiedFarm.cta")}
            disabled={Boolean(entitlements?.isVerifiedPaid)}
          />
        </article>

        <article className="pricing-card">
          <h2>{t("pricing.buyerPro.name")}</h2>
          <p className="pricing-tagline">{t("pricing.buyerPro.tagline")}</p>
          <p className="pricing-amount">
            <strong>{formatAmd(buyer.amountAmd)}</strong> ֏
            <span>/{t("pricing.perMonth")}</span>
          </p>
          <ul className="pricing-features">
            <li>{t("pricing.buyerPro.f1")}</li>
            <li>{t("pricing.buyerPro.f2")}</li>
            <li>{t("pricing.buyerPro.f3")}</li>
          </ul>
          <CheckoutButton
            productCode="BUYER_PRO_MONTHLY"
            label={t("pricing.buyerPro.cta")}
            disabled={Boolean(entitlements?.isBuyerPro)}
          />
        </article>
      </div>

      <p className="tiny muted pricing-footnote">{t("pricing.offlineNote")}</p>
    </div>
  );
}
