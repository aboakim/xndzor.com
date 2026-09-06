"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Props = {
  initialStatus: string;
  paymentId: string;
  sessionId?: string;
  unlockLabel?: string;
  listingHref?: string | null;
  passportHref?: string | null;
};

export function CheckoutSuccessPoller({
  initialStatus,
  paymentId,
  sessionId,
  unlockLabel,
  listingHref,
  passportHref,
}: Props) {
  const t = useTranslations("pricing");
  const [status, setStatus] = useState(initialStatus);
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    if (status === "SUCCEEDED" || polls >= 8) return;

    const timer = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ paymentId });
        if (sessionId) qs.set("session_id", sessionId);
        const res = await fetch(`/api/checkout/verify?${qs.toString()}`);
        if (res.ok) {
          const data = (await res.json()) as { status?: string };
          if (data.status) setStatus(data.status);
        }
      } catch {
        // ignore — webhook may still arrive
      }
      setPolls((n) => n + 1);
    }, 2000);

    return () => clearTimeout(timer);
  }, [status, polls, paymentId, sessionId]);

  const succeeded = status === "SUCCEEDED";

  return (
    <div className="checkout-result-page">
      <p className="eyebrow">{t("success.eyebrow")}</p>
      <h1>{t("success.title")}</h1>
      <p className="lede">
        {succeeded ? t("success.activated") : t("success.pending")}
      </p>
      {succeeded && unlockLabel ? (
        <p className="checkout-unlock-note">{unlockLabel}</p>
      ) : null}
      <div className="pricing-actions">
        {succeeded && listingHref ? (
          <a href={listingHref} className="btn primary">
            {t("success.viewListing")}
          </a>
        ) : null}
        {succeeded && passportHref ? (
          <a href={passportHref} className="btn primary">
            {t("success.viewPassport")}
          </a>
        ) : null}
        <Link href="/account/billing" className="btn ghost">
          {t("myBilling")}
        </Link>
        <Link href="/pricing" className="btn ghost">
          {t("title")}
        </Link>
      </div>
    </div>
  );
}
