"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  futureHarvestId?: string;
  plotId?: string;
  className?: string;
};

export function CreateBatchButton({ futureHarvestId, plotId, className }: Props) {
  const t = useTranslations("productPassport");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ futureHarvestId, plotId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t("createError"));
        return;
      }
      router.push(`/batches/${data.batchCode}`);
      router.refresh();
    } catch {
      setError(t("createError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        className="btn primary"
        disabled={busy}
        onClick={onCreate}
      >
        {busy ? t("creating") : t("create")}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
