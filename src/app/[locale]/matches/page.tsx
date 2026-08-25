import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { findMatchesForDemand, findMatchesForSupply } from "@/lib/matching";
import { formatQty } from "@/lib/utils";

export default async function MatchesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/matches`);
  }

  const [mySupplies, myDemands, allDemands, allSupplies, offers] = await Promise.all([
    prisma.supply.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      include: { product: true, marz: true },
    }),
    prisma.demand.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      include: { product: true, marz: true },
    }),
    prisma.demand.findMany({ where: { status: "ACTIVE" }, include: { product: true, marz: true } }),
    prisma.supply.findMany({ where: { status: "ACTIVE" }, include: { product: true, marz: true } }),
    prisma.offer.findMany({
      where: {
        OR: [
          { fromUserId: session.user.id },
          { demand: { userId: session.user.id } },
          { supply: { userId: session.user.id } },
        ],
      },
      include: {
        supply: { include: { product: true } },
        demand: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const supplyMatches = mySupplies.flatMap((s) =>
    findMatchesForSupply(s, allDemands).slice(0, 5).map((m) => ({
      ...m,
      supply: s,
      demand: allDemands.find((d) => d.id === m.demandId)!,
    }))
  );

  const demandMatches = myDemands.flatMap((d) =>
    findMatchesForDemand(d, allSupplies).slice(0, 5).map((m) => ({
      ...m,
      demand: d,
      supply: allSupplies.find((s) => s.id === m.supplyId)!,
    }))
  );

  return (
    <div className="section page-board">
      <h1>{t("matches.title")}</h1>
      <p className="lede">{t("matches.lede")}</p>

      <section className="match-section">
        <h2>{t("matches.forYourSupply")}</h2>
        {supplyMatches.length === 0 ? (
          <p className="empty-state">
            {t("matches.emptySupply")}{" "}
            <Link href="/supply/new">{t("nav.findBuyer")}</Link>
          </p>
        ) : (
          <ul className="match-list">
            {supplyMatches.map(({ supply, demand, score }) => (
              <li key={`${supply.id}-${demand.id}`} className="match-row">
                <div>
                  <p className="muted">
                    {t("pillars.supplyShort")}: <Link href={`/supply/${supply.id}`}>{supply.title}</Link>
                  </p>
                  <Link href={`/demand/${demand.id}`}>
                    <strong>{demand.title}</strong>
                  </Link>
                  <p>
                    {formatQty(demand.qtyMin, demand.qtyMax, demand.unit, (k) => t(k as "units.kg"))} ·{" "}
                    {t(`marzes.${demand.marz.slug}` as "marzes.Yerevan")} ·{" "}
                    {t("detail.score", { score })}
                  </p>
                </div>
                <Link href={`/supply/${supply.id}`} className="btn secondary">
                  {t("findBuyer.open")}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="match-section">
        <h2>{t("matches.forYourDemand")}</h2>
        {demandMatches.length === 0 ? (
          <p className="empty-state">
            {t("matches.emptyDemand")}{" "}
            <Link href="/demand/new">{t("nav.postDemand")}</Link>
          </p>
        ) : (
          <ul className="match-list">
            {demandMatches.map(({ supply, demand, score }) => (
              <li key={`${demand.id}-${supply.id}`} className="match-row">
                <div>
                  <p className="muted">
                    {t("pillars.demandShort")}: <Link href={`/demand/${demand.id}`}>{demand.title}</Link>
                  </p>
                  <Link href={`/supply/${supply.id}`}>
                    <strong>{supply.title}</strong>
                  </Link>
                  <p>
                    {formatQty(supply.qtyAvailable, null, supply.unit, (k) => t(k as "units.kg"))} ·{" "}
                    {t(`marzes.${supply.marz.slug}` as "marzes.Yerevan")} ·{" "}
                    {t("detail.score", { score })}
                  </p>
                </div>
                <Link href={`/demand/${demand.id}`} className="btn secondary">
                  {t("findBuyer.open")}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="match-section">
        <h2>{t("matches.offers")}</h2>
        {offers.length === 0 ? (
          <p className="empty-state">{t("matches.noOffers")}</p>
        ) : (
          <ul className="match-list">
            {offers.map((o) => (
              <li key={o.id} className="match-row">
                <div>
                  <strong>
                    {o.supply.title} ↔ {o.demand.title}
                  </strong>
                  {o.message ? <p>{o.message}</p> : null}
                  <p className="muted">{o.status}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
