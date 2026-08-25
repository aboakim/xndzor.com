import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";

type ClassifiedRowProps = {
  href: string;
  title: string;
  meta: string;
  value?: string;
  icon?: ReactNode;
  thumb?: string | null;
  /** Interactive trailing meta (e.g. a village map link) shown after `meta`. */
  place?: ReactNode;
};

/**
 * List.am-style row: title · location/meta · key number · arrow.
 *
 * The title link is stretched over the whole row so the row stays one big tap target,
 * while `place` remains separately clickable instead of being nested inside an anchor.
 */
export function ClassifiedRow({
  href,
  title,
  meta,
  value,
  icon,
  thumb,
  place,
}: ClassifiedRowProps) {
  return (
    <div className="classified-row">
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="classified-thumb" loading="lazy" />
      ) : icon ? (
        <span className="classified-icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="classified-body">
        <Link href={href} className="classified-title">
          {title}
        </Link>
        <span className="classified-meta">
          <span className="classified-meta-text">{meta}</span>
          {place ? <span className="classified-meta-place">{place}</span> : null}
        </span>
      </span>
      {value ? <span className="classified-value">{value}</span> : null}
      <span className="classified-arrow" aria-hidden>
        →
      </span>
    </div>
  );
}
