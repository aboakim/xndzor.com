"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function OfferButton({
  supplyId,
  demandId,
  defaultMessage,
}: {
  supplyId: string;
  demandId: string;
  defaultMessage?: string;
}) {
  const t = useTranslations("offer");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(defaultMessage || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplyId, demandId, message }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(t("error"));
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" className="btn secondary" onClick={() => setOpen(true)}>
        {t("send")}
      </button>
    );
  }

  return (
    <form className="offer-form" onSubmit={onSubmit}>
      <label>
        <span>{t("message")}</span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="hero-ctas">
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? t("sending") : t("confirm")}
        </button>
        <button type="button" className="btn secondary" onClick={() => setOpen(false)}>
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
