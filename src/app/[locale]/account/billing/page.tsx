import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getUserEntitlements } from "@/lib/monetization";
import { formatAmd } from "@/lib/utils";
import { GoProLink } from "@/components/CheckoutButton";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/account/billing`);
  }

  const [ent, payments, boosts, subs] = await Promise.all([
    getUserEntitlements(session.user.id),
    prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.boost.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.subscription.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="section billing-page">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { href: "/pricing", label: t("pricing.title") },
          { label: t("pricing.myBilling") },
        ]}
      />
      <div className="section-head">
        <div>
          <h1>{t("pricing.myBilling")}</h1>
          <p className="lede">{t("pricing.billingLede")}</p>
        </div>
        <GoProLink />
      </div>

      <div className="billing-status-grid">
        <div>
          <span>{t("pricing.badges.pro")}</span>
          <strong>
            {ent?.isPro
              ? t("pricing.activeUntil", {
                  date: ent.proUntil?.toLocaleDateString(locale) || "—",
                })
              : t("pricing.inactive")}
          </strong>
        </div>
        <div>
          <span>{t("pricing.badges.verified")}</span>
          <strong>
            {ent?.isVerifiedPaid || ent?.farmVerified
              ? t("pricing.active")
              : t("pricing.inactive")}
          </strong>
        </div>
        <div>
          <span>{t("pricing.buyerPro.name")}</span>
          <strong>
            {ent?.isBuyerPro
              ? t("pricing.activeUntil", {
                  date: ent.buyerProUntil?.toLocaleDateString(locale) || "—",
                })
              : t("pricing.inactive")}
          </strong>
        </div>
        <div>
          <span>{t("pricing.boost.quotaLabel")}</span>
          <strong>
            {ent?.isPro
              ? `${ent.boostQuotaRemaining} / ${ent.boostQuotaUsed + ent.boostQuotaRemaining}`
              : "—"}
          </strong>
        </div>
      </div>

      <h2>{t("pricing.payments")}</h2>
      {payments.length === 0 ? (
        <p className="muted">{t("pricing.noPayments")}</p>
      ) : (
        <ul className="billing-list">
          {payments.map((p) => (
            <li key={p.id}>
              <span>{p.productCode}</span>
              <span>
                {formatAmd(p.amountAmd)} ֏ · {p.status} · {p.provider}
              </span>
              <time dateTime={p.createdAt.toISOString()}>
                {p.createdAt.toLocaleString(locale)}
              </time>
            </li>
          ))}
        </ul>
      )}

      <h2>{t("pricing.subscriptions")}</h2>
      {subs.length === 0 ? (
        <p className="muted">{t("pricing.noSubs")}</p>
      ) : (
        <ul className="billing-list">
          {subs.map((s) => (
            <li key={s.id}>
              <span>{s.planCode}</span>
              <span>{s.status}</span>
              <time dateTime={s.currentPeriodEnd.toISOString()}>
                → {s.currentPeriodEnd.toLocaleDateString(locale)}
              </time>
            </li>
          ))}
        </ul>
      )}

      <h2>{t("pricing.boosts")}</h2>
      {boosts.length === 0 ? (
        <p className="muted">{t("pricing.noBoosts")}</p>
      ) : (
        <ul className="billing-list">
          {boosts.map((b) => (
            <li key={b.id}>
              <span>
                {b.targetType} · {b.source}
              </span>
              <time dateTime={b.endsAt.toISOString()}>
                → {b.endsAt.toLocaleDateString(locale)}
              </time>
            </li>
          ))}
        </ul>
      )}

      <p className="tiny">
        <Link href="/pricing">{t("pricing.title")}</Link>
      </p>
    </div>
  );
}
