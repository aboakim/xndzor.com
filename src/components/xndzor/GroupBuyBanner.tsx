"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatAmd } from "@/lib/utils";

/** Demo savings used in marketing copy (AMD per farm). */
const SOLO_PRICE = 85_000;
const GROUP_PRICE = 48_000;
const SAVINGS_PCT = Math.round((1 - GROUP_PRICE / SOLO_PRICE) * 100);

export function GroupBuyBanner() {
  const t = useTranslations("xndzor.groupBuyBanner");
  const locale = useLocale();

  return (
    <section className="gbb" aria-labelledby="gbb-title">
      <div className="gbb-atmosphere" aria-hidden>
        <span className="gbb-orb gbb-orb-a" />
        <span className="gbb-orb gbb-orb-b" />
        <span className="gbb-grain" />
        <span className="gbb-sheen" />
      </div>

      <div className="gbb-inner">
        <div className="gbb-copy">
          <p className="gbb-badge">
            <span className="gbb-badge-dot" aria-hidden />
            {t("badge")}
          </p>

          <p className="gbb-brand">{t("brand")}</p>

          <h2 id="gbb-title" className="gbb-title">
            {t("headline")}
          </h2>

          <p className="gbb-lede">{t("lede")}</p>

          <p className="gbb-exclusive">{t("exclusive")}</p>

          <div className="gbb-cta-row">
            <Link href="/group-buy" className="btn primary gbb-cta">
              {t("cta")}
            </Link>
            <Link href="/group-buy/about" className="btn gbb-cta-learn">
              {t("ctaLearnMore")}
            </Link>
            <Link href="/group-buy" className="gbb-cta-secondary">
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>

        <div className="gbb-visual" aria-hidden>
          <div className="gbb-farms">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`gbb-farm gbb-farm-${i}`}>
                <span className="gbb-farm-icon">🏡</span>
              </span>
            ))}
            <span className="gbb-hub">
              <span className="gbb-hub-ring" />
              <span className="gbb-hub-core">🍎</span>
            </span>
            <svg className="gbb-links" viewBox="0 0 200 160" fill="none">
              <path className="gbb-link gbb-link-0" d="M40 40 C70 55, 90 70, 100 90" />
              <path className="gbb-link gbb-link-1" d="M160 36 C140 55, 115 70, 100 90" />
              <path className="gbb-link gbb-link-2" d="M28 120 C55 110, 80 100, 100 90" />
              <path className="gbb-link gbb-link-3" d="M172 118 C145 110, 120 100, 100 90" />
            </svg>
          </div>

          <div className="gbb-savings">
            <div className="gbb-price gbb-price-solo">
              <span className="gbb-price-label">{t("soloLabel")}</span>
              <del className="gbb-price-value">
                {formatAmd(SOLO_PRICE, locale)} ֏
              </del>
              <span className="gbb-price-unit">{t("perFarm")}</span>
            </div>
            <div className="gbb-price gbb-price-group">
              <span className="gbb-price-label">{t("groupLabel")}</span>
              <strong className="gbb-price-value">
                {formatAmd(GROUP_PRICE, locale)} ֏
              </strong>
              <span className="gbb-price-unit">{t("perFarm")}</span>
            </div>
            <p className="gbb-save-chip">
              {t("saveChip", { pct: SAVINGS_PCT })}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
