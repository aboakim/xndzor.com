import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/session";
import { loadFarmContext } from "@/lib/farm-context";
import { FarmPageShell } from "@/components/farm/FarmPageShell";
import { WeatherWidget } from "@/components/farm/WeatherWidget";
import { ScoreRing } from "@/components/farm/ScoreRing";

const TOOLS = [
  { href: "/farm/risks", key: "risks" },
  { href: "/farm/diary", key: "diary" },
  { href: "/farm/costs", key: "costs" },
  { href: "/farm/sell-or-wait", key: "sellOrWait" },
  { href: "/farm/spaces", key: "spaces" },
  { href: "/farm/returns", key: "returns" },
  { href: "/farm/journey", key: "journey" },
  { href: "/farm/radar", key: "radar" },
  { href: "/farm/together", key: "together" },
  { href: "/farm/why-yield", key: "whyYield" },
  { href: "/farm/score", key: "score" },
] as const;

const START_HERE = [
  { href: "/farm/risks", key: "risks" },
  { href: "/farm/diary", key: "diary" },
  { href: "/farm/sell-or-wait", key: "sellOrWait" },
] as const;

export default async function FarmHubPage({
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

  return (
    <FarmPageShell
      title={t("hub.title")}
      lede={t("hub.lede")}
      breadcrumbs={[{ href: "/", label: tn("home") }, { label: t("hub.title") }]}
    >
      {!session?.user ? (
        <p className="farm-login-hint">
          {t("hub.loginHint")}{" "}
          <Link href="/auth/login">{tn("login")}</Link>
        </p>
      ) : null}

      <div className="farm-hub-top">
        <WeatherWidget
          weather={ctx.weather}
          labels={{
            title: t("weather.title"),
            demo: t("weather.demo"),
            live: t("weather.live"),
            place: ctx.weather.placeLabel,
          }}
        />
        <Link href="/farm/score" className="farm-hub-score">
          <ScoreRing score={ctx.health.overall} label={t("score.short")} />
          <span>{t("score.openDetail")}</span>
          <span className="farm-hub-score-cue">{t("hub.scoreCue")}</span>
        </Link>
      </div>

      <section className="farm-hub-start" aria-label={t("hub.startHere")}>
        <div className="farm-hub-start-head">
          <h2 className="farm-hub-section-label">{t("hub.startHere")}</h2>
          <p className="farm-hub-section-cue">{t("hub.startCue")}</p>
        </div>
        <div className="farm-hub-start-grid">
          {START_HERE.map((item) => (
            <Link key={item.href} href={item.href} className="farm-hub-start-chip">
              <strong>{t(`tools.${item.key}.title`)}</strong>
              <span>{t(`tools.${item.key}.desc`)}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="farm-hub-tools-head">
        <h2 className="farm-hub-section-label">{t("hub.allTools")}</h2>
        <p className="farm-hub-section-cue">{t("hub.toolsCue")}</p>
      </div>

      <div className="farm-tool-grid">
        {TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href} className="farm-tool-card">
            <h2>{t(`tools.${tool.key}.title`)}</h2>
            <p>{t(`tools.${tool.key}.desc`)}</p>
            <span className="farm-tool-card-go" aria-hidden>
              →
            </span>
          </Link>
        ))}
      </div>
    </FarmPageShell>
  );
}
