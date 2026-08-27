"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatAmd, parseImageUrls } from "@/lib/utils";
import { tContent } from "@/lib/content-locale";
import { AnimalTypeIcon } from "@/components/AgIcons";
import { ClassifiedRow } from "@/components/ClassifiedRow";
import { VillageLink, type VillageRef } from "@/components/VillageLink";
import { TrustedPill } from "@/components/FarmScoreBadge";
import { MonetizationPills } from "@/components/MonetizationBadges";

type Place = { nameHy: string; nameEn: string; nameRu: string; slug?: string };

export function AnimalCard({
  id,
  title,
  animalType,
  breed,
  sex,
  ageValue,
  ageUnit,
  quantity,
  purpose,
  priceAmd,
  priceNegotiable,
  priceMode,
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
  animalType: string;
  breed: string;
  sex: string;
  ageValue?: number | null;
  ageUnit?: string | null;
  quantity: number;
  purpose: string;
  priceAmd: number | null;
  priceNegotiable: boolean;
  priceMode: string;
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

  const ageLabel =
    ageValue != null
      ? `${ageValue} ${t(`animalAgeUnits.${ageUnit || "MONTHS"}` as "animalAgeUnits.MONTHS")}`
      : null;

  const facts = [
    t(`animalTypes.${animalType}` as "animalTypes.COW"),
    breed,
    t(`animalSexes.${sex}` as "animalSexes.MIXED"),
    ageLabel,
    t("animals.heads", { n: quantity }),
    t(`animalPurposes.${purpose}` as "animalPurposes.DAIRY"),
  ]
    .filter(Boolean)
    .join(" · ");

  let priceLabel: string | undefined;
  if (priceAmd != null) {
    priceLabel = `${formatAmd(priceAmd, locale)} ֏`;
    if (priceMode === "PER_HEAD") priceLabel += ` / ${t("animals.perHead")}`;
    if (priceNegotiable) priceLabel += ` · ${t("animals.negotiable")}`;
  } else if (priceNegotiable) {
    priceLabel = t("detail.priceOpen");
  }

  return (
    <ClassifiedRow
      href={`/animals/${id}`}
      title={tContent(locale, title)}
      meta={facts}
      value={priceLabel}
      thumb={cover}
      icon={<AnimalTypeIcon type={animalType} size={20} />}
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
