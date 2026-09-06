"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatAmd, formatListingAge, parseImageUrls } from "@/lib/utils";
import { localizedPlaceName } from "@/lib/places";

type Place = { nameHy: string; nameEn: string; nameRu: string; slug?: string };

type ListingCardProps = {
  id: string;
  title: string;
  priceAmd: number;
  type: string;
  marz: Place;
  village: Place;
  imageUrls: string;
  categoryNameKey: string;
  /** Optional unit label (kg, ton…). */
  unit?: string | null;
  /** Listing createdAt for relative age. */
  createdAt?: Date | string | null;
  /** Verified farm cue. */
  verified?: boolean;
};

export function ListingCard({
  id,
  title,
  priceAmd,
  type,
  marz,
  village,
  imageUrls,
  categoryNameKey,
  unit,
  createdAt,
  verified = false,
}: ListingCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const images = parseImageUrls(imageUrls);
  const cover = images[0];
  const marzLabel = marz.slug
    ? t(`marzes.${marz.slug}` as "marzes.Yerevan")
    : localizedPlaceName(marz, locale);
  const villageLabel = localizedPlaceName(village, locale);
  const catLabel = t(categoryNameKey as "categories.animals");
  const age = createdAt ? formatListingAge(createdAt, locale) : null;
  const unitLabel = unit ? t(`units.${unit}` as "units.kg") : null;

  return (
    <Link href={`/listings/${id}`} className="listing-card listing-card--rich">
      <div className="listing-card-media">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" loading="lazy" />
        ) : (
          <div className="listing-card-placeholder">{t("listings.noImage")}</div>
        )}
        <span className={`badge type-${type.toLowerCase()}`}>
          {type === "BUY" ? t("listings.typeBuy") : t("listings.typeSell")}
        </span>
        {verified ? (
          <span className="listing-card-badges">
            <span className="listing-verified-pill">{t("browse.verified")}</span>
          </span>
        ) : null}
      </div>
      <div className="listing-card-body">
        <div className="listing-card-topline">
          <span className="listing-category-pill">{catLabel}</span>
          {verified ? (
            <span className="listing-status-dot listing-status-dot--verified" aria-hidden>
              <i />
            </span>
          ) : (
            <span className="listing-status-dot listing-status-dot--active" aria-hidden>
              <i />
            </span>
          )}
        </div>
        <p className="listing-price listing-card-price">
          {formatAmd(priceAmd)} <span>{t("listings.amd")}</span>
        </p>
        <h3 className="listing-card-title-static">{title}</h3>
        <p className="listing-meta listing-card-location">
          {villageLabel}, {marzLabel}
        </p>
        {(unitLabel || age) && (
          <p className="listing-card-foot-meta">
            {unitLabel ? <span>{unitLabel}</span> : null}
            {unitLabel && age ? (
              <span className="listing-foot-meta--md">
                <span className="listing-foot-sep" aria-hidden>
                  ·
                </span>
                {age}
              </span>
            ) : age ? (
              <span>{age}</span>
            ) : null}
          </p>
        )}
      </div>
    </Link>
  );
}
