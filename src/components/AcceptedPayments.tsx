"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { PaymentBadges } from "@/components/PaymentBadges";
import { handleCheckoutResponse } from "@/lib/payments/redirect";

type PaymentAvailability = {
  stripe: boolean;
  idram: boolean;
  telcell: boolean;
  any: boolean;
  demo: boolean;
};

type Props = {
  productCode?: string;
  /** Compact row only (no method picker) */
  badgesOnly?: boolean;
};

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch("/api/csrf");
  const data = (await res.json()) as { token?: string };
  return data.token || "";
}

async function fetchAvailability(): Promise<PaymentAvailability> {
  const res = await fetch("/api/payments/methods");
  if (!res.ok) {
    return { stripe: false, idram: false, telcell: false, any: false, demo: true };
  }
  return res.json() as Promise<PaymentAvailability>;
}

function DemoModeBanner({ title, note }: { title: string; note: string }) {
  return (
    <div className="demo-mode-banner" role="status">
      <p className="demo-mode-banner-title">{title}</p>
      <p className="demo-mode-banner-note">{note}</p>
    </div>
  );
}

export function AcceptedPayments({ badgesOnly = false }: Props) {
  const t = useTranslations("payments");
  const tPricing = useTranslations("pricing");
  const [availability, setAvailability] = useState<PaymentAvailability | null>(null);

  useEffect(() => {
    void fetchAvailability().then(setAvailability);
  }, []);

  const demoMode = Boolean(availability?.demo);

  if (badgesOnly) {
    return (
      <div className="accepted-payments">
        {demoMode ? (
          <DemoModeBanner
            title={tPricing("demoModeTitle")}
            note={t("demoModeNote")}
          />
        ) : null}
        <PaymentBadges
          label={t("acceptedMethods")}
          comingSoonLabel={t("comingSoon")}
          demoMode={demoMode}
          linkToPricing={demoMode}
          demoBadgeLabel={t("demoBadge")}
        />
      </div>
    );
  }

  return (
    <div className="accepted-payments">
      {demoMode ? (
        <DemoModeBanner
          title={tPricing("demoModeTitle")}
          note={t("demoModeNote")}
        />
      ) : null}
      <h3 className="accepted-payments-title">{t("chooseMethod")}</h3>
      <p className="tiny muted">{t("chooseMethodHint")}</p>
      <PaymentBadges
        label={t("acceptedMethods")}
        comingSoonLabel={t("comingSoon")}
        demoMode={demoMode}
        demoBadgeLabel={t("demoBadge")}
      />
      {!demoMode && !availability?.any ? (
        <p className="demo-pay-banner" role="status">
          {t("configurePaymentsProd")}
        </p>
      ) : null}
    </div>
  );
}

type CheckoutPickerProps = {
  productCode: string;
  targetType?: string;
  targetId?: string;
  disabled?: boolean;
  onError?: (msg: string) => void;
  compact?: boolean;
};

export function PaymentMethodPicker({
  productCode,
  targetType,
  targetId,
  disabled,
  onError,
  compact = false,
}: CheckoutPickerProps) {
  const t = useTranslations("payments");
  const tPricing = useTranslations("pricing");
  const locale = useLocale();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [availability, setAvailability] = useState<PaymentAvailability | null>(null);

  useEffect(() => {
    void fetchAvailability().then(setAvailability);
  }, []);

  const methods: {
    id: "stripe" | "idram" | "telcell";
    label: string;
    badges: ReactNode;
    enabled: boolean;
  }[] = [
    {
      id: "stripe",
      label: t("cardStripe"),
      badges: (
        <>
          <span className="pay-badge pay-badge-visa">Visa</span>
          <span className="pay-badge pay-badge-mastercard">MC</span>
          <span className="pay-badge pay-badge-arca">ArCa</span>
        </>
      ),
      enabled: Boolean(availability?.stripe),
    },
    {
      id: "idram",
      label: "iDram",
      badges: <span className="pay-badge pay-badge-idram">iDram</span>,
      enabled: Boolean(availability?.idram),
    },
    {
      id: "telcell",
      label: "TelCell",
      badges: <span className="pay-badge pay-badge-telcell">TelCell</span>,
      enabled: Boolean(availability?.telcell),
    },
  ];

  const demoMode = Boolean(availability?.demo);
  const visibleMethods = methods.filter((m) => m.enabled || demoMode);

  async function checkout(provider: "stripe" | "idram" | "telcell") {
    if (status === "unauthenticated" || !session) {
      window.location.href = `/${locale}/auth/login?callbackUrl=/${locale}/pricing`;
      return;
    }
    setLoading(provider);
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
          paymentProvider: provider,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        mode?: string;
        url?: string;
        demoCheckoutUrl?: string;
        cardCheckoutUrl?: string;
        redirect?: { action: string; fields: Record<string, string> };
        ok?: boolean;
      };
      if (!res.ok) {
        onError?.(data.error || "generic");
        return;
      }
      if (!handleCheckoutResponse(data)) {
        onError?.("generic");
      }
    } catch {
      onError?.("generic");
    } finally {
      setLoading(null);
    }
  }

  if (!availability) {
    return <p className="tiny muted">{tPricing("processing")}</p>;
  }

  if (!availability.any && !demoMode) {
    return (
      <p className="demo-pay-banner" role="status">
        {t("configurePaymentsProd")}
      </p>
    );
  }

  return (
    <div className={`payment-method-picker${compact ? " payment-method-picker-compact" : ""}`}>
      {demoMode && !compact ? (
        <DemoModeBanner
          title={tPricing("demoModeTitle")}
          note={t("demoModeNote")}
        />
      ) : null}
      {!compact ? (
        <h4 className="payment-method-picker-title">{t("chooseMethod")}</h4>
      ) : null}
      <ul className="payment-method-list">
        {visibleMethods.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              className={`payment-method-option${m.enabled || demoMode ? " payment-method-active" : ""}`}
              disabled={disabled || (!m.enabled && !demoMode) || loading !== null}
              onClick={() => checkout(m.id)}
            >
              {m.badges}
              <span className="payment-method-label">{m.label}</span>
              {m.enabled ? (
                <span className="payment-method-status payment-method-status-active">
                  {t("active")}
                </span>
              ) : demoMode ? (
                <span className="payment-method-status payment-method-status-demo">
                  {t("demoOnly")}
                </span>
              ) : (
                <span className="payment-method-status">{t("comingSoon")}</span>
              )}
              {loading === m.id ? <span className="payment-method-loading">…</span> : null}
            </button>
          </li>
        ))}
      </ul>
      {!compact ? <p className="tiny muted">{t("arcaNote")}</p> : null}
    </div>
  );
}
