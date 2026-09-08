"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { MARZES } from "@/lib/locations";
import { UNITS } from "@/lib/validations";
import { ProductIcon } from "@/components/AgIcons";
import { ProductSelect } from "@/components/ProductSelect";
import { LiveCropSignal } from "@/components/LiveCropSignal";
import { ImageUploadField, uploadImages } from "@/components/ImageUploadField";
import { getFeaturedProducts, type CatalogProduct } from "@/lib/products";

type Product = CatalogProduct;

export function ForwardCropForm({
  products,
  defaultMarzId,
  defaultPhone,
}: {
  products: Product[];
  defaultMarzId?: string | null;
  defaultPhone?: string | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | undefined>();
  const [files, setFiles] = useState<File[]>([]);
  const featured = getFeaturedProducts(products);
  const [productId, setProductId] = useState(
    () => featured.find((p) => p.slug !== "other")?.id || products[0]?.id || "",
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setUploadProgress(undefined);
    try {
      // Read before any await — React nullifies event.currentTarget after the handler yields.
      const fd = new FormData(e.currentTarget);
      const imageUrls = await uploadImages(files, { onProgress: setUploadProgress });
      const res = await fetch("/api/forward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(fd.entries()), productId, imageUrls }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          typeof data.error === "string" && data.error
            ? data.error
            : t("images.uploadError"),
        );
        setSaving(false);
        return;
      }
      const crop = await res.json();
      router.push(`/forward/${crop.id}`);
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
    <form className="stack-form listing-form" onSubmit={onSubmit}>
      <label>
        <span>{t("forwardForm.product")}</span>
        <ProductSelect
          products={products}
          value={productId}
          onChange={setProductId}
          valueKey="id"
          name="productId"
          required
          disabled={products.length === 0}
        />
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
      {productId ? <LiveCropSignal productId={productId} /> : null}
      <label>
        <span>{t("forwardForm.title")}</span>
        <input name="title" required minLength={5} />
      </label>
      <label>
        <span>{t("forwardForm.description")}</span>
        <textarea name="description" required minLength={10} rows={4} />
      </label>
      <div className="form-row">
        <label>
          <span>{t("forwardForm.qty")}</span>
          <input name="qtyExpected" type="number" min={1} required />
        </label>
        <label>
          <span>{t("forwardForm.unit")}</span>
          <select name="unit" defaultValue="ton">
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
          <span>{t("forwardForm.harvestDate")}</span>
          <input name="harvestDate" type="date" required />
        </label>
        <label>
          <span>{t("forwardForm.price")}</span>
          <input name="priceAmd" type="number" min={0} />
        </label>
      </div>
      <label>
        <span>{t("jobsForm.marz")}</span>
        <select name="marzId" required defaultValue={defaultMarzId || ""}>
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
      <div className="form-row">
        <label>
          <span>{t("jobsForm.phone")}</span>
          <input name="phone" required defaultValue={defaultPhone || ""} />
        </label>
        <label>
          <span>WhatsApp</span>
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
      <button type="submit" className="btn primary" disabled={saving || !productId}>
        {saving ? t("forwardForm.saving") : t("forwardForm.submit")}
      </button>
    </form>
  );
}
