"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MARZES, localizedPlaceName, type LocationVillage } from "@/lib/places";
import { estimateYieldTons } from "@/lib/yield";
import { ProductIcon } from "@/components/AgIcons";
import { LiveDemandSnapshot } from "@/components/LiveDemandSnapshot";

type Product = { id: string; slug: string; nameKey: string };

export function PlotForm({
  products,
  defaultMarzId,
}: {
  products: Product[];
  defaultMarzId?: string | null;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [marzId, setMarzId] = useState(defaultMarzId || "");
  const [villageId, setVillageId] = useState("");
  const [villages, setVillages] = useState<LocationVillage[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [hectares, setHectares] = useState("2");
  const [override, setOverride] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selected = products.find((p) => p.id === productId);
  const preview = useMemo(() => {
    if (!selected) return null;
    const ha = Number(hectares) || 0;
    return estimateYieldTons(selected.slug, ha, locale);
  }, [selected, hectares, locale]);

  useEffect(() => {
    if (!marzId) {
      setVillages([]);
      setVillageId("");
      return;
    }
    let cancelled = false;
    setLoadingVillages(true);
    fetch(`/api/villages?marzId=${encodeURIComponent(marzId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setVillages(Array.isArray(data) ? data : []);
        setVillageId("");
      })
      .finally(() => {
        if (!cancelled) setLoadingVillages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [marzId]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = {
      name: String(fd.get("name") || ""),
      hectares,
      cropProductId: productId,
      plantDate: String(fd.get("plantDate") || ""),
      irrigationNotes: String(fd.get("irrigationNotes") || ""),
      lastFertilizer: String(fd.get("lastFertilizer") || ""),
      lastIrrigationAt: String(fd.get("lastIrrigationAt") || ""),
      harvestFrom: String(fd.get("harvestFrom") || ""),
      harvestTo: String(fd.get("harvestTo") || ""),
      marzId,
      villageId,
      farmerOverrideTons: override || "",
    };
    const res = await fetch("/api/plots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.status === 401) {
      router.push("/auth/login");
      return;
    }
    if (!res.ok) {
      setError(t("plots.error"));
      return;
    }
    const plot = await res.json();
    router.push(`/plots/${plot.id}`);
    router.refresh();
  }

  return (
    <form className="stack-form listing-form" onSubmit={onSubmit}>
      <label>
        <span>{t("plots.fields.name")}</span>
        <input name="name" required minLength={2} placeholder={t("plots.fields.nameHint")} />
      </label>
      <label>
        <span>{t("plots.fields.crop")}</span>
        <span className="select-with-icon">
          {selected ? <ProductIcon slugOrKey={selected.slug} size={18} /> : null}
          <select
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            disabled={products.length === 0}
          >
            {products.length === 0 ? (
              <option value="" disabled>
                {t("forms.selectEmpty")}
              </option>
            ) : (
              products.map((p) => (
                <option key={p.id} value={p.id}>
                  {t(p.nameKey as "products.tomato")}
                </option>
              ))
            )}
          </select>
        </span>
        {products.length === 0 ? (
          <p className="form-error" role="status">
            {t("forms.selectEmptyHint")}
          </p>
        ) : null}
      </label>
      <label>
        <span>{t("plots.fields.hectares")}</span>
        <input
          type="number"
          step="0.1"
          min={0.1}
          required
          value={hectares}
          onChange={(e) => setHectares(e.target.value)}
        />
      </label>
      {preview ? (
        <div className="yield-preview">
          <strong>{t("plots.yieldPreview")}</strong>
          <p>
            {preview.tonsMin}–{preview.tonsMax} {t("units.ton")}
          </p>
          <p className="muted small">{preview.assumptionNote}</p>
        </div>
      ) : null}
      <label>
        <span>{t("plots.fields.override")}</span>
        <input
          type="number"
          step="0.1"
          min={0.1}
          value={override}
          onChange={(e) => setOverride(e.target.value)}
          placeholder={t("common.optional")}
        />
      </label>
      {productId ? <LiveDemandSnapshot productId={productId} marzId={marzId || undefined} /> : null}
      <label>
        <span>{t("plots.fields.plantDate")}</span>
        <input name="plantDate" type="date" required />
      </label>
      <div className="form-row-2">
        <label>
          <span>{t("plots.fields.harvestFrom")}</span>
          <input name="harvestFrom" type="date" />
        </label>
        <label>
          <span>{t("plots.fields.harvestTo")}</span>
          <input name="harvestTo" type="date" />
        </label>
      </div>
      <label>
        <span>{t("plots.fields.lastIrrigation")}</span>
        <input name="lastIrrigationAt" type="date" />
      </label>
      <label>
        <span>{t("plots.fields.irrigationNotes")}</span>
        <textarea name="irrigationNotes" rows={2} />
      </label>
      <label>
        <span>{t("plots.fields.lastFertilizer")}</span>
        <input name="lastFertilizer" />
      </label>
      <label>
        <span>{t("board.marz")}</span>
        <select required value={marzId} onChange={(e) => setMarzId(e.target.value)}>
          <option value="">{t("board.allMarzes")}</option>
          {MARZES.map((m) => (
            <option key={m} value={m}>
              {t(`marzes.${m}` as "marzes.Yerevan")}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t("board.village")}</span>
        <select
          value={villageId}
          onChange={(e) => setVillageId(e.target.value)}
          disabled={!marzId || loadingVillages}
        >
          <option value="">{t("board.allVillages")}</option>
          {villages.map((v) => (
            <option key={v.id} value={v.id}>
              {localizedPlaceName(v, locale)}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn primary" disabled={saving || !productId}>
        {saving ? t("plots.saving") : t("plots.submit")}
      </button>
    </form>
  );
}
