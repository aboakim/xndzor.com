import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { FarmPageShell } from "@/components/farm/FarmPageShell";

export const dynamic = "force-dynamic";

type Stage = { id: string; title: string; costAmd: number; note?: string };

export default async function JourneyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("farm");
  const tn = await getTranslations("nav");
  const session = await getSession();

  const journeys = session?.user?.id
    ? await prisma.cropJourney.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        take: 10,
      })
    : [];

  const demoStages: Stage[] = [
    { id: "1", title: t("journey.stages.seed"), costAmd: 120000 },
    { id: "2", title: t("journey.stages.plant"), costAmd: 80000 },
    { id: "3", title: t("journey.stages.care"), costAmd: 200000 },
    { id: "4", title: t("journey.stages.harvest"), costAmd: 150000 },
    { id: "5", title: t("journey.stages.sell"), costAmd: 40000 },
  ];
  const demoCost = demoStages.reduce((s, x) => s + x.costAmd, 0);
  const demoRevenue = 900000;
  const demoYield = 4500;

  return (
    <FarmPageShell
      title={t("tools.journey.title")}
      lede={t("tools.journey.desc")}
      breadcrumbs={[
        { href: "/", label: tn("home") },
        { href: "/farm", label: t("hub.title") },
        { label: t("tools.journey.title") },
      ]}
    >
      {!session?.user ? (
        <p className="muted">
          <Link href="/auth/login">{tn("login")}</Link> — {t("hub.loginHint")}
        </p>
      ) : null}

      {journeys.length === 0 ? (
        <div className="farm-journey-demo">
          <p className="farm-pill">{t("journey.demoBadge")}</p>
          <h2>{t("journey.demoCrop")}</h2>
          <ol className="farm-journey-steps">
            {demoStages.map((s) => (
              <li key={s.id}>
                <strong>{s.title}</strong>
                <span>{s.costAmd.toLocaleString()} AMD</span>
              </li>
            ))}
          </ol>
          <div className="farm-stat-row">
            <div className="farm-stat">
              <strong>{demoCost.toLocaleString()}</strong>
              <em>{t("journey.totalCost")}</em>
            </div>
            <div className="farm-stat">
              <strong>{demoYield.toLocaleString()}</strong>
              <em>{t("journey.yieldKg")}</em>
            </div>
            <div className="farm-stat">
              <strong>{(demoRevenue - demoCost).toLocaleString()}</strong>
              <em>{t("journey.profit")}</em>
            </div>
          </div>
        </div>
      ) : (
        <ul className="farm-list">
          {journeys.map((j) => {
            let stages: Stage[] = [];
            try {
              stages = JSON.parse(j.stagesJson) as Stage[];
            } catch {
              /* ignore */
            }
            const profit =
              j.revenueAmd != null ? j.revenueAmd - j.totalCostAmd : null;
            return (
              <li key={j.id}>
                <div className="farm-list-main">
                  <strong>
                    {j.cropName} · {j.seasonYear}
                  </strong>
                  <ol className="farm-journey-steps">
                    {stages.map((s) => (
                      <li key={s.id}>
                        <strong>{s.title}</strong>
                        <span>{s.costAmd.toLocaleString()} AMD</span>
                      </li>
                    ))}
                  </ol>
                  <p className="muted small">
                    {t("journey.totalCost")}: {j.totalCostAmd.toLocaleString()} AMD
                    {j.yieldKg != null ? ` · ${j.yieldKg} kg` : ""}
                    {profit != null ? ` · ${t("journey.profit")}: ${profit.toLocaleString()}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </FarmPageShell>
  );
}
