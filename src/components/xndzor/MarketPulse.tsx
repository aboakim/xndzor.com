import { PrefetchLink } from "@/components/PrefetchLink";

export type MarketPulseStat = {
  href: string;
  label: string;
  count: number;
  accent: "pine" | "gold" | "wheat" | "sky";
};

/** Live marketplace pulse — counts from DB, quick-jump links. */
export function MarketPulse({
  title,
  subtitle,
  stats,
  liveLabel,
}: {
  title: string;
  subtitle: string;
  liveLabel: string;
  stats: MarketPulseStat[];
}) {
  return (
    <section className="market-pulse" aria-label={title}>
      <div className="market-pulse-head">
        <div>
          <p className="market-pulse-live">
            <span className="market-pulse-dot" aria-hidden />
            {liveLabel}
          </p>
          <h2 className="market-pulse-title">{title}</h2>
          <p className="market-pulse-sub muted">{subtitle}</p>
        </div>
      </div>
      <div className="market-pulse-grid" role="list">
        {stats.map((s) => (
          <PrefetchLink
            key={s.href}
            href={s.href}
            className={`market-pulse-card accent-${s.accent}`}
            role="listitem"
            pressable
          >
            <strong className="market-pulse-count">{s.count}</strong>
            <span className="market-pulse-label">{s.label}</span>
          </PrefetchLink>
        ))}
      </div>
    </section>
  );
}
