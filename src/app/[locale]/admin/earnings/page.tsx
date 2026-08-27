import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { userIsAdmin } from "@/lib/monetization";
import { formatAmd } from "@/lib/utils";

export default async function AdminEarningsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/admin/earnings`);
  }
  const admin = await userIsAdmin(session.user.id);
  if (!admin) {
    redirect(`/${locale}`);
  }

  const payments = await prisma.payment.findMany({
    where: { status: "SUCCEEDED" },
    include: { user: { select: { email: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalAmd = payments.reduce((sum, p) => sum + p.amountAmd, 0);
  const byProduct = new Map<string, number>();
  for (const p of payments) {
    byProduct.set(p.productCode, (byProduct.get(p.productCode) || 0) + p.amountAmd);
  }

  return (
    <div className="section admin-earnings-page">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { label: t("pricing.adminEarnings") },
        ]}
      />
      <div className="section-head">
        <div>
          <h1>{t("pricing.adminEarnings")}</h1>
          <p className="lede">{t("pricing.adminLede")}</p>
        </div>
        <Link href="/account/billing" className="btn ghost">
          {t("pricing.myBilling")}
        </Link>
      </div>

      <div className="billing-status-grid">
        <div>
          <span>{t("pricing.totalEarned")}</span>
          <strong>{formatAmd(totalAmd)} ֏</strong>
        </div>
        <div>
          <span>{t("pricing.paymentCount")}</span>
          <strong>{payments.length}</strong>
        </div>
      </div>

      <h2>{t("pricing.byProduct")}</h2>
      <ul className="billing-list">
        {[...byProduct.entries()].map(([code, amd]) => (
          <li key={code}>
            <span>{code}</span>
            <strong>{formatAmd(amd)} ֏</strong>
          </li>
        ))}
      </ul>

      <h2>{t("pricing.payments")}</h2>
      <ul className="billing-list">
        {payments.map((p) => (
          <li key={p.id}>
            <span>
              {p.user.name} · {p.user.email}
            </span>
            <span>
              {p.productCode} · {formatAmd(p.amountAmd)} ֏ · {p.provider}
            </span>
            <time dateTime={p.createdAt.toISOString()}>
              {p.createdAt.toLocaleString(locale)}
            </time>
          </li>
        ))}
      </ul>
    </div>
  );
}
