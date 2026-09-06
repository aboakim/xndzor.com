"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type PlotOpt = { id: string; name: string };

const CATS = ["diesel", "labor", "seed", "water", "other"] as const;

export function ExpenseForm({ plots }: { plots: PlotOpt[] }) {
  const t = useTranslations("farm.costs");
  const [category, setCategory] = useState<string>("diesel");
  const [amountAmd, setAmountAmd] = useState("");
  const [note, setNote] = useState("");
  const [plotId, setPlotId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/farm/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        amountAmd: Number(amountAmd),
        note,
        plotId: plotId || null,
      }),
    });
    if (!res.ok) {
      setError(t("saveError"));
      return;
    }
    window.location.reload();
  }

  return (
    <form className="farm-form farm-form-compact" onSubmit={save}>
      <label>
        {t("category")}
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATS.map((c) => (
            <option key={c} value={c}>
              {t(`cats.${c}`)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("amount")}
        <input
          type="number"
          min={1}
          required
          value={amountAmd}
          onChange={(e) => setAmountAmd(e.target.value)}
        />
      </label>
      <label>
        {t("note")}
        <input value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      {plots.length > 0 ? (
        <label>
          {t("plot")}
          <select value={plotId} onChange={(e) => setPlotId(e.target.value)}>
            <option value="">{t("anyPlot")}</option>
            {plots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <button type="submit" className="btn primary">
        {t("add")}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}
