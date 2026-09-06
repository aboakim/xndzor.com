import type { XndzorHealth } from "@/lib/xndzor-health";

export function ScoreRing({
  score,
  label,
  size = 120,
}: {
  score: number;
  label: string;
  size?: number;
}) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, score)) / 100);
  return (
    <div className="farm-score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(15,74,60,0.12)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--pine-bright)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="farm-score-ring-core">
        <strong>{score}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function ScorePillars({
  health,
  pillarLabels,
  tipText,
}: {
  health: XndzorHealth;
  pillarLabels: Record<string, string>;
  tipText: (key: string) => string;
}) {
  return (
    <div className="farm-score-pillars">
      {health.pillars.map((p) => (
        <div key={p.id} className="farm-score-pillar">
          <div className="farm-score-pillar-head">
            <span>{pillarLabels[p.id] || p.id}</span>
            <strong>{p.score}</strong>
          </div>
          <div className="farm-score-bar">
            <i style={{ width: `${p.score}%` }} />
          </div>
          <p className="muted small">{tipText(p.tipKey)}</p>
        </div>
      ))}
    </div>
  );
}
