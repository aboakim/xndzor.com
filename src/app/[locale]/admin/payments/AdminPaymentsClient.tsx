"use client";

import { useTransition } from "react";
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
  const [pending, startTransition] = useTransition();

  function confirm(id: string) {
    startTransition(() => {
      void confirmBankPayment(id).catch(() => {});
    });
  }

  return (
    <>
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
                  {t("confirmBankPayment")}
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
