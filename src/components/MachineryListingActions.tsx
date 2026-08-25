"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

export function MachineryListingActions({ id, status }: { id: string; status: string }) {
  const t = useTranslations("myMachinery");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(next: string) {
    setBusy(true);
    await fetch(`/api/machinery/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(t("confirmDelete"))) return;
    setBusy(true);
    await fetch(`/api/machinery/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
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
    </div>
  );
}
