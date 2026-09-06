"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch("/api/csrf");
  const data = (await res.json()) as { token?: string };
  return data.token || "";
}

type Props = {
  paymentId: string;
  locale: string;
  amountAmd: number;
  onError: (code: string) => void;
};

function StripeConfirmForm({
  paymentId,
  locale,
  onError,
}: {
  paymentId: string;
  locale: string;
  onError: (code: string) => void;
}) {
  const t = useTranslations("payments.cardCheckout");
  const tPricing = useTranslations("pricing");
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setBusy(true);
    onError("");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/${locale}/checkout/success?paymentId=${paymentId}`,
      },
      redirect: "if_required",
    });

    if (error) {
      onError(error.code || "stripe_failed");
      setBusy(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      try {
        const csrf = await fetchCsrfToken();
        const res = await fetch("/api/payments/card/verify-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrf,
          },
          body: JSON.stringify({ paymentId, stripeConfirmed: true }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          onError(data.error || "generic");
          setBusy(false);
          return;
        }
        window.location.href = `/${locale}/checkout/success?paymentId=${paymentId}`;
      } catch {
        onError("generic");
        setBusy(false);
      }
      return;
    }

    if (paymentIntent?.status === "requires_action") {
      onError("");
    }

    setBusy(false);
  }

  return (
    <form className="card-checkout-form" onSubmit={handleSubmit}>
      <p className="tiny muted">{t("stripeSecureNote")}</p>
      <p className="tiny muted">{t("stripe3dsNote")}</p>
      <PaymentElement options={{ layout: "tabs" }} />
      <button type="submit" className="btn primary card-checkout-submit" disabled={busy || !stripe}>
        {busy ? tPricing("processing") : t("confirmPayment")}
      </button>
    </form>
  );
}

export function StripeCardSection({ paymentId, locale, amountAmd, onError }: Props) {
  const t = useTranslations("payments.cardCheckout");
  const tPricing = useTranslations("pricing");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const csrf = await fetchCsrfToken();
        const res = await fetch("/api/payments/card/initiate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrf,
          },
          body: JSON.stringify({ paymentId }),
        });
        const data = (await res.json()) as {
          error?: string;
          mode?: string;
          clientSecret?: string;
          publishableKey?: string;
          url?: string;
        };
        if (!res.ok) {
          onError(data.error || "generic");
          return;
        }
        if (data.mode === "stripe_checkout" && data.url) {
          setCheckoutUrl(data.url);
          window.location.href = data.url;
          return;
        }
        if (data.clientSecret && data.publishableKey) {
          setClientSecret(data.clientSecret);
          setPublishableKey(data.publishableKey);
        } else {
          onError("stripe_unavailable");
        }
      } catch {
        onError("generic");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initiate once per paymentId
  }, [paymentId]);

  if (loading || checkoutUrl) {
    return <p className="tiny muted">{tPricing("processing")}</p>;
  }

  if (!clientSecret || !publishableKey) {
    return null;
  }

  const stripePromise = loadStripe(publishableKey);

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: "stripe" },
      }}
    >
      <StripeConfirmForm paymentId={paymentId} locale={locale} onError={onError} />
    </Elements>
  );
}
