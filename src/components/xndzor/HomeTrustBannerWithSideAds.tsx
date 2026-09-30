import { getTranslations } from "next-intl/server";
import { HOME_SIDE_BANNERS } from "@/lib/side-banners";
import { HomeSideBannerSlot } from "@/components/xndzor/HomeSideBannerSlot";
import { WelcomeTrustBanner } from "@/components/xndzor/WelcomeTrustBanner";

export async function HomeTrustBannerWithSideAds() {
  const t = await getTranslations("xndzor.sideBanners");
  const altFallback = t("label");

  return (
    <div className="home-trust-ads-row">
      <HomeSideBannerSlot
        side="left"
        config={HOME_SIDE_BANNERS.left}
        label={t("label")}
        sizeLabel={t("size")}
        ariaLabel={t("slotAriaLeft")}
        altFallback={altFallback}
      />
      <div className="home-trust-ads-main">
        <WelcomeTrustBanner />
      </div>
      <HomeSideBannerSlot
        side="right"
        config={HOME_SIDE_BANNERS.right}
        label={t("label")}
        sizeLabel={t("size")}
        ariaLabel={t("slotAriaRight")}
        altFallback={altFallback}
      />
    </div>
  );
}
