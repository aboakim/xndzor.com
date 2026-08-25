"use client";

import { useLocale, useTranslations } from "next-intl";
import { parseImageUrls } from "@/lib/utils";
import { localizedPlaceName } from "@/lib/places";
import { ProductIcon } from "@/components/AgIcons";
import { ClassifiedRow } from "@/components/ClassifiedRow";
import { VillageLink, type VillageRef } from "@/components/VillageLink";

type Place = { nameHy: string; nameEn: string; nameRu: string; slug?: string };

type TradeCardProps = {
  kind: "demand" | "supply";
  id: string;
  title: string;
  productNameKey: string;
  productSlug?: string;
  qtyLabel: string;
  priceLabel?: string;
  marz: Place;
  village?: VillageRef | null;
  meta?: string;
  imageUrls?: string | null;
};

export function TradeCard({
  kind,
  id,
  title,
  productNameKey,
  productSlug,
  qtyLabel,
  priceLabel,
  marz,
  village,
  meta,
  imageUrls,
}: TradeCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const marzLabel = marz.slug
    ? t(`marzes.${marz.slug}` as "marzes.Yerevan")
    : localizedPlaceName(marz, locale);
  const href = kind === "demand" ? `/demand/${id}` : `/supply/${id}`;
  const cover = parseImageUrls(imageUrls || "[]")[0];
  const slug = productSlug || productNameKey.replace(/^products\./, "");
  const metaLine = [
    t(productNameKey as "products.tomato"),
    qtyLabel,
    village ? null : marzLabel,
    meta,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ClassifiedRow
      href={href}
      title={title}
      meta={metaLine}
      value={priceLabel}
      thumb={cover}
      icon={<ProductIcon slugOrKey={slug} size={20} />}
      place={
        village ? (
          <>
            <VillageLink village={village} locale={locale} />
            <span className="classified-marz">{marzLabel}</span>
          </>
        ) : null
      }
    />
  );
}
