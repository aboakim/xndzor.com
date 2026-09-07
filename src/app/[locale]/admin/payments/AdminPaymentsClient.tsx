"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { confirmBankPayment } from "@/app/actions/admin";
import { formatAmd } from "@/lib/utils";
import { maskEmail } from "@/lib/payments";

export type AdminPaymentRow = {
  id: string;
  amountAmd: number;
  status: string;
  provider: string;
  productCode: string;
  providerRef: string | null;
  userMarkedPaid: boolean;
  createdAt: string;
  userName: string;
  userEmail: string | null;
};

export function AdminPaymentsClient({
  pendingBank,
  payments,
  locale,
}: {
  pendingBank: AdminPaymentRow[];
  payments: AdminPaymentRow[];
  locale: string;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  function confirm(id: string) {
    setError("");
    setConfirmingId(id);
    startTransition(() => {
      void confirmBankPayment(id)
        .then(() => {
          setConfirmingId(null);
          router.refresh();
        })
        .catch(() => {
          setConfirmingId(null);
          setError(t("confirmBankFailed"));
        });
    });
  }

  return (
    <>
      {error ? <p className="form-error">{error}</p> : null}
      {pendingBank.length > 0 ? (
        <>
          <h3>{t("pendingBankTransfers")}</h3>
          <p className="lede tiny">{t("pendingBankTransfersLede")}</p>
          <ul className="billing-list">
            {pendingBank.map((p) => (
              <li key={p.id} className="admin-payment-pending">
                <span>
                  {p.userName} · {maskEmail(p.userEmail)}
                </span>
                <span>
                  {p.productCode} · {formatAmd(p.amountAmd, locale)} ֏ ·{" "}
                  {p.providerRef || p.id}
                  {p.userMarkedPaid ? ` · ${t("userMarkedPaid")}` : ""}
                </span>
                <time dateTime={p.createdAt}>
                  {new Date(p.createdAt).toLocaleString(locale)}
                </time>
                <button
                  type="button"
                  className="btn primary tiny"
                  disabled={pending}
                  onClick={() => confirm(p.id)}
                >
                  {confirmingId === p.id ? t("confirming") : t("confirmBankPayment")}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h3>{t("recentPayments")}</h3>
      <ul className="billing-list">
        {payments.map((p) => (
          <li key={p.id}>
            <span>
              {p.userName} · {maskEmail(p.userEmail)}
            </span>
            <span>
              {p.productCode} · {formatAmd(p.amountAmd, locale)} ֏ · {p.status} ·{" "}
              {p.provider}
              {p.providerRef ? ` · ${p.providerRef}` : ""}
            </span>
            <time dateTime={p.createdAt}>
              {new Date(p.createdAt).toLocaleString(locale)}
            </time>
          </li>
        ))}
      </ul>
    </>
  );
}
