"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatAmd, formatListingAge, parseImageUrls } from "@/lib/utils";
import { tContent } from "@/lib/content-locale";
import { AnimalTypeIcon } from "@/components/AgIcons";
import { PostCard, truncateCardText } from "@/components/PostCard";
import { VillageLink, type VillageRef } from "@/components/VillageLink";
import { TrustedPill } from "@/components/FarmScoreBadge";
import { MonetizationPills } from "@/components/MonetizationBadges";

type Place = { nameHy: string; nameEn: string; nameRu: string; slug?: string };

export function AnimalCard({
  id,
  title,
  description,
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
  createdAt,
}: {
  id: string;
  title: string;
  description?: string | null;
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
  createdAt?: Date | string | null;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const marzLabel = marz.slug
    ? t(`marzes.${marz.slug}` as "marzes.Yerevan")
    : marz.nameEn;
  const images = parseImageUrls(imageUrls || "[]");
  const cover = images[0];

  const ageLabel =
    ageValue != null
      ? `${ageValue} ${t(`animalAgeUnits.${ageUnit || "MONTHS"}` as "animalAgeUnits.MONTHS")}`
      : null;

  const facts = [
    breed,
    t(`animalSexes.${sex}` as "animalSexes.MIXED"),
    ageLabel,
    t("animals.heads", { n: quantity }),
    t(`animalPurposes.${purpose}` as "animalPurposes.DAIRY"),
  ];

  let priceLabel: string | undefined;
  if (priceAmd != null) {
    priceLabel = `${formatAmd(priceAmd, locale)} ֏`;
    if (priceMode === "PER_HEAD") priceLabel += ` / ${t("animals.perHead")}`;
  } else if (priceNegotiable) {
    priceLabel = t("detail.priceOpen");
  }

  const desc =
    description != null && description.trim()
      ? truncateCardText(tContent(locale, description))
      : null;

  const posted = createdAt ? formatListingAge(createdAt, locale) : null;

  return (
    <PostCard
      href={`/animals/${id}`}
      title={tContent(locale, title)}
      thumb={cover}
      icon={<AnimalTypeIcon type={animalType} size={28} />}
      categoryPill={t(`animalTypes.${animalType}` as "animalTypes.COW")}
      description={desc}
      facts={facts}
      value={priceLabel}
      valueExtra={
        priceNegotiable && priceAmd != null ? t("animals.negotiable") : null
      }
      photoCount={images.length}
      status={trusted ? "verified" : "active"}
      footMeta={[posted, trusted ? t("browse.verified") : null]}
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
            <span className="post-card-marz">{marzLabel}</span>
          </>
        ) : (
          <span className="post-card-marz">{marzLabel}</span>
        )
      }
    />
  );
}
