"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

export function CatalogListingActions({ id, status }: { id: string; status: string }) {
  const t = useTranslations("myCatalog");
  const tMy = useTranslations("my");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(next: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/catalog/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(typeof data?.error === "string" ? data.error : tMy("actionError"));
        return;
      }
      router.refresh();
    } catch {
      setError(tMy("actionError"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(t("confirmDelete"))) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/catalog/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(typeof data?.error === "string" ? data.error : tMy("actionError"));
        return;
      }
      router.push("/account/listings");
      router.refresh();
    } catch {
      setError(tMy("actionError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="my-actions">
      {status !== "ACTIVE" && (
        <button type="button" className="btn ghost" disabled={busy} onClick={() => setStatus("ACTIVE")}>
          {t("markActive")}
        </button>
      )}
      {status !== "SOLD" && (
        <button type="button" className="btn ghost" disabled={busy} onClick={() => setStatus("SOLD")}>
          {t("markSold")}
        </button>
      )}
      {status !== "HIDDEN" && (
        <button type="button" className="btn ghost" disabled={busy} onClick={() => setStatus("HIDDEN")}>
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
