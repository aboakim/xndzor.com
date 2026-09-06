"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatAmd, parseImageUrls } from "@/lib/utils";
import { tContent } from "@/lib/content-locale";
import { CATALOG_ROUTE, type CatalogCategory } from "@/lib/catalog";
import { ActionIcon } from "@/components/AgIcons";
import { PostCard, truncateCardText } from "@/components/PostCard";
import { VillageLink, type VillageRef } from "@/components/VillageLink";
import { MonetizationPills } from "@/components/MonetizationBadges";

type Place = { nameHy: string; nameEn: string; nameRu: string; slug?: string };

export function CatalogCard({
  id,
  category,
  title,
  description,
  subtype,
  brand,
  quantity,
  unit,
  priceAmd,
  priceNegotiable,
  priceUnit,
  marz,
  village,
  imageUrls,
  isPro,
  boosted,
}: {
  id: string;
  category: CatalogCategory;
  title: string;
  description?: string | null;
  subtype: string;
  brand?: string | null;
  quantity?: number | null;
  unit?: string | null;
  priceAmd: number | null;
  priceNegotiable: boolean;
  priceUnit: string;
  marz: Place;
  village?: VillageRef | null;
  imageUrls?: string | null;
  isPro?: boolean;
  boosted?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const route = CATALOG_ROUTE[category];
  const marzLabel = marz.slug
    ? t(`marzes.${marz.slug}` as "marzes.Yerevan")
    : marz.nameEn;
  const images = parseImageUrls(imageUrls || "[]");
  const cover = images[0];

  const facts = [
    brand || null,
    quantity != null
      ? `${quantity}${unit ? ` ${t(`catalogUnits.${unit}` as "catalogUnits.kg")}` : ""}`
      : null,
  ];

  let priceLabel: string | undefined;
  if (priceAmd != null) {
    priceLabel = `${formatAmd(priceAmd, locale)} ֏`;
    priceLabel += ` · ${t(`catalogPriceUnits.${priceUnit}` as "catalogPriceUnits.LOT")}`;
  } else if (priceNegotiable) {
    priceLabel = t("detail.priceOpen");
  }

  const desc =
    description != null && description.trim()
      ? truncateCardText(tContent(locale, description))
      : null;

  return (
    <PostCard
      href={`/shop/${route}/${id}`}
      title={tContent(locale, title)}
      thumb={cover}
      icon={<ActionIcon action={route} size={28} />}
      categoryPill={t(`catalogSubtypes.${category}.${subtype}` as "catalogSubtypes.FERTILIZER.NPK")}
      description={desc}
      facts={facts}
      value={priceLabel}
      valueExtra={
        priceNegotiable && priceAmd != null ? t("catalog.negotiable") : null
      }
      photoCount={images.length}
      badge={<MonetizationPills isPro={isPro} boosted={boosted} />}
      place={
        village ? (
          <>
            <VillageLink village={village} locale={locale} />
            <span className="post-card-marz">{marzLabel}</span>
          </>
        ) : (
          <span className="post-card-marz">{marzLabel}</span>
        )
      }
    />
  );
}
