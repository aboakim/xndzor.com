import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ProductIcon } from "@/components/AgIcons";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ClassifiedRow } from "@/components/ClassifiedRow";
import { EmptyState } from "@/components/EmptyState";
import { VillageLink } from "@/components/VillageLink";
import { effectiveTons } from "@/lib/yield";

import { seoMessagesMetadata } from "@/lib/seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return seoMessagesMetadata(locale, "/plots", "plots", { noIndex: true });
}

export const dynamic = "force-dynamic";

export default async function PlotsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/plots`);
  }

  const plots = await prisma.plot.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    include: {
      cropProduct: true,
      marz: true,
      village: true,
      yieldEstimate: true,
      futureHarvests: {
        where: { status: "ACTIVE" },
        include: { preOffers: true },
      },
      tasks: { where: { status: "OPEN" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="section page-board">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { label: t("plots.title") },
        ]}
      />
      <div className="section-head">
        <div>
          <h1>{t("plots.title")}</h1>
          <p className="lede">{t("plots.lede")}</p>
        </div>
        <Link href="/plots/new" className="btn primary">
          {t("common.add")}
        </Link>
      </div>

      {plots.length === 0 ? (
        <EmptyState
          message={t("plots.empty")}
          actionHref="/plots/new"
          actionLabel={t("plots.add")}
        />
      ) : (
        <div className="classified-list">
          {plots.map((p) => {
            const tons = p.yieldEstimate ? effectiveTons(p.yieldEstimate) : null;
            const interest = p.futureHarvests.reduce(
              (s, h) => s + h.preOffers.filter((o) => o.status !== "DECLINED").length,
              0
            );
            const marzLabel = t(`marzes.${p.marz.slug}` as "marzes.Yerevan");
            const meta = [
              t(p.cropProduct.nameKey as "products.tomato"),
              `${p.hectares} ${t("farmos.ha")}`,
              p.village ? null : marzLabel,
              t("plots.openTasks", { n: p.tasks.length }),
              interest > 0 ? t("today.buyersInterested", { n: interest }) : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <ClassifiedRow
                key={p.id}
                href={`/plots/${p.id}`}
                title={p.name}
                meta={meta}
                value={tons != null ? `~${tons} ${t("units.ton")}` : undefined}
                icon={<ProductIcon slugOrKey={p.cropProduct.slug} size={20} />}
                place={
                  p.village ? (
                    <>
                      <VillageLink village={p.village} locale={locale} />
                      <span className="classified-marz">{marzLabel}</span>
                    </>
                  ) : null
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
