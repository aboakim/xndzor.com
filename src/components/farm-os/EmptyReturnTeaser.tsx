"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function EmptyReturnTeaser() {
  const t = useTranslations("farmOs.return");
  const [open, setOpen] = useState(false);
  const [fromNote, setFrom] = useState("");
  const [toNote, setTo] = useState("");
  const [capacityNote, setCap] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/return-capacity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromNote, toNote, capacityNote }),
      });
      if (!res.ok) {
        setMsg(t("error"));
        return;
      }
      setMsg(t("saved"));
      setFrom("");
      setTo("");
      setCap("");
      setOpen(false);
    } catch {
      setMsg(t("error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="fos-return-teaser">
      <h2>{t("title")}</h2>
      <p className="lede tight">{t("lede")}</p>
      <div className="fos-quick-links">
        <Link href="/features/route" className="btn ghost">
          {t("routeLink")}
        </Link>
        <button type="button" className="btn primary" onClick={() => setOpen((v) => !v)}>
          {t("offerCta")}
        </button>
      </div>
      {open ? (
        <form className="stack-form" onSubmit={submit} style={{ marginTop: "1rem" }}>
          <label>
            <span>{t("from")}</span>
            <input required value={fromNote} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            <span>{t("to")}</span>
            <input required value={toNote} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label>
            <span>{t("capacity")}</span>
            <input value={capacityNote} onChange={(e) => setCap(e.target.value)} />
          </label>
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? t("saving") : t("save")}
          </button>
        </form>
      ) : null}
      {msg ? <p className="muted">{msg}</p> : null}
    </section>
  );
}
