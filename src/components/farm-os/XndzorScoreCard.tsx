"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Props = {
  overall: number;
  axes: { id: string; score: number }[];
  tips: { from: number; to: number; tipKey: string }[];
  compact?: boolean;
};

export function XndzorScoreCard({ overall, axes, tips, compact }: Props) {
  const t = useTranslations("farmOs");

  return (
    <section className={`fos-score-card${compact ? " is-compact" : ""}`}>
      <header className="fos-score-head">
        <div>
          <p className="eyebrow">{t("score.eyebrow")}</p>
          <h2>{t("score.title")}</h2>
        </div>
        <div className="fos-score-overall" aria-label={`${overall}/100`}>
          <strong>{overall}</strong>
          <span>/100</span>
        </div>
      </header>

      <ul className="fos-score-axes">
        {axes.map((a) => (
          <li key={a.id}>
            <div className="fos-axis-label">
              <span>{t(`score.axes.${a.id}` as "score.axes.production")}</span>
              <em>{a.score}</em>
            </div>
            <div className="fos-axis-bar" aria-hidden>
              <i style={{ width: `${a.score}%` }} />
            </div>
          </li>
        ))}
      </ul>

      {tips.length > 0 ? (
        <div className="fos-score-tips">
          <h3>{t("score.tipsTitle", { from: tips[0].from, to: tips[0].to })}</h3>
          <ul>
            {tips.map((tip) => (
              <li key={tip.tipKey}>{t(tip.tipKey.replace("farmOs.", "") as "score.tips.production")}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {!compact ? (
        <p className="muted tiny">
          <Link href="/farms/me#farm-score">{t("score.openPassport")}</Link>
        </p>
      ) : null}
    </section>
  );
}
