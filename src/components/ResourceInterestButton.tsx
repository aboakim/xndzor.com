"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function ResourceInterestButton({ resourceId }: { resourceId: string }) {
  const t = useTranslations("resourceInterest");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/resources/interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId, message }),
    });
    setSaving(false);
    if (res.status === 401) {
      router.push("/auth/login");
      return;
    }
    if (!res.ok) {
      setError(t("error"));
      return;
    }
    setDone(true);
    setOpen(false);
    router.refresh();
  }

  if (done) {
    return <p className="muted">{t("sent")}</p>;
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
      <p className="muted">
        <Link href="/auth/login">{t("needAuth")}</Link>
      </p>
    </form>
  );
}
