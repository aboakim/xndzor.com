"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { MARZES } from "@/lib/locations";
import { UNITS } from "@/lib/validations";
import { ProductIcon } from "@/components/AgIcons";
import { ProductSelect } from "@/components/ProductSelect";
import { LiveCropSignal } from "@/components/LiveCropSignal";
import { ImageUploadField, uploadImagesDetailed } from "@/components/ImageUploadField";
import { getFeaturedProducts, type CatalogProduct } from "@/lib/products";
import { listingErrorI18nKey } from "@/lib/listing-create";

type Product = CatalogProduct;
type Phase = "idle" | "uploading" | "publishing";

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
  const submittingRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | undefined>();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const featured = getFeaturedProducts(products);
  const [productId, setProductId] = useState(
    () => featured.find((p) => p.slug !== "other")?.id || products[0]?.id || "",
  );
  const saving = phase !== "idle";

  useEffect(() => {
    if (productId || products.length === 0) return;
    const next =
      getFeaturedProducts(products).find((p) => p.slug !== "other")?.id || products[0]?.id || "";
    if (next) setProductId(next);
  }, [productId, products]);

  function resolveError(dataError: unknown, fallbackKey: string) {
    try {
      return t(listingErrorI18nKey(dataError) as "listingErrors.publishFailed");
    } catch {
      return t(fallbackKey as "images.uploadError");
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current || saving) return;
    if (!productId) {
      setError(t("listingErrors.invalidProduct"));
      return;
    }

    submittingRef.current = true;
    setError("");
    setUploadProgress(undefined);

    try {
      // Read before any await — React nullifies event.currentTarget after the handler yields.
      const fd = new FormData(e.currentTarget);

      let imageUrls = uploadedUrls;
      if (files.length > 0) {
        setPhase("uploading");
        const result = await uploadImagesDetailed(files, { onProgress: setUploadProgress });
        imageUrls = [...uploadedUrls, ...result.urls];
        setUploadedUrls(imageUrls);
        // Only block when nothing uploaded at all — partial success still publishes.
        if (imageUrls.length === 0) {
          setFiles(result.failedFiles);
          setError(
            result.failedFiles.length > 0
              ? t("images.partialFail", {
                  failed: result.failedFiles.length,
                  ok: 0,
                })
              : t("images.uploadError"),
          );
          setPhase("idle");
          submittingRef.current = false;
          return;
        }
        setFiles([]);
      }

      setPhase("publishing");
      const res = await fetch("/api/forward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(fd.entries()), productId, imageUrls }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(resolveError(data.error, "images.uploadError"));
        setPhase("idle");
        submittingRef.current = false;
        return;
      }
      const crop = await res.json();
      router.push(`/forward/${crop.id}`);
      router.refresh();
    } catch (err) {
      setError(
        resolveError(
          err instanceof Error ? err.message : undefined,
          "images.uploadError",
        ),
      );
      setPhase("idle");
      submittingRef.current = false;
    }
  }

  function submitLabel() {
    if (phase === "uploading") {
      return uploadProgress != null
        ? t("images.uploadingProgress", { pct: uploadProgress })
        : t("images.uploading");
    }
    if (phase === "publishing") return t("forwardForm.saving");
    return t("forwardForm.submit");
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
          disabled={products.length === 0 || saving}
        />
        <span className="product-icon-row" aria-hidden>
          {featured.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`product-icon-btn ${productId === p.id ? "on" : ""}`}
              onClick={() => setProductId(p.id)}
              title={t(p.nameKey as "products.tomato")}
              disabled={saving}
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
        <input name="title" required minLength={5} disabled={saving} />
      </label>
      <label>
        <span>{t("forwardForm.description")}</span>
        <textarea name="description" required minLength={10} rows={4} disabled={saving} />
      </label>
      <div className="form-row">
        <label>
          <span>{t("forwardForm.qty")}</span>
          <input name="qtyExpected" type="number" min={1} required disabled={saving} />
        </label>
        <label>
          <span>{t("forwardForm.unit")}</span>
          <select name="unit" defaultValue="ton" disabled={saving}>
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
          <input name="harvestDate" type="date" required disabled={saving} />
        </label>
        <label>
          <span>{t("forwardForm.price")}</span>
          <input name="priceAmd" type="number" min={0} disabled={saving} />
        </label>
      </div>
      <label>
        <span>{t("jobsForm.marz")}</span>
        <select name="marzId" required defaultValue={defaultMarzId || ""} disabled={saving}>
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
          <input name="phone" required defaultValue={defaultPhone || ""} disabled={saving} />
        </label>
        <label>
          <span>WhatsApp</span>
          <input name="whatsapp" defaultValue={defaultPhone || ""} disabled={saving} />
        </label>
      </div>
      <ImageUploadField
        files={files}
        onChange={setFiles}
        existingUrls={uploadedUrls}
        onExistingChange={setUploadedUrls}
        uploading={phase === "uploading"}
        uploadProgress={uploadProgress}
        disabled={saving}
      />
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="btn primary"
        disabled={saving || !productId}
        aria-busy={saving}
      >
        {submitLabel()}
      </button>
    </form>
  );
}
