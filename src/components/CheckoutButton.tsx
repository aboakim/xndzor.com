"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { PaymentMethodPicker } from "@/components/AcceptedPayments";
import { arePackagesFree, type ProductCode, type BoostTargetType } from "@/lib/pricing";

type Props = {
  productCode: ProductCode;
  label?: string;
  className?: string;
  targetType?: BoostTargetType;
  targetId?: string;
  useProQuota?: boolean;
  disabled?: boolean;
  /** Override; defaults to arePackagesFree() */
  freeMode?: boolean;
};

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch("/api/csrf");
  const data = (await res.json()) as { token?: string };
  return data.token || "";
}

export function CheckoutButton({
  productCode,
  label,
  className = "btn primary",
  targetType,
  targetId,
  useProQuota,
  disabled,
  freeMode,
}: Props) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const isFree = freeMode ?? arePackagesFree();

  async function openPaidCheckout() {
    setError("");
    if (status === "unauthenticated" || !session) {
      window.location.href = `/${locale}/auth/login?callbackUrl=/${locale}/pricing`;
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/payments/methods");
      const avail = (await res.json().catch(() => null)) as {
        any?: boolean;
        demo?: boolean;
      } | null;
      if (!avail?.any && !avail?.demo) {
        setError(t("errors.payment_required_in_production"));
        return;
      }
      setShowPicker(true);
    } catch {
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  async function startDirectCheckout(opts?: { useProQuota?: boolean }) {
    setError("");
    if (status === "unauthenticated" || !session) {
      window.location.href = `/${locale}/auth/login?callbackUrl=/${locale}/pricing`;
      return;
    }
    setLoading(true);
    try {
      const csrf = await fetchCsrfToken();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify({
          productCode,
          locale,
          targetType,
          targetId,
          useProQuota: opts?.useProQuota ?? false,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        ok?: boolean;
        mode?: string;
        paymentId?: string;
      };
      if (!res.ok) {
        setError(t(`errors.${data.error || "generic"}` as "errors.generic"));
        return;
      }
      if (data.mode === "pro_quota" && data.ok) {
        window.location.reload();
        return;
      }
      if (data.mode === "free" && data.ok) {
        const pid = data.paymentId ? `?paymentId=${data.paymentId}` : "";
        window.location.href = `/${locale}/checkout/success${pid}`;
        return;
      }
      setError(t("errors.generic"));
    } catch {
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  if (useProQuota) {
    return (
      <div className="checkout-btn-wrap">
        <button
          type="button"
          className={className}
          disabled={disabled || loading}
          onClick={() => startDirectCheckout({ useProQuota: true })}
        >
          {loading ? t("processing") : label || t("buy")}
        </button>
        {error ? <p className="form-error tiny">{error}</p> : null}
      </div>
    );
  }

  if (isFree) {
    return (
      <div className="checkout-btn-wrap">
        <button
          type="button"
          className={className}
          disabled={disabled || loading}
          onClick={() => startDirectCheckout()}
        >
          {loading ? t("processing") : label || t("activate")}
        </button>
        {error ? <p className="form-error tiny">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="checkout-btn-wrap">
      {!showPicker ? (
        <button
          type="button"
          className={className}
          disabled={disabled || loading}
          onClick={() => void openPaidCheckout()}
        >
          {loading ? t("processing") : label || t("buy")}
        </button>
      ) : (
        <PaymentMethodPicker
          productCode={productCode}
          targetType={targetType}
          targetId={targetId}
          disabled={disabled}
          compact
          onError={(code) =>
            setError(t(`errors.${code || "generic"}` as "errors.generic"))
          }
        />
      )}
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
