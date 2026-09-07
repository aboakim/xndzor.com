"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const TRUST_BADGES = ["verified", "amd", "exclusive"] as const;

const FARMER_PERKS = ["buyer", "workers", "equipment"] as const;
const BUYER_PERKS = ["fresh", "farmer", "supplier"] as const;

export function WelcomeTrustBanner() {
  const t = useTranslations("xndzor.welcomeTrust");

  return (
    <section className="wtb" aria-labelledby="wtb-headline">
      <div className="wtb-atmosphere" aria-hidden>
        <span className="wtb-orb wtb-orb-farmer" />
        <span className="wtb-orb wtb-orb-buyer" />
        <span className="wtb-orb wtb-orb-gold" />
        <span className="wtb-grain" />
      </div>

      <div className="wtb-inner">
        <header className="wtb-header wtb-reveal" style={{ "--wtb-delay": "0ms" } as CSSProperties}>
          <p className="wtb-badge">
            <span className="wtb-badge-dot" aria-hidden />
            {t("badge")}
          </p>
          <h2 id="wtb-headline" className="wtb-headline">
            {t("headline")}
          </h2>
          <p className="wtb-subheadline">{t("subheadline")}</p>
        </header>

        <div className="wtb-audience">
          <article
            className="wtb-card wtb-card-farmer wtb-reveal wtb-reveal-from-left"
            style={{ "--wtb-delay": "90ms" } as CSSProperties}
          >
            <span className="wtb-card-icon wtb-float-farmer" aria-hidden>
              👨‍🌾
            </span>
            <div className="wtb-card-body">
              <h3 className="wtb-card-title">{t("farmerTitle")}</h3>
              <p className="wtb-card-desc">{t("farmerDesc")}</p>
              <ul className="wtb-perks">
                {FARMER_PERKS.map((key, i) => (
                  <li
                    key={key}
                    className="wtb-perk"
                    style={{ "--wtb-perk-delay": `${220 + i * 70}ms` } as CSSProperties}
                  >
                    {t(`farmerPerks.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <span
            className="wtb-bridge wtb-reveal wtb-reveal-scale"
            style={{ "--wtb-delay": "160ms" } as CSSProperties}
            aria-hidden
          >
            <span className="wtb-bridge-line" />
            <span className="wtb-bridge-core">🍎</span>
            <span className="wtb-bridge-line" />
          </span>

          <article
            className="wtb-card wtb-card-buyer wtb-reveal wtb-reveal-from-right"
            style={{ "--wtb-delay": "140ms" } as CSSProperties}
          >
            <span className="wtb-card-icon wtb-float-buyer" aria-hidden>
              🛒
            </span>
            <div className="wtb-card-body">
              <h3 className="wtb-card-title">{t("buyerTitle")}</h3>
              <p className="wtb-card-desc">{t("buyerDesc")}</p>
              <ul className="wtb-perks">
                {BUYER_PERKS.map((key, i) => (
                  <li
                    key={key}
                    className="wtb-perk"
                    style={{ "--wtb-perk-delay": `${260 + i * 70}ms` } as CSSProperties}
                  >
                    {t(`buyerPerks.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>

        <ul className="wtb-trust-badges" aria-label={t("badgesLabel")}>
          {TRUST_BADGES.map((key, i) => (
            <li
              key={key}
              className="wtb-trust-badge wtb-reveal"
              style={{ "--wtb-delay": `${320 + i * 80}ms` } as CSSProperties}
            >
              <span className="wtb-trust-badge-pulse" aria-hidden />
              {t(`badges.${key}`)}
            </li>
          ))}
        </ul>

        <div
          className="wtb-cta-row wtb-reveal"
          style={{ "--wtb-delay": "520ms" } as CSSProperties}
        >
          <Link href="#xndzor-hero" className="btn primary wtb-cta-primary">
            {t("ctaPrimary")}
          </Link>
          <Link href="/supply" className="btn wtb-cta-secondary">
            {t("ctaListings")}
          </Link>
          <Link href="/auth/register" className="wtb-cta-ghost">
            {t("ctaRegister")}
          </Link>
        </div>
      </div>
    </section>
  );
}
