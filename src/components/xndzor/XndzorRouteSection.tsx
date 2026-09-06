"use client";

import { useTranslations } from "next-intl";
import { getDemoRoute } from "@/lib/xndzor-solution";
import { formatAmd } from "@/lib/utils";

type XndzorRouteSectionProps = {
  locale: string;
  /** Unique page anchor; omit when the card is nested (e.g. inside hero results). */
  anchorId?: string;
};

export function XndzorRouteSection({ locale, anchorId }: XndzorRouteSectionProps) {
  const t = useTranslations("xndzor.route");
  const { stops, totalCostAmd, costPerFarmAmd } = getDemoRoute();

  return (
    <article id={anchorId} className="xndzor-route-card">
      <header className="xndzor-route-header">
        <span className="xndzor-route-icon" aria-hidden>
          🗺️
        </span>
        <div>
          <p className="xndzor-route-eyebrow">{t("eyebrow")}</p>
          <h3 className="xndzor-route-title">{t("title")}</h3>
          <p className="xndzor-route-sub">{t("subtitle")}</p>
        </div>
      </header>

      <ol className="xndzor-route-stops">
        {stops.map((stop, i) => (
          <li key={stop.marz} className={`xndzor-route-stop${i === stops.length - 1 ? " is-dest" : ""}`}>
            <span className="xndzor-route-dot" aria-hidden />
            <div className="xndzor-route-stop-body">
              <strong>{t(`marzes.${stop.marz}` as "marzes.Armavir")}</strong>
              {stop.farms > 0 ? (
                <span>
                  {t("stopDetail", {
                    farms: stop.farms,
                    ha: stop.ha,
                    tons: stop.loadTons,
                  })}
                </span>
              ) : (
                <span>{t("destination")}</span>
              )}
            </div>
            {i < stops.length - 1 ? <span className="xndzor-route-line" aria-hidden /> : null}
          </li>
        ))}
      </ol>

      <div className="xndzor-route-cost">
        <div>
          <span>{t("totalCost")}</span>
          <strong>{formatAmd(totalCostAmd, locale)} ֏</strong>
        </div>
        <div>
          <span>{t("perFarm")}</span>
          <strong>{formatAmd(costPerFarmAmd, locale)} ֏</strong>
        </div>
      </div>

      <p className="xndzor-route-teaser">{t("teaser")}</p>
    </article>
  );
}
