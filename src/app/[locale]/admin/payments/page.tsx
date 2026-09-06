import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { formatAmd } from "@/lib/utils";
import { maskEmail } from "@/lib/payments";
import { getProduct } from "@/lib/pricing";

export default async function AdminPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const [payments, subs] = await Promise.all([
    prisma.payment.findMany({
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.subscription.findMany({
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const succeeded = payments.filter((p) => p.status === "SUCCEEDED");
  const totalAmd = succeeded.reduce((sum, p) => sum + p.amountAmd, 0);
  const byProduct = new Map<string, number>();
  for (const p of succeeded) {
    byProduct.set(p.productCode, (byProduct.get(p.productCode) || 0) + p.amountAmd);
  }

  return (
    <>
      <h2>{t("payments")}</h2>
      <p className="lede">{t("paymentsLede")}</p>

      <div className="billing-status-grid">
        <div>
          <span>{t("totalRevenue")}</span>
          <strong>{formatAmd(totalAmd, locale)} ֏</strong>
        </div>
        <div>
          <span>{t("paymentCount")}</span>
          <strong>{succeeded.length}</strong>
        </div>
        <div>
          <span>{t("activeSubscriptions")}</span>
          <strong>{subs.filter((s) => s.status === "ACTIVE").length}</strong>
        </div>
      </div>

      <h3>{t("byProduct")}</h3>
      <ul className="billing-list">
        {[...byProduct.entries()].map(([code, amd]) => (
          <li key={code}>
            <span>{code}</span>
            <strong>{formatAmd(amd, locale)} ֏</strong>
          </li>
        ))}
      </ul>

      <h3>{t("recentPayments")}</h3>
      <ul className="billing-list">
        {payments.map((p) => {
          const product = getProduct(p.productCode);
          return (
            <li key={p.id}>
              <span>
                {p.user.name} · {maskEmail(p.user.email)}
              </span>
              <span>
                {product?.kind ?? p.productCode} · {formatAmd(p.amountAmd, locale)} ֏ · {p.status} ·{" "}
                {p.provider}
              </span>
              <time dateTime={p.createdAt.toISOString()}>
                {p.createdAt.toLocaleString(locale)}
              </time>
            </li>
          );
        })}
      </ul>

      <h3>{t("subscriptions")}</h3>
      <ul className="billing-list">
        {subs.map((s) => (
          <li key={s.id}>
            <span>
              {s.user.name} · {maskEmail(s.user.email)}
            </span>
            <span>
              {s.planCode} · {s.status} · {t("until")}{" "}
              {s.currentPeriodEnd.toLocaleDateString(locale)}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
