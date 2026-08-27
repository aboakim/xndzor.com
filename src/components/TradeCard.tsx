"use client";

import { useLocale, useTranslations } from "next-intl";
import { parseImageUrls } from "@/lib/utils";
import { tContent } from "@/lib/content-locale";
import { localizedPlaceName } from "@/lib/places";
import { ProductIcon } from "@/components/AgIcons";
import { ClassifiedRow } from "@/components/ClassifiedRow";
import { VillageLink, type VillageRef } from "@/components/VillageLink";
import { TrustedPill } from "@/components/FarmScoreBadge";
import { MonetizationPills } from "@/components/MonetizationBadges";

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
  farmScore?: number | null;
  trusted?: boolean;
  isPro?: boolean;
  boosted?: boolean;
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
  farmScore,
  trusted,
  isPro,
  boosted,
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
      title={tContent(locale, title)}
      meta={metaLine}
      value={priceLabel}
      thumb={cover}
      icon={<ProductIcon slugOrKey={slug} size={20} />}
      badge={
        <>
          <MonetizationPills isPro={isPro} boosted={boosted} />
          {trusted && farmScore != null ? <TrustedPill score={farmScore} /> : null}
        </>
      }
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
