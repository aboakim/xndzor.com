import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SellDecisionCalculator } from "@/components/farm-os/SellDecisionCalculator";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { effectiveTons } from "@/lib/yield";

export const dynamic = "force-dynamic";

export default async function SellDecisionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();

  let defaultQty = 10;
  const crops: { slug: string; label: string; defaultPrice: number }[] = [
    { slug: "tomato", label: t("products.tomato"), defaultPrice: 160000 },
    { slug: "wheat", label: t("products.wheat"), defaultPrice: 120000 },
    { slug: "grape", label: t("products.grape"), defaultPrice: 280000 },
    { slug: "apple", label: t("products.apple"), defaultPrice: 200000 },
    { slug: "potato", label: t("products.potato"), defaultPrice: 90000 },
    { slug: "peach", label: t("products.peach"), defaultPrice: 320000 },
  ];

  if (session?.user?.id) {
    const plots = await prisma.plot.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      include: { cropProduct: true, yieldEstimate: true },
    });
    if (plots[0]?.yieldEstimate) {
      defaultQty = effectiveTons(plots[0].yieldEstimate) || defaultQty;
    }
  }

  return (
    <div className="section page-board">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { href: "/today", label: t("farmOs.today.title") },
          { label: t("farmOs.sell.title") },
        ]}
      />
      <SellDecisionCalculator crops={crops} defaultQty={defaultQty} />
      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/today" className="btn ghost">
          {t("farmOs.today.title")}
        </Link>
      </p>
    </div>
  );
}
