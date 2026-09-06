"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export type FeatureBannerVariant = "solve" | "route" | "grow" | "passport";
export type FeatureBannerSize = "spotlight" | "wide" | "compact";

type FeatureBannerProps = {
  variant: FeatureBannerVariant;
  href: string;
  aboutHref: string;
  visual: ReactNode;
  titleId: string;
  size?: FeatureBannerSize;
  /** Flip copy/visual columns on desktop (wide/spotlight). */
  mirror?: boolean;
};

export function FeatureBanner({
  variant,
  href,
  aboutHref,
  visual,
  titleId,
  size = "spotlight",
  mirror = false,
}: FeatureBannerProps) {
  const t = useTranslations(`xndzor.featureBanners.${variant}`);
  const tShared = useTranslations("xndzor.featureBanners");

  const cta = href.startsWith("#") ? (
    <a href={href} className="btn primary fxb-cta">
      {t("cta")}
    </a>
  ) : (
    <Link href={href} className="btn primary fxb-cta">
      {t("cta")}
    </Link>
  );

  return (
    <article
      className={[
        "fxb",
        `fxb-${variant}`,
        `fxb-size-${size}`,
        mirror ? "fxb-mirror" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby={titleId}
    >
      <div className="fxb-atmosphere" aria-hidden>
        <span className="fxb-orb fxb-orb-a" />
        <span className="fxb-orb fxb-orb-b" />
        <span className="fxb-grain" />
        <span className="fxb-sheen" />
      </div>

      <div className="fxb-inner">
        <div className="fxb-copy">
          <p className="fxb-badge">
            <span className="fxb-badge-dot" aria-hidden />
            {tShared("exclusive")}
          </p>

          <p className="fxb-brand">{t("brand")}</p>

          <h2 id={titleId} className="fxb-title">
            {t("headline")}
          </h2>

          <p className="fxb-lede">{t("lede")}</p>

          {size !== "compact" ? <p className="fxb-hook">{t("hook")}</p> : null}

          <div className="fxb-cta-row">
            {cta}
            <Link href={aboutHref} className="btn fxb-cta-learn">
              {tShared("ctaLearnMore")}
            </Link>
          </div>
        </div>

        <div className="fxb-visual" aria-hidden>
          {visual}
        </div>
      </div>
    </article>
  );
}
