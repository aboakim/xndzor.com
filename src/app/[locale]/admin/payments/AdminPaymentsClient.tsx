"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { confirmBankPayment } from "@/app/actions/admin";
import { formatAmd } from "@/lib/utils";
import { maskEmail } from "@/lib/payments";
import {
  AdminEmpty,
  AdminField,
  AdminRecord,
  AdminRecordList,
} from "@/components/AdminRecord";

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

  function paymentCard(p: AdminPaymentRow, withConfirm: boolean) {
    const q = p.userEmail || p.userName;
    return (
      <AdminRecord
        key={p.id}
        title={
          <Link href={`/admin/users?q=${encodeURIComponent(q)}`} className="linkish">
            {p.userName}
          </Link>
        }
        subtitle={maskEmail(p.userEmail)}
        actions={
          withConfirm ? (
            <button
              type="button"
              className="btn primary"
              disabled={pending}
              onClick={() => confirm(p.id)}
            >
              {confirmingId === p.id ? t("confirming") : t("confirmBankPayment")}
            </button>
          ) : null
        }
      >
        <AdminField label={t("col.code")}>{p.productCode}</AdminField>
        <AdminField label={t("col.price")}>
          {formatAmd(p.amountAmd, locale)} ֏
        </AdminField>
        <AdminField label={t("col.status")}>
          {p.status} · {p.provider}
          {p.userMarkedPaid ? ` · ${t("userMarkedPaid")}` : ""}
        </AdminField>
        <AdminField label={t("col.created")}>
          <time dateTime={p.createdAt}>{new Date(p.createdAt).toLocaleString(locale)}</time>
          {p.providerRef ? <span className="tiny muted block">{p.providerRef}</span> : null}
        </AdminField>
      </AdminRecord>
    );
  }

  return (
    <>
      {error ? <p className="form-error">{error}</p> : null}
      {pendingBank.length > 0 ? (
        <section className="admin-activity">
          <h3>{t("pendingBankTransfers")}</h3>
          <p className="lede tiny">{t("pendingBankTransfersLede")}</p>
          <AdminRecordList>
            {pendingBank.map((p) => paymentCard(p, true))}
          </AdminRecordList>
        </section>
      ) : null}

      <section className="admin-activity">
        <h3>{t("recentPayments")}</h3>
        {payments.length === 0 ? (
          <AdminEmpty>{t("noResults")}</AdminEmpty>
        ) : (
          <AdminRecordList>{payments.map((p) => paymentCard(p, false))}</AdminRecordList>
        )}
      </section>
    </>
  );
}
