import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { FarmPageShell } from "@/components/farm/FarmPageShell";
import { Link } from "@/i18n/navigation";

export default async function WhyYieldPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("farm");
  const tn = await getTranslations("nav");
  const session = await getSession();

  const year = new Date().getFullYear();
  const journeys = session?.user?.id
    ? await prisma.cropJourney.findMany({
        where: { userId: session.user.id },
        orderBy: { seasonYear: "desc" },
        take: 6,
      })
    : [];

  const factors = [
    { key: "weather", weight: "high" as const },
    { key: "water", weight: "medium" as const },
    { key: "inputs", weight: "medium" as const },
    { key: "timing", weight: "low" as const },
    { key: "pests", weight: "medium" as const },
  ];

  return (
    <FarmPageShell
      title={t("tools.whyYield.title")}
      lede={t("tools.whyYield.desc")}
      breadcrumbs={[
        { href: "/", label: tn("home") },
        { href: "/farm", label: t("hub.title") },
        { label: t("tools.whyYield.title") },
      ]}
    >
      <div className="farm-compare">
        <div className="farm-stat farm-stat--gold">
          <strong>{year - 1}</strong>
          <em>{t("whyYield.lastYear")}</em>
          <span className="farm-compare-val">~4.2 t/ha</span>
        </div>
        <div className="farm-stat farm-stat--warn">
          <strong>{year}</strong>
          <em>{t("whyYield.thisYear")}</em>
          <span className="farm-compare-val warn">~3.1 t/ha</span>
        </div>
      </div>
      <p className="muted small">{t("whyYield.stubNote")}</p>

      <h2 className="farm-subhead">{t("whyYield.factors")}</h2>
      <ul className="farm-factor-list">
        {factors.map((f) => (
          <li
            key={f.key}
            className={`farm-risk--${f.weight === "high" ? "high" : f.weight === "medium" ? "medium" : "low"}`}
          >
            <div className="farm-factor-main">
              <strong>{t(`whyYield.factor.${f.key}`)}</strong>
              <div className="farm-score-bar" aria-hidden>
                <i
                  style={{
                    width:
                      f.weight === "high" ? "92%" : f.weight === "medium" ? "58%" : "28%",
                  }}
                />
              </div>
            </div>
            <span>{t(`whyYield.weight.${f.weight}`)}</span>
          </li>
        ))}
      </ul>

      {journeys.length > 0 ? (
        <>
          <h2 className="farm-subhead">{t("whyYield.yourJourneys")}</h2>
          <ul className="farm-list">
            {journeys.map((j) => (
              <li key={j.id}>
                <strong>
                  {j.seasonYear} · {j.cropName}
                </strong>
                <span className="muted">
                  {j.yieldKg != null ? `${j.yieldKg} kg` : "—"} ·{" "}
                  {j.totalCostAmd.toLocaleString()} AMD
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="muted">
          <Link href="/farm/journey">{t("whyYield.openJourney")}</Link>
        </p>
      )}
    </FarmPageShell>
  );
}
