"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  score: number;
  band: string;
  color: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function FarmScoreBadge({
  score,
  band,
  color,
  size = "md",
  showLabel = true,
}: Props) {
  const t = useTranslations("farmPassport");
  const bandKey = `bands.${band}` as "bands.highly_reliable";
  const target = Math.max(0, Math.min(100, Math.round(score)));
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(target);
      return;
    }

    setDisplay(0);
    let raf = 0;
    const start = performance.now();
    const duration = 900;

    const tick = (now: number) => {
      const tProg = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - tProg) ** 3;
      setDisplay(Math.round(target * eased));
      if (tProg < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const r = size === "lg" ? 42 : size === "sm" ? 22 : 32;
  const stroke = size === "lg" ? 5 : size === "sm" ? 3.5 : 4;
  const vb = (r + stroke) * 2;
  const c = 2 * Math.PI * r;
  const progress = display / 100;
  const offset = c * (1 - progress);

  return (
    <div
      className={`farm-score-badge farm-score-${size}`}
      style={{ ["--score-color" as string]: color }}
      aria-label={`${target}/100 · ${t(bandKey)}`}
    >
      <div className="farm-score-ring-wrap" aria-hidden>
        <svg
          className="farm-score-ring"
          width={vb}
          height={vb}
          viewBox={`0 0 ${vb} ${vb}`}
        >
          <circle
            className="farm-score-ring-track"
            cx={vb / 2}
            cy={vb / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
          />
          <circle
            className="farm-score-ring-progress"
            cx={vb / 2}
            cy={vb / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${vb / 2} ${vb / 2})`}
          />
        </svg>
        <span className="farm-score-num" suppressHydrationWarning>
          {display}
          <small>/100</small>
        </span>
      </div>
      {showLabel ? <span className="farm-score-label">{t(bandKey)}</span> : null}
    </div>
  );
}

export function TrustedPill({ score }: { score: number }) {
  const t = useTranslations("farmPassport");
  return (
    <span className="trusted-pill" title={`${score}/100`}>
      {t("trustedBadge")}
    </span>
  );
}
