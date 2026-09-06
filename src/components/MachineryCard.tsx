"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatAmd, formatListingAge, parseImageUrls } from "@/lib/utils";
import { tContent } from "@/lib/content-locale";
import { MachineryTypeIcon } from "@/components/AgIcons";
import { PostCard, truncateCardText } from "@/components/PostCard";
import { VillageLink, type VillageRef } from "@/components/VillageLink";
import { TrustedPill } from "@/components/FarmScoreBadge";
import { MonetizationPills } from "@/components/MonetizationBadges";

type Place = { nameHy: string; nameEn: string; nameRu: string; slug?: string };

export function MachineryCard({
  id,
  title,
  description,
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
  createdAt,
}: {
  id: string;
  title: string;
  description?: string | null;
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
  createdAt?: Date | string | null;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const marzLabel = marz.slug
    ? t(`marzes.${marz.slug}` as "marzes.Yerevan")
    : marz.nameEn;
  const images = parseImageUrls(imageUrls || "[]");
  const cover = images[0];

  const facts = [
    `${make} ${model}`,
    String(year),
    t(`machineryConditions.${condition}` as "machineryConditions.USED"),
    powerHp != null ? `${powerHp} ${t("machinery.hp")}` : null,
    engineHours != null ? t("machinery.hours", { n: formatAmd(engineHours) }) : null,
    mileageKm != null ? t("machinery.km", { n: formatAmd(mileageKm) }) : null,
  ];

  let priceLabel: string | undefined;
  if (priceAmd != null) {
    priceLabel = `${formatAmd(priceAmd)} ֏`;
  } else if (priceNegotiable) {
    priceLabel = t("detail.priceOpen");
  }

  const desc =
    description != null && description.trim()
      ? truncateCardText(tContent(locale, description))
      : null;

  const age = createdAt ? formatListingAge(createdAt, locale) : null;

  return (
    <PostCard
      href={`/machinery/${id}`}
      title={tContent(locale, title)}
      thumb={cover}
      icon={<MachineryTypeIcon type={machineryType} size={28} />}
      categoryPill={t(`machineryTypes.${machineryType}` as "machineryTypes.TRACTOR")}
      description={desc}
      facts={facts}
      value={priceLabel}
      valueExtra={
        priceNegotiable && priceAmd != null ? t("machinery.negotiable") : null
      }
      photoCount={images.length}
      status={trusted ? "verified" : "active"}
      footMeta={[
        age,
        trusted ? t("browse.verified") : null,
      ]}
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
