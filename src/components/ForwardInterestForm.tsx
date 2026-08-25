"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function ForwardInterestForm({ futureHarvestId }: { futureHarvestId: string }) {
  const t = useTranslations("forwardInterest");
  const router = useRouter();
  const [qty, setQty] = useState("1");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/forward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ futureHarvestId, qtyWanted: qty, message }),
    });
    setSaving(false);
    if (res.status === 401) {
      router.push("/auth/login");
      return;
    }
    if (!res.ok) return;
    setDone(true);
    router.refresh();
  }

  if (done) return <p className="muted">{t("sent")}</p>;

  return (
    <form className="offer-form" onSubmit={onSubmit}>
      <label>
        <span>{t("qty")}</span>
        <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} required />
      </label>
      <label>
        <span>{t("message")}</span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} />
      </label>
      <button type="submit" className="btn primary" disabled={saving}>
        {saving ? t("sending") : t("reserve")}
      </button>
    </form>
  );
}
