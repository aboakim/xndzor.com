"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export type EarlyBirdApi = {
  totalRegistered: number;
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

  const registered = data.totalRegistered;
  const limit = data.freeLimit;
  const remaining = data.remaining;
  const slotsFull = data.slotsFull;

  const showCounter = !slotsFull;
  const userHasSlot = data.userEarlyBirdFree;

  if (slotsFull && !userHasSlot) {
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
            {t("registeredCount", { registered, limit })}
          </p>
          <Link href="/pricing" className="btn primary early-bird-banner-cta">
            {t("ctaPricing")}
          </Link>
        </div>
      </section>
    );
  }

  if (userHasSlot && slotsFull) {
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

  return (
    <section
      className={`early-bird-banner early-bird-banner-${variant}`}
      role="status"
      aria-live="polite"
    >
      <div className="early-bird-banner-glow" aria-hidden />
      <div className="early-bird-banner-inner">
        <p className="early-bird-banner-eyebrow">{t("eyebrow")}</p>
        <h2 className="early-bird-banner-headline">{t("headline")}</h2>
        <p className="early-bird-banner-sub">{t("subheadline")}</p>
        {showCounter ? (
          <div className="early-bird-banner-stats">
            <p className="early-bird-banner-counter early-bird-banner-counter-big">
              {t("remaining", { remaining })}
            </p>
            <p className="early-bird-banner-progress">
              {t("registeredCount", { registered, limit })}
            </p>
          </div>
        ) : null}
        <div className="early-bird-banner-actions">
          <Link href="/auth/register" className="btn primary early-bird-banner-cta">
            {t("ctaRegister")}
          </Link>
          <Link href="/pricing" className="btn ghost early-bird-banner-cta-secondary">
            {t("ctaPricing")}
          </Link>
        </div>
      </div>
    </section>
  );
}
