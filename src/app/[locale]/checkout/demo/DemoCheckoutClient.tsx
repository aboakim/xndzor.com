"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useSession } from "next-auth/react";

export default function DemoCheckoutClient() {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const sp = useSearchParams();
  const paymentId = sp.get("paymentId") || "";
  const { status } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = `/${locale}/auth/login?callbackUrl=/${locale}/checkout/demo?paymentId=${paymentId}`;
    }
  }, [status, locale, paymentId]);

  async function confirmDemo() {
    setBusy(true);
    setError("");
    try {
      const csrfRes = await fetch("/api/csrf");
      const csrfData = (await csrfRes.json()) as { token?: string };
      const res = await fetch("/api/checkout/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfData.token || "",
        },
        body: JSON.stringify({ paymentId }),
      });
      const data = (await res.json()) as { error?: string };
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

  return (
    <div className="section checkout-demo-page">
      <p className="eyebrow">{t("demo.eyebrow")}</p>
      <h1>{t("demo.title")}</h1>
      <p className="lede">{t("demo.lede")}</p>
      <p className="demo-pay-banner" role="status">
        {t("demo.banner")}
      </p>
      <div className="pricing-actions">
        <button
          type="button"
          className="btn primary"
          disabled={busy || !paymentId}
          onClick={confirmDemo}
        >
          {busy ? t("processing") : t("demo.confirm")}
        </button>
        <Link href="/pricing" className="btn ghost">
          {t("demo.cancel")}
        </Link>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
