"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import {
  digitsOnly,
  formatCardNumber,
  formatExpiry,
  validateCardForm,
  type CardFormValues,
} from "@/lib/payments/card-validation";
import { StripeCardSection } from "./StripeCardSection";

type Step = "card" | "otp" | "stripe";

type PaymentInfo = {
  id: string;
  amountAmd: number;
  productCode: string;
  provider: "DEMO" | "STRIPE";
  status: string;
  phone: string | null;
};

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch("/api/csrf");
  const data = (await res.json()) as { token?: string };
  return data.token || "";
}

export default function CardCheckoutClient() {
  const t = useTranslations("payments.cardCheckout");
  const tPricing = useTranslations("pricing");
  const locale = useLocale();
  const sp = useSearchParams();
  const paymentId = sp.get("paymentId") || "";
  const { status: authStatus } = useSession();

  const [step, setStep] = useState<Step>("card");
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [phoneMasked, setPhoneMasked] = useState("");
  const [demoOtpHint, setDemoOtpHint] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const [cardForm, setCardForm] = useState<CardFormValues>({
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardholderName: "",
  });
  const [phoneInput, setPhoneInput] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isDemo = payment?.provider === "DEMO";

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      window.location.href = `/${locale}/auth/login?callbackUrl=/${locale}/checkout/card?paymentId=${paymentId}`;
    }
  }, [authStatus, locale, paymentId]);

  useEffect(() => {
    if (!paymentId || authStatus !== "authenticated") return;
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/payments/card/info?paymentId=${encodeURIComponent(paymentId)}`);
        const data = (await res.json()) as PaymentInfo & { error?: string };
        if (!res.ok) {
          setError(t(`errors.${data.error || "not_found"}` as "errors.not_found"));
          return;
        }
        setPayment(data);
        setPhoneInput(data.phone || "");
        if (data.status === "SUCCEEDED") {
          window.location.href = `/${locale}/checkout/success?paymentId=${paymentId}`;
        }
      } catch {
        setError(t("errors.generic"));
      } finally {
        setLoading(false);
      }
    })();
  }, [paymentId, authStatus, locale, t]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      const digit = value.replace(/\D/g, "").slice(-1);
      const next = [...otp];
      next[index] = digit;
      setOtp(next);
      if (digit && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    },
    [otp],
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    },
    [otp],
  );

  async function submitDemoCard(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const validationError = validateCardForm(cardForm);
    if (validationError) {
      setError(t(`errors.${validationError}` as "errors.generic"));
      return;
    }
    if (!phoneInput.trim()) {
      setError(t("errors.phone_required"));
      return;
    }

    setBusy(true);
    try {
      const csrf = await fetchCsrfToken();
      const num = digitsOnly(cardForm.cardNumber);
      const exp = digitsOnly(cardForm.expiry);
      const res = await fetch("/api/payments/card/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify({
          paymentId,
          last4: num.slice(-4),
          cardholderName: cardForm.cardholderName.trim(),
          expiryMonth: exp.slice(0, 2),
          expiryYear: exp.slice(2, 4),
          phone: phoneInput.trim(),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        mode?: string;
        phoneMasked?: string;
        demoOtp?: string;
      };
      if (!res.ok) {
        setError(t(`errors.${data.error || "generic"}` as "errors.generic"));
        return;
      }
      setPhoneMasked(data.phoneMasked || "");
      if (data.demoOtp) {
        setDemoOtpHint(data.demoOtp);
      }
      setStep("otp");
      setResendCooldown(60);
    } catch {
      setError(t("errors.generic"));
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length !== 6) {
      setError(t("errors.otp_required"));
      return;
    }

    setBusy(true);
    try {
      const csrf = await fetchCsrfToken();
      const res = await fetch("/api/payments/card/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify({ paymentId, otp: code }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setError(t(`errors.${data.error || "generic"}` as "errors.generic"));
        return;
      }
      window.location.href = `/${locale}/checkout/success?paymentId=${paymentId}`;
    } catch {
      setError(t("errors.generic"));
    } finally {
      setBusy(false);
    }
  }

  async function resendOtp() {
    if (resendCooldown > 0) return;
    setError("");
    setBusy(true);
    try {
      const csrf = await fetchCsrfToken();
      const res = await fetch("/api/payments/card/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify({ paymentId }),
      });
      const data = (await res.json()) as {
        error?: string;
        demoOtp?: string;
        phoneMasked?: string;
      };
      if (!res.ok) {
        setError(t(`errors.${data.error || "generic"}` as "errors.generic"));
        return;
      }
      if (data.demoOtp) setDemoOtpHint(data.demoOtp);
      if (data.phoneMasked) setPhoneMasked(data.phoneMasked);
      setOtp(["", "", "", "", "", ""]);
      setResendCooldown(60);
    } catch {
      setError(t("errors.generic"));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="section card-checkout-page">
        <p className="tiny muted">{tPricing("processing")}</p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="section card-checkout-page">
        <p className="form-error">{error || t("errors.not_found")}</p>
        <Link href="/pricing" className="btn ghost">
          {t("backToPricing")}
        </Link>
      </div>
    );
  }

  return (
    <div className="section card-checkout-page">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1>{t("title")}</h1>
      <p className="lede">
        {t("amount", { amount: payment.amountAmd.toLocaleString() })}
      </p>

      <div className="card-checkout-logos" aria-hidden="true">
        <span className="pay-badge pay-badge-visa">Visa</span>
        <span className="pay-badge pay-badge-mastercard">MC</span>
        <span className="pay-badge pay-badge-arca">ArCa</span>
      </div>

      {isDemo ? (
        <>
          {step === "card" ? (
            <form className="card-checkout-form" onSubmit={submitDemoCard}>
              <div className="form-row">
                <label htmlFor="cardNumber">{t("cardNumber")}</label>
                <input
                  id="cardNumber"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  className="card-input"
                  placeholder="0000 0000 0000 0000"
                  value={cardForm.cardNumber}
                  onChange={(e) =>
                    setCardForm((f) => ({
                      ...f,
                      cardNumber: formatCardNumber(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="form-row form-row-2">
                <div>
                  <label htmlFor="expiry">{t("expiry")}</label>
                  <input
                    id="expiry"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    className="card-input"
                    placeholder="MM/YY"
                    value={cardForm.expiry}
                    onChange={(e) =>
                      setCardForm((f) => ({
                        ...f,
                        expiry: formatExpiry(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <label htmlFor="cvv">{t("cvv")}</label>
                  <input
                    id="cvv"
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    className="card-input"
                    placeholder="•••"
                    maxLength={4}
                    value={cardForm.cvv}
                    onChange={(e) =>
                      setCardForm((f) => ({
                        ...f,
                        cvv: digitsOnly(e.target.value).slice(0, 4),
                      }))
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="cardholderName">{t("cardholderName")}</label>
                <input
                  id="cardholderName"
                  type="text"
                  autoComplete="cc-name"
                  className="card-input"
                  value={cardForm.cardholderName}
                  onChange={(e) =>
                    setCardForm((f) => ({ ...f, cardholderName: e.target.value }))
                  }
                />
              </div>
              {!payment.phone ? (
                <div className="form-row">
                  <label htmlFor="phone">{t("phone")}</label>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    className="card-input"
                    placeholder="+374..."
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                  />
                </div>
              ) : null}
              {isDemo ? (
                <p className="demo-pay-banner tiny" role="status">
                  {t("demoBanner")}
                </p>
              ) : null}
              <button type="submit" className="btn primary card-checkout-submit" disabled={busy}>
                {busy ? tPricing("processing") : t("continue")}
              </button>
            </form>
          ) : (
            <form className="card-checkout-form" onSubmit={verifyOtp}>
              <p className="card-otp-message">
                {t("otpMessage", { phone: phoneMasked || phoneInput })}
              </p>
              {demoOtpHint ? (
                <p className="demo-pay-banner tiny" role="status">
                  {t("demoOtpHint", { code: demoOtpHint })}
                </p>
              ) : (
                <p className="tiny muted">{t("demoOtpConsole")}</p>
              )}
              <div className="otp-input-row" role="group" aria-label={t("otpLabel")}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="otp-digit-input"
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
              <button type="submit" className="btn primary card-checkout-submit" disabled={busy}>
                {busy ? tPricing("processing") : t("confirmPayment")}
              </button>
              <button
                type="button"
                className="btn ghost card-resend-link"
                disabled={busy || resendCooldown > 0}
                onClick={resendOtp}
              >
                {resendCooldown > 0
                  ? t("resendWait", { sec: resendCooldown })
                  : t("resendCode")}
              </button>
            </form>
          )}
        </>
      ) : (
        <StripeCardSection
          paymentId={paymentId}
          locale={locale}
          amountAmd={payment.amountAmd}
          onError={(code) => setError(t(`errors.${code || "generic"}` as "errors.generic"))}
        />
      )}

      {error ? <p className="form-error">{error}</p> : null}

      <Link href="/pricing" className="btn ghost card-checkout-cancel">
        {t("cancel")}
      </Link>
    </div>
  );
}
