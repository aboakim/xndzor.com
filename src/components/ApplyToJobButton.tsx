"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function ApplyToJobButton({
  jobRequestId,
  providerId,
}: {
  jobRequestId: string;
  providerId: string;
}) {
  const t = useTranslations("jobApply");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/jobs/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobRequestId,
        providerId,
        message,
        proposedPriceAmd: price || "",
      }),
    });
    setSaving(false);
    if (!res.ok) return;
    setDone(true);
    setOpen(false);
    router.refresh();
  }

  if (done) return <p className="muted">{t("sent")}</p>;
  if (!open) {
    return (
      <button type="button" className="btn primary" onClick={() => setOpen(true)}>
        {t("take")}
      </button>
    );
  }

  return (
    <form className="offer-form" onSubmit={onSubmit}>
      <label>
        <span>{t("message")}</span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} />
      </label>
      <label>
        <span>{t("price")}</span>
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
      </label>
      <button type="submit" className="btn primary" disabled={saving}>
        {saving ? t("sending") : t("confirm")}
      </button>
    </form>
  );
}
