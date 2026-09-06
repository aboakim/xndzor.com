import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/session";
import { loadFarmContext } from "@/lib/farm-context";
import { FarmPageShell } from "@/components/farm/FarmPageShell";
import { WeatherWidget, RiskCards } from "@/components/farm/WeatherWidget";

export default async function FarmRisksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ plotId?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("farm");
  const tn = await getTranslations("nav");
  const session = await getSession();
  const ctx = await loadFarmContext(session?.user?.id, locale);
  const plot =
    ctx.plots.find((p) => p.id === sp.plotId) || ctx.plots[0] || null;

  return (
    <FarmPageShell
      title={t("tools.risks.title")}
      lede={t("tools.risks.desc")}
      breadcrumbs={[
        { href: "/", label: tn("home") },
        { href: "/farm", label: t("hub.title") },
        { label: t("tools.risks.title") },
      ]}
    >
      {ctx.plots.length > 0 ? (
        <div className="farm-plot-picker">
          <span>{t("risks.pickPlot")}</span>
          <div className="farm-chip-row">
            {ctx.plots.map((p) => (
              <Link
                key={p.id}
                href={`/farm/risks?plotId=${p.id}`}
                className={`farm-chip ${plot?.id === p.id ? "active" : ""}`}
              >
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <p className="muted">
          {t("risks.noPlots")}{" "}
          <Link href="/plots/new">{t("risks.addPlot")}</Link>
        </p>
      )}

      <WeatherWidget
        weather={ctx.weather}
        labels={{
          title: t("weather.title"),
          demo: t("weather.demo"),
          live: t("weather.live"),
          place: plot?.name || ctx.weather.placeLabel,
        }}
      />

      <h2 className="farm-subhead">{t("risks.tomorrow")}</h2>
      <RiskCards risks={ctx.weather.risks} />
      <p className="muted small">{t("risks.personalizedNote")}</p>
    </FarmPageShell>
  );
}
