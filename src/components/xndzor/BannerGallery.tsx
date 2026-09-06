"use client";

import { useTranslations } from "next-intl";
import { Reveal } from "@/components/Reveal";
import { FeatureBanners } from "./FeatureBanners";
import { GroupBuyBanner } from "./GroupBuyBanner";

/**
 * Composes group-buy + feature banners into a varied gallery
 * instead of a monotonous full-width vertical stack.
 */
export function BannerGallery() {
  const t = useTranslations("xndzor.featureBanners");

  return (
    <div className="banner-gallery" aria-label={t("sectionLabel")}>
      <Reveal className="banner-gallery-slot banner-gallery-lead" delayMs={40}>
        <GroupBuyBanner />
      </Reveal>
      <FeatureBanners />
    </div>
  );
}
