"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatAmd, parseImageUrls } from "@/lib/utils";
import { tContent } from "@/lib/content-locale";
import { MachineryTypeIcon } from "@/components/AgIcons";
import { ClassifiedRow } from "@/components/ClassifiedRow";
import { VillageLink, type VillageRef } from "@/components/VillageLink";
import { TrustedPill } from "@/components/FarmScoreBadge";
import { MonetizationPills } from "@/components/MonetizationBadges";

type Place = { nameHy: string; nameEn: string; nameRu: string; slug?: string };

export function MachineryCard({
  id,
  title,
  machineryType,
  make,
  model,
  year,
  condition,
  priceAmd,
  priceNegotiable,
  engineHours,
  mileageKm,
  powerHp,
  marz,
  village,
  imageUrls,
  farmScore,
  trusted,
  isPro,
  boosted,
}: {
  id: string;
  title: string;
  machineryType: string;
  make: string;
  model: string;
  year: number;
  condition: string;
  priceAmd: number | null;
  priceNegotiable: boolean;
  engineHours?: number | null;
  mileageKm?: number | null;
  powerHp?: number | null;
  marz: Place;
  village?: VillageRef | null;
  imageUrls?: string | null;
  farmScore?: number | null;
  trusted?: boolean;
  isPro?: boolean;
  boosted?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const marzLabel = marz.slug
    ? t(`marzes.${marz.slug}` as "marzes.Yerevan")
    : marz.nameEn;
  const cover = parseImageUrls(imageUrls || "[]")[0];

  const facts = [
    t(`machineryTypes.${machineryType}` as "machineryTypes.TRACTOR"),
    `${make} ${model}`,
    String(year),
    t(`machineryConditions.${condition}` as "machineryConditions.USED"),
    powerHp != null ? `${powerHp} ${t("machinery.hp")}` : null,
    engineHours != null ? t("machinery.hours", { n: formatAmd(engineHours) }) : null,
    mileageKm != null ? t("machinery.km", { n: formatAmd(mileageKm) }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  let priceLabel: string | undefined;
  if (priceAmd != null) {
    priceLabel = `${formatAmd(priceAmd)} ֏`;
    if (priceNegotiable) priceLabel += ` · ${t("machinery.negotiable")}`;
  } else if (priceNegotiable) {
    priceLabel = t("detail.priceOpen");
  }

  return (
    <ClassifiedRow
      href={`/machinery/${id}`}
      title={tContent(locale, title)}
      meta={facts}
      value={priceLabel}
      thumb={cover}
      icon={<MachineryTypeIcon type={machineryType} size={20} />}
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
        ) : (
          <span className="classified-marz">{marzLabel}</span>
        )
      }
    />
  );
}
