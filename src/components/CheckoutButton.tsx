"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import type { ProductCode, BoostTargetType } from "@/lib/pricing";

type Props = {
  productCode: ProductCode;
  label?: string;
  className?: string;
  targetType?: BoostTargetType;
  targetId?: string;
  useProQuota?: boolean;
  disabled?: boolean;
};

export function CheckoutButton({
  productCode,
  label,
  className = "btn primary",
  targetType,
  targetId,
  useProQuota,
  disabled,
}: Props) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setError("");
    if (status === "unauthenticated" || !session) {
      window.location.href = `/${locale}/auth/login?callbackUrl=/${locale}/pricing`;
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productCode,
          locale,
          targetType,
          targetId,
          useProQuota,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        mode?: string;
        url?: string;
        demoCheckoutUrl?: string;
        ok?: boolean;
      };
      if (!res.ok) {
        setError(t(`errors.${data.error || "generic"}` as "errors.generic"));
        return;
      }
      if (data.mode === "pro_quota" && data.ok) {
        window.location.reload();
        return;
      }
      if (data.mode === "demo" && data.demoCheckoutUrl) {
        window.location.href = data.demoCheckoutUrl;
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(t("errors.generic"));
    } catch {
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="checkout-btn-wrap">
      <button
        type="button"
        className={className}
        disabled={disabled || loading}
        onClick={startCheckout}
      >
        {loading ? t("processing") : label || t("buy")}
      </button>
      {error ? <p className="form-error tiny">{error}</p> : null}
    </div>
  );
}

export function GoProLink({ className = "btn ghost" }: { className?: string }) {
  const t = useTranslations("pricing");
  return (
    <Link href="/pricing" className={className}>
      {t("goPro")}
    </Link>
  );
}
