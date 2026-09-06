"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type PlotOpt = { id: string; name: string };

const CATS = ["diesel", "labor", "seed", "water", "other"] as const;

export function ExpenseForm({ plots }: { plots: PlotOpt[] }) {
  const t = useTranslations("farmOs.costs");
  const router = useRouter();
  const [amountAmd, setAmount] = useState("");
  const [category, setCategory] = useState<(typeof CATS)[number]>("diesel");
  const [note, setNote] = useState("");
  const [plotId, setPlotId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountAmd: Math.round(Number(amountAmd)),
          category,
          note: note || null,
          plotId: plotId || null,
          date,
        }),
      });
      if (!res.ok) {
        setErr(t("error"));
        return;
      }
      setAmount("");
      setNote("");
      router.refresh();
    } catch {
      setErr(t("error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="fos-expense-form stack-form" onSubmit={onSubmit}>
      <h2>{t("addTitle")}</h2>
      <label>
        <span>{t("amount")}</span>
        <input
          type="number"
          required
          min={1}
          value={amountAmd}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <label>
        <span>{t("category")}</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as (typeof CATS)[number])}
        >
          {CATS.map((c) => (
            <option key={c} value={c}>
              {t(`categories.${c}`)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t("plot")}</span>
        <select value={plotId} onChange={(e) => setPlotId(e.target.value)}>
          <option value="">{t("plotNone")}</option>
          {plots.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t("date")}</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label>
        <span>{t("note")}</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      </label>
      {err ? <p className="form-error">{err}</p> : null}
      <button type="submit" className="btn primary" disabled={busy}>
        {busy ? t("saving") : t("save")}
      </button>
    </form>
  );
}
