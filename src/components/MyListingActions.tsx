"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

type Props = {
  id: string;
  status: string;
  /** e.g. /api/supply */
  apiBase: string;
  /** Extra terminal statuses besides ACTIVE / HIDDEN (default SOLD) */
  soldStatus?: string | null;
};

/**
 * Owner controls for marketplace listings (status + hard delete).
 * Hide = PATCH status HIDDEN; Delete = DELETE (removes row).
 */
export function MyListingActions({
  id,
  status,
  apiBase,
  soldStatus = "SOLD",
}: Props) {
  const t = useTranslations("my");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(next: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(typeof data?.error === "string" ? data.error : t("actionError"));
        return;
      }
      router.refresh();
    } catch {
      setError(t("actionError"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(t("confirmDelete"))) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(typeof data?.error === "string" ? data.error : t("actionError"));
        return;
      }
      router.push("/account/listings");
      router.refresh();
    } catch {
      setError(t("actionError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="my-actions">
      {status !== "ACTIVE" && (
        <button
          type="button"
          className="btn ghost"
          disabled={busy}
          onClick={() => setStatus("ACTIVE")}
        >
          {t("markActive")}
        </button>
      )}
      {soldStatus && status !== soldStatus && (
        <button
          type="button"
          className="btn ghost"
          disabled={busy}
          onClick={() => setStatus(soldStatus)}
        >
          {soldStatus === "FILLED" ? t("markFilled") : t("markSold")}
        </button>
      )}
      {status !== "HIDDEN" && (
        <button
          type="button"
          className="btn ghost"
          disabled={busy}
          onClick={() => setStatus("HIDDEN")}
        >
          {t("hide")}
        </button>
      )}
      <button type="button" className="btn danger" disabled={busy} onClick={remove}>
        {t("delete")}
      </button>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
