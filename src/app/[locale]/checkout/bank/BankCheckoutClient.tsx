"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { formatAmd } from "@/lib/utils";

type BankInfo = {
  id: string;
  amountAmd: number;
  productCode: string;
  status: string;
  transferRef: string;
  userMarkedPaid: boolean;
  bank: {
    bankName: string;
    account: string;
    holder: string;
    note: string;
    inn: string | null;
    bic: string | null;
  };
};

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch("/api/csrf");
  const data = (await res.json()) as { token?: string };
  return data.token || "";
}

export default function BankCheckoutClient() {
  const t = useTranslations("payments.bankTransfer");
  const tPricing = useTranslations("pricing");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId") || "";

  const [info, setInfo] = useState<BankInfo | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId) {
      setError("not_found");
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/payments/bank/info?paymentId=${encodeURIComponent(paymentId)}`);
        const data = (await res.json()) as BankInfo & { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "generic");
          setLoading(false);
          return;
        }
        setInfo(data);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("generic");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }

  async function markPaid() {
    if (!info) return;
    setMarking(true);
    setError("");
    try {
      const csrf = await fetchCsrfToken();
      const res = await fetch("/api/payments/bank/mark-paid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify({ paymentId: info.id }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setError(data.error || "generic");
        return;
      }
      setInfo({ ...info, userMarkedPaid: true });
    } catch {
      setError("generic");
    } finally {
      setMarking(false);
    }
  }

  if (loading) {
    return (
      <div className="section bank-checkout-page">
        <p className="tiny muted">{tPricing("processing")}</p>
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="section bank-checkout-page">
        <p className="form-error">
          {t(`errors.${error}` as "errors.generic")}
        </p>
        <Link href="/pricing" className="btn ghost">
          {t("backToPricing")}
        </Link>
      </div>
    );
  }

  if (!info) return null;

  if (info.status === "SUCCEEDED") {
    return (
      <div className="section bank-checkout-page">
        <p className="lede">{t("alreadyActive")}</p>
        <Link
          href={`/checkout/success?paymentId=${info.id}`}
          className="btn primary"
        >
          {t("viewSuccess")}
        </Link>
      </div>
    );
  }

  const rows: { key: string; label: string; value: string }[] = [
    ...(info.bank.bankName
      ? [{ key: "bankName", label: t("bankName"), value: info.bank.bankName }]
      : []),
    { key: "holder", label: t("holder"), value: info.bank.holder },
    { key: "account", label: t("account"), value: info.bank.account },
    ...(info.bank.inn
      ? [{ key: "inn", label: t("inn"), value: info.bank.inn }]
      : []),
    ...(info.bank.bic
      ? [{ key: "bic", label: t("bic"), value: info.bank.bic }]
      : []),
    {
      key: "amount",
      label: t("amount"),
      value: `${formatAmd(info.amountAmd, locale)} ֏`,
    },
    { key: "ref", label: t("transferRef"), value: info.transferRef },
  ];

  return (
    <div className="section bank-checkout-page">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1>{t("title")}</h1>
      <p className="lede">{t("lede")}</p>

      <ol className="bank-transfer-steps">
        <li>{t("step1")}</li>
        <li>{t("step2", { ref: info.transferRef })}</li>
        <li>{t("step3")}</li>
      </ol>

      <dl className="bank-transfer-details">
        {rows.map((row) => (
          <div key={row.key} className="bank-transfer-row">
            <dt>{row.label}</dt>
            <dd>
              <span>{row.value}</span>
              <button
                type="button"
                className="btn ghost tiny"
                onClick={() =>
                  copyText(
                    row.key,
                    row.key === "amount" ? String(info.amountAmd) : row.value,
                  )
                }
              >
                {copied === row.key ? t("copied") : t("copy")}
              </button>
            </dd>
          </div>
        ))}
      </dl>

      {info.bank.note ? <p className="tiny muted">{info.bank.note}</p> : null}

      <p className="bank-transfer-product tiny muted">
        {t("product")}: {info.productCode}
      </p>

      {info.userMarkedPaid ? (
        <div className="bank-transfer-pending" role="status">
          <p className="bank-transfer-pending-title">{t("markedPaidTitle")}</p>
          <p className="tiny">{t("markedPaidNote")}</p>
          <Link
            href={`/checkout/success?paymentId=${info.id}`}
            className="btn ghost"
          >
            {t("checkStatus")}
          </Link>
        </div>
      ) : (
        <div className="bank-transfer-actions">
          <button
            type="button"
            className="btn primary"
            disabled={marking}
            onClick={() => void markPaid()}
          >
            {marking ? tPricing("processing") : t("iHavePaid")}
          </button>
          <Link href="/pricing" className="btn ghost">
            {t("backToPricing")}
          </Link>
        </div>
      )}

      {error ? (
        <p className="form-error tiny">
          {t(`errors.${error}` as "errors.generic")}
        </p>
      ) : null}
    </div>
  );
}
