import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { ContactActions } from "@/components/ContactActions";
import { ForwardInterestForm } from "@/components/ForwardInterestForm";
import { formatAmd } from "@/lib/utils";
import { getSession } from "@/lib/session";
import { VillageLink } from "@/components/VillageLink";

export default async function ForwardDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();

  const crop = await prisma.futureHarvest.findUnique({
    where: { id },
    include: {
      product: true,
      marz: true,
      village: true,
      plot: true,
      user: { select: { id: true, name: true } },
      preOffers: {
        include: { fromUser: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!crop || crop.status === "HIDDEN") notFound();

  const reserved = crop.preOffers
    .filter((i) => i.status !== "DECLINED")
    .reduce((s, i) => s + i.qtyWanted, 0);
  const isOwner = session?.user?.id === crop.userId;

  const matchingDemand = await prisma.demand.findMany({
    where: { status: "ACTIVE", productId: crop.productId },
    include: { user: { select: { name: true } }, marz: true },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="section detail-page">
      <p className="eyebrow">{t("actions.forward.title")}</p>
      <h1>{crop.title}</h1>
      <p className="detail-product">{t(crop.product.nameKey as "products.tomato")}</p>
      <p className="detail-location">
        {crop.village ? (
          <>
            <VillageLink village={crop.village} locale={locale} />
            {", "}
          </>
        ) : null}
        {t(`marzes.${crop.marz.slug}` as "marzes.Yerevan")}
      </p>
      {crop.plot ? (
        <p className="muted">
          <Link href={`/plots/${crop.plot.id}`}>{crop.plot.name}</Link>
        </p>
      ) : null}
      <div className="detail-stats">
        <div>
          <span>{t("forwardForm.qty")}</span>
          <strong>
            {formatAmd(crop.qtyExpected)} {t(`units.${crop.unit}` as "units.kg")}
          </strong>
        </div>
        <div>
          <span>{t("forwardForm.harvestDate")}</span>
          <strong>{crop.harvestDate.toISOString().slice(0, 10)}</strong>
        </div>
        <div>
          <span>{t("forwardBoard.interestQty")}</span>
          <strong>
            {reserved} / {crop.qtyExpected}
          </strong>
        </div>
      </div>
      <p className="pre-wrap">{crop.description}</p>
      <ContactActions phone={crop.phone} whatsapp={crop.whatsapp} />

      {isOwner && crop.preOffers.length > 0 ? (
        <section className="match-section">
          <h2>{t("plots.preOffers")}</h2>
          <ul className="match-list">
            {crop.preOffers.map((o) => (
              <li key={o.id} className="match-row">
                <div>
                  <strong>{o.fromUser.name}</strong>
                  <p>
                    {o.qtyWanted} {t(`units.${crop.unit}` as "units.kg")} · {o.status}
                    {o.message ? ` — ${o.message}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {matchingDemand.length > 0 ? (
        <section className="match-section">
          <h2>{t("plots.matchingDemand")}</h2>
          <ul className="match-list">
            {matchingDemand.map((d) => (
              <li key={d.id} className="match-row">
                <div>
                  <Link href={`/demand/${d.id}`}>
                    <strong>{d.title}</strong>
                  </Link>
                  <p>
                    {d.qtyMin}
                    {d.qtyMax ? `–${d.qtyMax}` : "+"} {t(`units.${d.unit}` as "units.kg")} ·{" "}
                    {d.user.name}
                  </p>
                </div>
                <Link href={`/demand/${d.id}`} className="btn secondary dark">
                  {t("common.open")}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!isOwner ? (
        <section className="match-section">
          <h2>{t("forwardInterest.title")}</h2>
          <ForwardInterestForm futureHarvestId={crop.id} />
        </section>
      ) : null}
    </div>
  );
}
