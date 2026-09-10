import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { ListingThumb } from "@/components/ListingThumb";

type PostCardProps = {
  href: string;
  title: string;
  icon?: ReactNode;
  thumb?: string | null;
  /** Category pill below image (e.g. machinery type, crop). */
  categoryPill?: string | null;
  /** Short description preview under the title. */
  description?: string | null;
  /** Short facts — rendered as chips when categoryPill is set, else a single line. */
  facts?: (string | null | undefined)[];
  value?: string;
  /** Extra status next to price (negotiable, exchange). */
  valueExtra?: ReactNode;
  /** Village map link plus marz label. */
  place?: ReactNode;
  badge?: ReactNode;
  progress?: { pct: number; label: string } | null;
  /** Number of photos — overlay on media. */
  photoCount?: number;
  /** Carousel / grid card — photo-first vendo layout. */
  variant?: "card" | "compact";
  /** Live / verified status cue beside category. */
  status?: "active" | "verified" | null;
  /** Dense footer facts (unit, relative date) — hide extras on small screens via CSS. */
  footMeta?: (string | null | undefined)[];
  /** Paid urgent-sale highlight on the image frame (homepage «Շտապ»). */
  urgent?: boolean;
};

/**
 * Unified listing card: photo, category pill, title, location.
 * Whole card is tappable; village links inside `place` stay separately clickable.
 */
export function PostCard({
  href,
  title,
  icon,
  thumb,
  categoryPill,
  description,
  facts = [],
  value,
  valueExtra,
  place,
  badge,
  progress,
  photoCount,
  variant = "card",
  status = null,
  footMeta = [],
  urgent = false,
}: PostCardProps) {
  const chips = facts.filter(Boolean) as string[];
  const foot = footMeta.filter(Boolean) as string[];
  const factLine = chips.join(" · ");

  if (variant === "compact") {
    return (
      <article className="post-card post-card-compact">
        <div className="post-card-top">
          {thumb || icon ? (
            <ListingThumb
              src={thumb}
              className="post-card-thumb"
              fallback={icon}
              placeholderClassName="post-card-icon"
            />
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

  return (
    <article
      className={`listing-card listing-card--rich${urgent ? " listing-card--urgent" : ""}`}
    >
      <div className="listing-card-media">
        <ListingThumb
          src={thumb}
          className="listing-card-img"
          fallback={icon}
        />
        <span className="listing-card-fav" aria-hidden>
          <HeartIcon />
        </span>
        {badge ? <span className="listing-card-badges">{badge}</span> : null}
        {photoCount != null && photoCount > 0 ? (
          <span className="listing-photo-count" aria-hidden>
            <CameraIcon />
            {photoCount}
          </span>
        ) : null}
      </div>
      <div className="listing-card-body">
        {(categoryPill || status) && (
          <div className="listing-card-topline">
            {categoryPill ? (
              <span className="listing-category-pill">{categoryPill}</span>
            ) : null}
            {status ? (
              <span
                className={`listing-status-dot listing-status-dot--${status}`}
                aria-hidden
              >
                <i />
              </span>
            ) : null}
          </div>
        )}
        <Link href={href} className="listing-card-title">
          {title}
        </Link>
        {description ? (
          <p className="listing-card-desc">{description}</p>
        ) : null}
        {chips.length > 0 ? (
          <div className="listing-meta-chips">
            {chips.slice(0, 4).map((chip, i) => (
              <span
                key={`${i}-${chip}`}
                className={`listing-meta-chip${i >= 2 ? " listing-meta-chip--md" : ""}`}
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}
        {place ? (
          <p className="listing-card-location">
            <LocationPin />
            <span className="listing-card-place">{place}</span>
          </p>
        ) : null}
        {foot.length > 0 ? (
          <p className="listing-card-foot-meta">
            {foot.map((item, i) => (
              <span
                key={`${i}-${item}`}
                className={i > 0 ? "listing-foot-meta--md" : undefined}
              >
                {i > 0 ? <span className="listing-foot-sep" aria-hidden>·</span> : null}
                {item}
              </span>
            ))}
          </p>
        ) : null}
        {value || valueExtra ? (
          <div className="listing-card-price-row">
            {value ? <p className="listing-card-price">{value}</p> : <span />}
            {valueExtra ? (
              <span className="listing-card-price-extra">{valueExtra}</span>
            ) : null}
          </div>
        ) : null}
        {progress ? (
          <div className="post-card-progress">
            <div className="progress-bar" aria-hidden>
              <span style={{ width: `${progress.pct}%` }} />
            </div>
            <span className="post-card-progress-label">{progress.label}</span>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function LocationPin() {
  return (
    <svg
      className="listing-pin-icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Truncate listing body text for card previews. */
export function truncateCardText(text: string, max = 90): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}
