"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MARZES, localizedPlaceName, type LocationVillage } from "@/lib/places";
import {
  CATALOG_PRICE_UNITS,
  CATALOG_ROUTE,
  CATALOG_SPEC_FIELDS,
  CATALOG_SUBTYPES,
  CATALOG_UNITS,
  type CatalogCategory,
} from "@/lib/catalog";
import { ImageUploadField, uploadImages } from "@/components/ImageUploadField";

export function CatalogForm({
  category,
  defaultMarzId,
  defaultPhone,
}: {
  category: CatalogCategory;
  defaultMarzId?: string | null;
  defaultPhone?: string | null;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const route = CATALOG_ROUTE[category];
  const subtypes = CATALOG_SUBTYPES[category];
  const [marzId, setMarzId] = useState(defaultMarzId || "");
  const [villageId, setVillageId] = useState("");
  const [villages, setVillages] = useState<LocationVillage[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [subtype, setSubtype] = useState(subtypes[0]);
  const [negotiable, setNegotiable] = useState(false);

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
    setUploadProgress(undefined);
    try {
      const imageUrls = await uploadImages(files, { onProgress: setUploadProgress });
      const fd = new FormData(e.currentTarget);
      const specs: Record<string, string | number | boolean | null> = {};
      for (const field of CATALOG_SPEC_FIELDS[category]) {
        const raw = fd.get(`spec_${field.key}`);
        if (field.kind === "bool") {
          specs[field.key] = String(raw) === "on" || String(raw) === "true";
        } else if (field.kind === "number") {
          const n = String(raw || "").trim();
          specs[field.key] = n ? Number(n) : null;
        } else {
          specs[field.key] = String(raw || "").trim() || null;
        }
      }
      const body = {
        category,
        subtype,
        title: String(fd.get("title") || ""),
        description: String(fd.get("description") || ""),
        brand: String(fd.get("brand") || ""),
        specs,
        quantity: fd.get("quantity") || "",
        unit: String(fd.get("unit") || ""),
        packageSize: String(fd.get("packageSize") || ""),
        priceAmd: fd.get("priceAmd") || "",
        priceNegotiable: negotiable,
        priceUnit: String(fd.get("priceUnit") || "LOT"),
        expiryDate: String(fd.get("expiryDate") || ""),
        marzId,
        villageId,
        phone: String(fd.get("phone") || ""),
        whatsapp: String(fd.get("whatsapp") || ""),
        imageUrls,
      };
      const res = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(t("postCatalog.error"));
        setSaving(false);
        return;
      }
      const created = await res.json();
      router.push(`/shop/${route}/${created.id}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : t("images.uploadError"),
      );
      setSaving(false);
    }
  }

  return (
    <form className="listing-form stack-form machinery-form" onSubmit={onSubmit}>
      <fieldset className="form-section">
        <legend>{t("postCatalog.sections.basics")}</legend>
        <label>
          <span>{t("postCatalog.fields.title")}</span>
          <input name="title" required minLength={5} maxLength={160} placeholder={t(`postCatalog.hints.${category}` as "postCatalog.hints.FERTILIZER")} />
        </label>
        <div className="form-row">
          <label>
            <span>{t("postCatalog.fields.subtype")}</span>
            <select value={subtype} onChange={(e) => setSubtype(e.target.value)} required>
              {subtypes.map((s) => (
                <option key={s} value={s}>
                  {t(`catalogSubtypes.${category}.${s}` as "catalogSubtypes.FERTILIZER.NPK")}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t("postCatalog.fields.brand")}</span>
            <input name="brand" maxLength={80} />
          </label>
        </div>
        <div className="form-row">
          <label>
            <span>{t("postCatalog.fields.quantity")}</span>
            <input name="quantity" type="number" min={0.01} step="0.01" />
          </label>
          <label>
            <span>{t("postCatalog.fields.unit")}</span>
            <select name="unit" defaultValue="kg">
              {CATALOG_UNITS.map((u) => (
                <option key={u} value={u}>
                  {t(`catalogUnits.${u}` as "catalogUnits.kg")}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <span>{t("postCatalog.fields.packageSize")}</span>
          <input name="packageSize" maxLength={80} placeholder={t("postCatalog.fields.packageHint")} />
        </label>
      </fieldset>

      <fieldset className="form-section">
        <legend>{t("postCatalog.sections.specs")}</legend>
        {CATALOG_SPEC_FIELDS[category].map((field) => (
          <label key={field.key}>
            <span>{t(`catalogSpecs.${field.key}` as "catalogSpecs.composition")}</span>
            {field.kind === "bool" ? (
              <input name={`spec_${field.key}`} type="checkbox" />
            ) : (
              <input
                name={`spec_${field.key}`}
                type={field.kind === "number" ? "number" : "text"}
                step={field.kind === "number" ? "0.01" : undefined}
              />
            )}
          </label>
        ))}
        {category === "FERTILIZER" ||
        category === "CHEMICAL" ||
        category === "SEED" ||
        category === "NATURAL_PRODUCT" ? (
          <label>
            <span>{t("postCatalog.fields.expiryDate")}</span>
            <input name="expiryDate" type="date" />
          </label>
        ) : null}
      </fieldset>

      <fieldset className="form-section">
        <legend>{t("postCatalog.sections.priceLocation")}</legend>
        <div className="form-row">
          <label>
            <span>{t("postCatalog.fields.price")}</span>
            <input name="priceAmd" type="number" min={0} />
          </label>
          <label>
            <span>{t("postCatalog.fields.priceUnit")}</span>
            <select name="priceUnit" defaultValue="LOT">
              {CATALOG_PRICE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {t(`catalogPriceUnits.${u}` as "catalogPriceUnits.LOT")}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="checkbox-label">
          <span>{t("postCatalog.fields.negotiable")}</span>
          <input type="checkbox" checked={negotiable} onChange={(e) => setNegotiable(e.target.checked)} />
        </label>
        <div className="form-row">
          <label>
            <span>{t("postCatalog.fields.marz")}</span>
            <select value={marzId} onChange={(e) => setMarzId(e.target.value)} required>
              <option value="" disabled>
                —
              </option>
              {MARZES.map((m) => (
                <option key={m} value={m}>
                  {t(`marzes.${m}` as "marzes.Yerevan")}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t("postCatalog.fields.village")}</span>
            <select
              value={villageId}
              onChange={(e) => setVillageId(e.target.value)}
              required
              disabled={!marzId || loadingVillages}
            >
              <option value="" disabled>
                {loadingVillages ? "…" : "—"}
              </option>
              {villages.map((v) => (
                <option key={v.id} value={v.id}>
                  {localizedPlaceName(v, locale)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            <span>{t("postCatalog.fields.phone")}</span>
            <input name="phone" required defaultValue={defaultPhone || ""} />
          </label>
          <label>
            <span>{t("postCatalog.fields.whatsapp")}</span>
            <input name="whatsapp" defaultValue={defaultPhone || ""} />
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>{t("postCatalog.sections.description")}</legend>
        <label>
          <span>{t("postCatalog.fields.description")}</span>
          <textarea name="description" required minLength={20} maxLength={12000} rows={10} />
        </label>
        <ImageUploadField
          files={files}
          onChange={setFiles}
          uploading={saving}
          uploadProgress={uploadProgress}
          disabled={saving}
        />
      </fieldset>

      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn primary" disabled={saving || !marzId || !villageId}>
        {saving ? t("postCatalog.saving") : t("postCatalog.submit")}
      </button>
    </form>
  );
}
