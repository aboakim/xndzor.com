import type { FarmWeatherBundle } from "@/lib/weather";

export function WeatherWidget({
  weather,
  labels,
}: {
  weather: FarmWeatherBundle;
  labels: {
    title: string;
    demo: string;
    live: string;
    place?: string;
  };
}) {
  return (
    <div className={`farm-weather ${weather.isDemo ? "is-demo" : ""}`}>
      <div className="farm-weather-head">
        <h2>{labels.title}</h2>
        <span className="farm-pill">
          {weather.isDemo ? labels.demo : labels.live}
          {weather.source !== "demo" ? ` · ${weather.source}` : ""}
        </span>
      </div>
      {labels.place || weather.placeLabel ? (
        <p className="farm-weather-place">{labels.place || weather.placeLabel}</p>
      ) : null}
      <p className="farm-weather-summary">{weather.summary}</p>
      <div className="farm-weather-metrics">
        {weather.tempC != null ? (
          <div>
            <strong>{Math.round(weather.tempC)}°</strong>
            <span>now</span>
          </div>
        ) : null}
        {weather.tempMaxC != null ? (
          <div>
            <strong>{Math.round(weather.tempMaxC)}°</strong>
            <span>max</span>
          </div>
        ) : null}
        {weather.windMs != null ? (
          <div>
            <strong>{weather.windMs.toFixed(1)}</strong>
            <span>m/s</span>
          </div>
        ) : null}
        {weather.precipMm != null ? (
          <div>
            <strong>{weather.precipMm.toFixed(1)}</strong>
            <span>mm</span>
          </div>
        ) : null}
      </div>
      <p className="muted small">{weather.caveat}</p>
    </div>
  );
}

export function RiskCards({
  risks,
}: {
  risks: FarmWeatherBundle["risks"];
}) {
  return (
    <div className="farm-risk-grid">
      {risks.map((r) => (
        <article key={r.id} className={`farm-risk farm-risk--${r.level}`}>
          <header>
            <h3>{r.title}</h3>
            <span className="farm-risk-level">{r.level}</span>
          </header>
          <p>{r.detail}</p>
        </article>
      ))}
    </div>
  );
}
