import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/session";
import { loadFarmContext } from "@/lib/farm-context";
import { FarmPageShell } from "@/components/farm/FarmPageShell";
import { ScoreRing, ScorePillars } from "@/components/farm/ScoreRing";

export default async function FarmScorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("farm");
  const tn = await getTranslations("nav");
  const session = await getSession();
  const ctx = await loadFarmContext(session?.user?.id, locale);

  const pillarLabels: Record<string, string> = {
    production: t("score.pillars.production"),
    costs: t("score.pillars.costs"),
    water: t("score.pillars.water"),
    storage: t("score.pillars.storage"),
    sales: t("score.pillars.sales"),
  };

  return (
    <FarmPageShell
      title={t("tools.score.title")}
      lede={t("tools.score.desc")}
      breadcrumbs={[
        { href: "/", label: tn("home") },
        { href: "/farm", label: t("hub.title") },
        { label: t("tools.score.title") },
      ]}
    >
      <div className="farm-score-hero">
        <ScoreRing score={ctx.health.overall} label={t("score.short")} size={148} />
        <div>
          <h2>{t("score.overall")}</h2>
          <p className="lede">{t("score.lede")}</p>
          {!session?.user ? (
            <p>
              <Link href="/auth/login">{tn("login")}</Link>
            </p>
          ) : null}
        </div>
      </div>
      <ScorePillars
        health={ctx.health}
        pillarLabels={pillarLabels}
        tipText={(key) => t(key as "score.tips.addPlot")}
      />
      <p className="muted small">{t("score.vsPassport")}</p>
    </FarmPageShell>
  );
}
