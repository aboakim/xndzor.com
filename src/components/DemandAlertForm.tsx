"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function DemandAlertForm({
  products,
  isPro,
  existingProductIds,
}: {
  products: { id: string; nameKey: string }[];
  isPro: boolean;
  existingProductIds: string[];
}) {
  const t = useTranslations("pricing");
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isPro) {
    return (
      <div className="demand-alert-gate">
        <p>{t("alerts.proOnly")}</p>
        <Link href="/pricing" className="btn primary">
          {t("goPro")}
        </Link>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/demand-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, active: true }),
      });
      if (!res.ok) {
        setMsg(t("errors.generic"));
        return;
      }
      setMsg(t("alerts.saved"));
    } catch {
      setMsg(t("errors.generic"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="demand-alert-form" onSubmit={onSubmit}>
      <label>
        {t("alerts.product")}
        <select value={productId} onChange={(e) => setProductId(e.target.value)}>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {/* nameKey like products.tomato — rendered by parent translation if needed */}
              {p.nameKey.replace(/^products\./, "")}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn primary" disabled={saving || !productId}>
        {saving ? t("processing") : t("alerts.subscribe")}
      </button>
      {existingProductIds.includes(productId) ? (
        <p className="tiny muted">{t("alerts.already")}</p>
      ) : null}
      {msg ? <p className="tiny">{msg}</p> : null}
    </form>
  );
}
