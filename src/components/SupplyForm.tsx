"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MARZES, localizedPlaceName, type LocationVillage } from "@/lib/places";
import { UNITS } from "@/lib/validations";
import { ImageUploadField, uploadImages } from "@/components/ImageUploadField";
import { ProductIcon } from "@/components/AgIcons";
import { ProductOptgroupOptions } from "@/components/ProductOptgroupOptions";
import { getFeaturedProducts, type CatalogProduct } from "@/lib/products";

type Product = CatalogProduct;

export function SupplyForm({
  products,
  defaultMarzId,
  defaultPhone,
}: {
  products: Product[];
  defaultMarzId?: string | null;
  defaultPhone?: string | null;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [marzId, setMarzId] = useState(defaultMarzId || "");
  const [villageId, setVillageId] = useState("");
  const [villages, setVillages] = useState<LocationVillage[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const featured = getFeaturedProducts(products);
  const [productId, setProductId] = useState(
    () => featured.find((p) => p.slug !== "other")?.id || products[0]?.id || "",
  );
  const selectedProduct = products.find((p) => p.id === productId);

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
      // Read before any await — React nullifies event.currentTarget after the handler yields.
      const fd = new FormData(e.currentTarget);
      const imageUrls = await uploadImages(files, { onProgress: setUploadProgress });
      const body = {
        title: String(fd.get("title") || ""),
        description: String(fd.get("description") || ""),
        productId,
        qtyAvailable: fd.get("qtyAvailable"),
        unit: String(fd.get("unit") || "kg"),
        priceAmd: fd.get("priceAmd") || "",
        readyInDays: fd.get("readyInDays") || 0,
        marzId,
        villageId,
        phone: String(fd.get("phone") || ""),
        whatsapp: String(fd.get("whatsapp") || ""),
        imageUrls,
      };
      const res = await fetch("/api/supply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(t("postSupply.error"));
        setSaving(false);
        return;
      }
      const created = await res.json();
      router.push(`/supply/${created.id}`);
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
    <form className="listing-form stack-form" onSubmit={onSubmit}>
      <label>
        <span>{t("postSupply.fields.title")}</span>
        <input name="title" required minLength={5} maxLength={120} />
      </label>
      <label>
        <span>{t("postSupply.fields.description")}</span>
        <textarea
          name="description"
          required
          minLength={20}
          maxLength={8000}
          rows={10}
          placeholder={t("postSupply.fields.descriptionHint")}
        />
      </label>
      <div className="form-row">
        <label>
          <span>{t("postSupply.fields.product")}</span>
          <span className="select-with-icon">
            {selectedProduct ? <ProductIcon slugOrKey={selectedProduct.slug} size={18} /> : null}
            <select
              name="productId"
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
                <ProductOptgroupOptions products={products} valueKey="id" />
              )}
            </select>
          </span>
          <span className="product-icon-row" aria-hidden>
            {featured.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`product-icon-btn ${productId === p.id ? "on" : ""}`}
                onClick={() => setProductId(p.id)}
                title={t(p.nameKey as "products.tomato")}
              >
                <ProductIcon slugOrKey={p.slug} size={16} />
              </button>
            ))}
          </span>
          {products.length === 0 ? (
            <p className="form-error" role="status">
              {t("forms.selectEmptyHint")}
            </p>
          ) : null}
        </label>
        <label>
          <span>{t("postSupply.fields.unit")}</span>
          <select name="unit" defaultValue="kg">
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {t(`units.${u}` as "units.kg")}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-row">
        <label>
          <span>{t("postSupply.fields.qty")}</span>
          <input name="qtyAvailable" type="number" min={1} required />
        </label>
        <label>
          <span>{t("postSupply.fields.price")}</span>
          <input name="priceAmd" type="number" min={0} />
        </label>
      </div>
      <label>
        <span>{t("postSupply.fields.readyInDays")}</span>
        <input name="readyInDays" type="number" min={0} max={365} defaultValue={0} />
      </label>
      <div className="form-row">
        <label>
          <span>{t("postSupply.fields.marz")}</span>
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
          <span>{t("postSupply.fields.village")}</span>
          <select
            value={villageId}
            onChange={(e) => setVillageId(e.target.value)}
            required
            disabled={!marzId || loadingVillages}
          >
            <option value="" disabled>
              {loadingVillages
                ? t("common.loading")
                : villages.length === 0 && marzId
                  ? t("forms.selectEmpty")
                  : "—"}
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
          <span>{t("postSupply.fields.phone")}</span>
          <input name="phone" required defaultValue={defaultPhone || ""} />
        </label>
        <label>
          <span>{t("postSupply.fields.whatsapp")}</span>
          <input name="whatsapp" defaultValue={defaultPhone || ""} />
        </label>
      </div>
      <ImageUploadField
        files={files}
        onChange={setFiles}
        uploading={saving}
        uploadProgress={uploadProgress}
        disabled={saving}
      />
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn primary" disabled={saving || !marzId || !villageId || !productId}>
        {saving ? t("postSupply.saving") : t("postSupply.submit")}
      </button>
    </form>
  );
}
