"use client";

import { useTranslations } from "next-intl";

type Weather = {
  ok: boolean;
  source: string;
  currentTempC: number | null;
  tempMaxC: number | null;
  tempMinC: number | null;
  windMaxMs: number | null;
  precipMmToday: number | null;
  precipMm48h: number | null;
  frostRisk48h: boolean;
  irrigationHint: string;
  harvestWindow: string;
  summary: string;
  caveat: string;
  placeLabel?: string;
};

type Props = {
  weather: Weather | null;
  compact?: boolean;
};

export function WeatherPanel({ weather, compact }: Props) {
  const t = useTranslations("farmOs.weather");

  if (!weather) {
    return (
      <section className={`fos-weather${compact ? " is-compact" : ""}`}>
        <p className="muted">{t("unavailable")}</p>
      </section>
    );
  }

  return (
    <section className={`fos-weather${compact ? " is-compact" : ""}`}>
      <header className="fos-weather-head">
        <div>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2>{weather.placeLabel || t("title")}</h2>
        </div>
        <div className="fos-weather-temp">
          <strong>
            {weather.currentTempC != null
              ? `${Math.round(weather.currentTempC)}°`
              : weather.tempMaxC != null
                ? `${Math.round(weather.tempMaxC)}°`
                : "—"}
          </strong>
          <span className="muted tiny">{weather.source}</span>
        </div>
      </header>

      <p className="fos-weather-summary">{weather.summary}</p>

      {!compact ? (
        <div className="fos-weather-grid">
          <div>
            <span>{t("wind")}</span>
            <strong>
              {weather.windMaxMs != null ? `${Math.round(weather.windMaxMs)} m/s` : "—"}
            </strong>
          </div>
          <div>
            <span>{t("precip")}</span>
            <strong>
              {weather.precipMmToday != null ? `${weather.precipMmToday} mm` : "—"}
            </strong>
          </div>
          <div>
            <span>{t("frost")}</span>
            <strong className={weather.frostRisk48h ? "text-warn" : undefined}>
              {weather.frostRisk48h ? t("frostYes") : t("frostNo")}
            </strong>
          </div>
          <div>
            <span>{t("irrigation")}</span>
            <strong>{t(`irrigationHint.${weather.irrigationHint}` as "irrigationHint.normal")}</strong>
          </div>
          <div>
            <span>{t("harvest")}</span>
            <strong>{t(`harvestWindow.${weather.harvestWindow}` as "harvestWindow.fair")}</strong>
          </div>
          <div>
            <span>{t("range")}</span>
            <strong>
              {weather.tempMinC != null && weather.tempMaxC != null
                ? `${Math.round(weather.tempMinC)}° / ${Math.round(weather.tempMaxC)}°`
                : "—"}
            </strong>
          </div>
        </div>
      ) : null}

      <p className="muted tiny">{weather.caveat}</p>
    </section>
  );
}
