import { PrefetchLink } from "@/components/PrefetchLink";
import type { WeatherBrief } from "@/lib/weather";

/** Compact shareable farm-weather teaser for the homepage. */
export function HomeWeatherCard({
  weather,
  title,
  cta,
  ctaHref,
  demoLabel,
  liveLabel,
}: {
  weather: WeatherBrief & { placeLabel?: string };
  title: string;
  cta: string;
  ctaHref: string;
  demoLabel: string;
  liveLabel: string;
}) {
  const temp =
    weather.tempC != null
      ? Math.round(weather.tempC)
      : weather.tempMaxC != null
        ? Math.round(weather.tempMaxC)
        : null;

  return (
    <aside className={`home-weather-card${weather.isDemo ? " is-demo" : ""}`}>
      <div className="home-weather-card-top">
        <div>
          <p className="home-weather-eyebrow">
            {weather.isDemo ? demoLabel : liveLabel}
            {weather.placeLabel ? ` · ${weather.placeLabel}` : ""}
          </p>
          <h2>{title}</h2>
        </div>
        {temp != null ? (
          <span className="home-weather-temp" aria-hidden>
            {temp}°
          </span>
        ) : null}
      </div>
      <p className="home-weather-summary">{weather.summary}</p>
      <div className="home-weather-metrics">
        {weather.windMs != null ? (
          <span>
            <strong>{weather.windMs.toFixed(1)}</strong> m/s
          </span>
        ) : null}
        {weather.precipMm != null ? (
          <span>
            <strong>{weather.precipMm.toFixed(1)}</strong> mm
          </span>
        ) : null}
        {weather.humidity != null ? (
          <span>
            <strong>{weather.humidity}</strong>%
          </span>
        ) : null}
      </div>
      <PrefetchLink href={ctaHref} className="home-weather-cta text-link" pressable>
        {cta} →
      </PrefetchLink>
    </aside>
  );
}
