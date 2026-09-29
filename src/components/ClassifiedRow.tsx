"use client";

import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { tradeListingTitle } from "@/lib/content-locale";

type ClassifiedRowProps = {
  href: string;
  /** Raw listing title from DB (localized in-row). */
  title: string;
  /** Catalog `products.*` key for trade listings. */
  productNameKey?: string;
  meta: string;
  value?: string;
  icon?: ReactNode;
  thumb?: string | null;
  /** Interactive trailing meta (e.g. a village map link) shown after `meta`. */
  place?: ReactNode;
  /** Optional trust / farm-score badge */
  badge?: ReactNode;
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
  productNameKey,
  meta,
  value,
  icon,
  thumb,
  place,
  badge,
}: ClassifiedRowProps) {
  const locale = useLocale();
  const t = useTranslations();
  const catalogLabel = productNameKey
    ? t(productNameKey as "products.tomato")
    : undefined;
  const displayTitle = tradeListingTitle(locale, title, catalogLabel);

  return (
    <div className="classified-row">
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt={displayTitle} className="classified-thumb" loading="lazy" />
      ) : icon ? (
        <span className="classified-icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="classified-body">
        <Link href={href} className="classified-title">
          {displayTitle}
        </Link>
        <span className="classified-meta">
          <span className="classified-meta-text">{meta}</span>
          {place ? <span className="classified-meta-place">{place}</span> : null}
          {badge ? <span className="classified-meta-badge">{badge}</span> : null}
        </span>
      </span>
      {value ? <span className="classified-value">{value}</span> : null}
      <span className="classified-arrow" aria-hidden>
        →
      </span>
    </div>
  );
}
