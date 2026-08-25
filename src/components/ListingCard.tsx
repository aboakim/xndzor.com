"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatAmd, parseImageUrls } from "@/lib/utils";
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

  return (
    <Link href={`/listings/${id}`} className="listing-card">
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
      </div>
      <div className="listing-card-body">
        <p className="listing-price">
          {formatAmd(priceAmd)} <span>{t("listings.amd")}</span>
        </p>
        <h3>{title}</h3>
        <p className="listing-meta">
          {catLabel} · {villageLabel}, {marzLabel}
        </p>
      </div>
    </Link>
  );
}
