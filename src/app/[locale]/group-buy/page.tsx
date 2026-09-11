import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { formatAmd } from "@/lib/utils";
import { GroupBuyJoinForm } from "@/components/GroupBuyJoinForm";
import { ProductIcon } from "@/components/AgIcons";

import { seoMessagesMetadata } from "@/lib/seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return seoMessagesMetadata(locale, "/group-buy", "groupBuy");
}

export const dynamic = "force-dynamic";

export default async function GroupBuyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const campaigns = await safeQuery(
    () =>
      prisma.groupBuyCampaign.findMany({
        where: { status: { in: ["OPEN", "QUOTED"] } },
        include: {
          product: true,
          marz: true,
          joins: { where: { status: "JOINED" } },
          organizer: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    [],
  );

  return (
    <div className="section page-board">
      <div className="section-head">
        <div>
          <h1>{t("groupBuy.title")}</h1>
          <p className="lede">{t("groupBuy.lede")}</p>
          <p className="fos-village-together">{t("farmOs.villageTogether.banner")}</p>
        </div>
        <Link href="/group-buy/about" className="btn ghost">
          {t("farmOs.villageTogether.learn")}
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <p className="empty-state">{t("groupBuy.empty")}</p>
      ) : (
        <ul className="match-list">
          {campaigns.map((c) => {
            const joinedQty = c.joins.reduce((s, j) => s + j.qty, 0);
            const pct = Math.min(100, Math.round((joinedQty / c.targetQty) * 100));
            return (
              <li key={c.id} className="match-row group-buy-row">
                <div>
                  <strong>{c.title}</strong>
                  <p>
                    <span className="icon-label">
                      <ProductIcon slugOrKey={c.product.slug} size={15} />
                      {t(c.product.nameKey as "products.tomato")}
                    </span>{" "}
                    · {t("groupBuy.progress", {
                      joined: joinedQty,
                      target: c.targetQty,
                      unit: t(`units.${c.unit}` as "units.kg"),
                    })}
                    {c.pricePerUnitAmd != null
                      ? ` · ~${formatAmd(c.pricePerUnitAmd)} ֏`
                      : ""}
                  </p>
                  <div className="progress-bar" aria-hidden>
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <p className="muted">
                    {c.joins.length} {t("groupBuy.participants")} · {c.organizer.name}
                  </p>
                  <p className="pre-wrap">{c.description}</p>
                  {c.supplierNote ? (
                    <p className="muted">
                      {t("groupBuy.supplier")}: {c.supplierNote}
                    </p>
                  ) : null}
                </div>
                {c.status === "OPEN" ? <GroupBuyJoinForm campaignId={c.id} /> : null}
              </li>
            );
          })}
        </ul>
      )}
      <p className="muted">
        <Link href="/demand">{t("demandBoard.title")}</Link>
      </p>
    </div>
  );
}
