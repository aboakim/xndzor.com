"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export type EarlyBirdApi = {
  totalRegistered: number;
  earlyBirdClaimed?: number;
  freeLimit: number;
  remaining: number;
  slotsFull: boolean;
  earlyBirdEnabled: boolean;
  packagesFreeOverride: boolean;
  showFreePricing: boolean;
  userEarlyBirdFree: boolean;
  userCheckoutFree: boolean;
};

type Props = {
  /** Initial snapshot from server (optional — refreshes on mount). */
  initial?: EarlyBirdApi | null;
  /** compact strip vs full hero banner */
  variant?: "hero" | "strip";
};

export function EarlyBirdBannerClient({
  initial = null,
  variant = "hero",
}: Props) {
  const t = useTranslations("earlyBird");
  const pathname = usePathname();
  const onPricing = pathname === "/pricing" || pathname.endsWith("/pricing");
  const [data, setData] = useState<EarlyBirdApi | null>(initial);
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/early-bird")
      .then((r) => r.json())
      .then((json: EarlyBirdApi) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !data) return null;
  if (!data) return null;

  if (data.packagesFreeOverride || !data.earlyBirdEnabled) return null;

  const claimed = data.earlyBirdClaimed ?? data.totalRegistered;
  const limit = data.freeLimit;
  const remaining = data.remaining;
  const slotsFull = data.slotsFull;
  const userHasSlot = data.userEarlyBirdFree;
  const isStrip = variant === "strip";

  if (slotsFull && !userHasSlot) {
    if (isStrip) {
      return (
        <section
          className="early-bird-banner early-bird-banner-strip early-bird-banner-full"
          role="status"
          aria-live="polite"
        >
          <div className="early-bird-strip-row">
            <div className="early-bird-strip-copy">
              <span className="early-bird-banner-eyebrow">{t("slotsFullEyebrow")}</span>
              <p className="early-bird-strip-text">{t("slotsFullHeadline")}</p>
            </div>
            {!onPricing ? (
              <Link href="/pricing" className="btn primary early-bird-banner-cta early-bird-strip-cta">
                {t("ctaPricing")}
              </Link>
            ) : null}
          </div>
        </section>
      );
    }

    return (
      <section
        className={`early-bird-banner early-bird-banner-${variant} early-bird-banner-full`}
        role="status"
        aria-live="polite"
      >
        <div className="early-bird-banner-inner">
          <p className="early-bird-banner-eyebrow">{t("slotsFullEyebrow")}</p>
          <h2 className="early-bird-banner-headline">{t("slotsFullHeadline")}</h2>
          <p className="early-bird-banner-counter">
            {t("claimedCount", { claimed, limit })}
          </p>
          <Link href="/pricing" className="btn primary early-bird-banner-cta">
            {t("ctaPricing")}
          </Link>
        </div>
      </section>
    );
  }

  if (userHasSlot && slotsFull) {
    if (isStrip) {
      return (
        <section
          className="early-bird-banner early-bird-banner-strip early-bird-banner-yours"
          role="status"
          aria-live="polite"
        >
          <div className="early-bird-strip-row">
            <div className="early-bird-strip-copy">
              <span className="early-bird-banner-eyebrow">{t("yoursEyebrow")}</span>
              <p className="early-bird-strip-text">{t("yoursHeadline")}</p>
            </div>
            {!onPricing ? (
              <Link href="/pricing" className="btn primary early-bird-banner-cta early-bird-strip-cta">
                {t("ctaActivate")}
              </Link>
            ) : null}
          </div>
        </section>
      );
    }

    return (
      <section
        className={`early-bird-banner early-bird-banner-${variant} early-bird-banner-yours`}
        role="status"
        aria-live="polite"
      >
        <div className="early-bird-banner-inner">
          <p className="early-bird-banner-eyebrow">{t("yoursEyebrow")}</p>
          <h2 className="early-bird-banner-headline">{t("yoursHeadline")}</h2>
          <p className="early-bird-banner-note">{t("yoursNote")}</p>
          <Link href="/pricing" className="btn primary early-bird-banner-cta">
            {t("ctaActivate")}
          </Link>
        </div>
      </section>
    );
  }

  if (isStrip) {
    return (
      <section
        className="early-bird-banner early-bird-banner-strip"
        role="status"
        aria-live="polite"
      >
        <div className="early-bird-banner-glow" aria-hidden />
        <div className="early-bird-strip-row">
          <div className="early-bird-strip-copy">
            <span className="early-bird-banner-eyebrow">{t("eyebrow")}</span>
            <p className="early-bird-strip-text">{t("stripOffer", { limit })}</p>
          </div>
          <div className="early-bird-strip-meta">
            <span className="early-bird-strip-spots">
              {t("remaining", { remaining })}
            </span>
            {!onPricing ? (
              <Link href="/pricing" className="btn primary early-bird-banner-cta early-bird-strip-cta">
                {t("ctaActivate")}
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`early-bird-banner early-bird-banner-${variant}`}
      role="status"
      aria-live="polite"
    >
      <div className="early-bird-banner-glow" aria-hidden />
      <div className="early-bird-banner-inner">
        <p className="early-bird-banner-eyebrow">{t("eyebrow")}</p>
        <h2 className="early-bird-banner-headline">{t("headline", { limit })}</h2>
        <p className="early-bird-banner-sub">{t("subheadline", { limit })}</p>
        {!slotsFull ? (
          <div className="early-bird-banner-stats">
            <p className="early-bird-banner-counter early-bird-banner-counter-big">
              {t("remaining", { remaining })}
            </p>
            <p className="early-bird-banner-progress">
              {t("claimedCount", { claimed, limit })}
            </p>
          </div>
        ) : null}
        <div className="early-bird-banner-actions">
          <Link href="/pricing" className="btn primary early-bird-banner-cta">
            {t("ctaActivate")}
          </Link>
          <Link href="/auth/register" className="btn ghost early-bird-banner-cta-secondary">
            {t("ctaRegister")}
          </Link>
        </div>
      </div>
    </section>
  );
}
