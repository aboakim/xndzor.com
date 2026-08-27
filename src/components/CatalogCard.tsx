"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatAmd, parseImageUrls } from "@/lib/utils";
import { tContent } from "@/lib/content-locale";
import { CATALOG_ROUTE, type CatalogCategory } from "@/lib/catalog";
import { ActionIcon } from "@/components/AgIcons";
import { ClassifiedRow } from "@/components/ClassifiedRow";
import { VillageLink, type VillageRef } from "@/components/VillageLink";
import { MonetizationPills } from "@/components/MonetizationBadges";

type Place = { nameHy: string; nameEn: string; nameRu: string; slug?: string };

export function CatalogCard({
  id,
  category,
  title,
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
  const cover = parseImageUrls(imageUrls || "[]")[0];

  const facts = [
    t(`catalogSubtypes.${category}.${subtype}` as "catalogSubtypes.FERTILIZER.NPK"),
    brand || null,
    quantity != null
      ? `${quantity}${unit ? ` ${t(`catalogUnits.${unit}` as "catalogUnits.kg")}` : ""}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  let priceLabel: string | undefined;
  if (priceAmd != null) {
    priceLabel = `${formatAmd(priceAmd, locale)} ֏`;
    priceLabel += ` · ${t(`catalogPriceUnits.${priceUnit}` as "catalogPriceUnits.LOT")}`;
    if (priceNegotiable) priceLabel += ` · ${t("catalog.negotiable")}`;
  } else if (priceNegotiable) {
    priceLabel = t("detail.priceOpen");
  }

  return (
    <ClassifiedRow
      href={`/shop/${route}/${id}`}
      title={tContent(locale, title)}
      meta={facts}
      value={priceLabel}
      thumb={cover}
      icon={<ActionIcon action={route} size={20} />}
      badge={<MonetizationPills isPro={isPro} boosted={boosted} />}
      place={
        village ? (
          <>
            <VillageLink village={village} locale={locale} />
            <span className="classified-marz">{marzLabel}</span>
          </>
        ) : (
          <span className="classified-marz">{marzLabel}</span>
        )
      }
    />
  );
}
