import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";

type PostCardProps = {
  href: string;
  title: string;
  icon?: ReactNode;
  thumb?: string | null;
  /** Short facts (crop, quantity, date). Rendered as one wrapped line. */
  facts: (string | null | undefined)[];
  value?: string;
  /** Village map link plus marz label. */
  place?: ReactNode;
  badge?: string | null;
  progress?: { pct: number; label: string } | null;
};

/**
 * Compact card used by the home feed. The title link is stretched over the card so the
 * whole card is tappable while the village link inside `place` stays separately clickable.
 */
export function PostCard({
  href,
  title,
  icon,
  thumb,
  facts,
  value,
  place,
  badge,
  progress,
}: PostCardProps) {
  const factLine = facts.filter(Boolean).join(" · ");

  return (
    <article className="post-card">
      <div className="post-card-top">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="post-card-thumb" loading="lazy" />
        ) : icon ? (
          <span className="post-card-icon" aria-hidden>
            {icon}
          </span>
        ) : null}
        <div className="post-card-headings">
          <Link href={href} className="post-card-title">
            {title}
          </Link>
          {factLine ? <p className="post-card-facts">{factLine}</p> : null}
        </div>
        {badge ? <span className="post-card-badge">{badge}</span> : null}
      </div>

      {progress ? (
        <div className="post-card-progress">
          <div className="progress-bar" aria-hidden>
            <span style={{ width: `${progress.pct}%` }} />
          </div>
          <span className="post-card-progress-label">{progress.label}</span>
        </div>
      ) : null}

      <div className="post-card-foot">
        {place ? <span className="post-card-place">{place}</span> : <span />}
        {value ? <strong className="post-card-value">{value}</strong> : null}
      </div>
    </article>
  );
}
