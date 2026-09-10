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
import {
  formatUploadBatchError,
  resolveListingError,
  type ListingField,
} from "@/lib/listing-create";

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
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const publishWithOkOnlyRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<Partial<Record<ListingField, string>>>({});
  const [uploadProgress, setUploadProgress] = useState<number | undefined>();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [failedIndices, setFailedIndices] = useState<number[]>([]);
  const featured = getFeaturedProducts(products);
  const [productId, setProductId] = useState(
    () => featured.find((p) => p.slug !== "other")?.id || products[0]?.id || "",
  );
  const saving = phase !== "idle";
  const canContinueAfterUploadFail = failedIndices.length > 0;

  useEffect(() => {
    if (productId || products.length === 0) return;
    const next =
      getFeaturedProducts(products).find((p) => p.slug !== "other")?.id || products[0]?.id || "";
    if (next) setProductId(next);
  }, [productId, products]);

  function translateResolved(payload: unknown, fallbackKey: string) {
    try {
      const resolved = resolveListingError(payload);
      const msg = t(resolved.key as "listingErrors.publishFailed", resolved.values);
      if (resolved.field) {
        setFieldError({ [resolved.field]: msg });
      }
      return msg;
    } catch {
      return t(fallbackKey as "images.uploadError");
    }
  }

  function clearMessages() {
    setError("");
    setFieldError({});
  }

  function onFilesChange(next: File[]) {
    setFiles(next);
    setFailedIndices([]);
  }

  function continueWithoutFailed() {
    publishWithOkOnlyRef.current = true;
    setFiles([]);
    setFailedIndices([]);
    clearMessages();
    formRef.current?.requestSubmit();
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current || saving) return;
    clearMessages();

    if (!productId) {
      const msg = t("listingErrors.invalidProduct");
      setFieldError({ product: msg });
      setError(msg);
      return;
    }

    submittingRef.current = true;
    setUploadProgress(undefined);
    const skipPendingFiles = publishWithOkOnlyRef.current;
    publishWithOkOnlyRef.current = false;

    try {
      const fd = new FormData(e.currentTarget);
      const phone = String(fd.get("phone") || "").trim();
      if (phone.length < 8) {
        const msg = t("listingErrors.phoneInvalid");
        setFieldError({ phone: msg });
        setError(msg);
        setPhase("idle");
        submittingRef.current = false;
        return;
      }
      if (!String(fd.get("marzId") || "").trim()) {
        const msg = t("listingErrors.invalidMarz");
        setFieldError({ marz: msg });
        setError(msg);
        setPhase("idle");
        submittingRef.current = false;
        return;
      }

      let imageUrls = uploadedUrls;
      const pendingFiles = skipPendingFiles ? [] : files;
      if (pendingFiles.length > 0) {
        setPhase("uploading");
        const alreadyOk = uploadedUrls.length;
        const result = await uploadImagesDetailed(pendingFiles, {
          onProgress: setUploadProgress,
        });
        imageUrls = [...uploadedUrls, ...result.urls];
        setUploadedUrls(imageUrls);

        if (result.failures.length > 0) {
          setFiles(result.failedFiles);
          setFailedIndices(result.failedFiles.map((_, i) => i));
          setError(
            formatUploadBatchError(
              (key, values) => t(key as "images.photoFailOne", values),
              result,
              alreadyOk,
            ),
          );
          setPhase("idle");
          submittingRef.current = false;
          return;
        }
        setFiles([]);
        setFailedIndices([]);
      } else if (skipPendingFiles) {
        setFiles([]);
        setFailedIndices([]);
      }

      setPhase("publishing");
      const res = await fetch("/api/forward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(fd.entries()),
          productId,
          phone,
          imageUrls,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(translateResolved(data, "images.uploadError"));
        setPhase("idle");
        submittingRef.current = false;
        return;
      }
      const crop = await res.json();
      router.push(`/forward/${crop.id}`);
      router.refresh();
    } catch (err) {
      setError(
        translateResolved(
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
    <form ref={formRef} className="stack-form listing-form" onSubmit={onSubmit}>
      <label>
        <span>{t("forwardForm.product")}</span>
        <ProductSelect
          products={products}
          value={productId}
          onChange={(id) => {
            setProductId(id);
            setFieldError((prev) => ({ ...prev, product: undefined }));
          }}
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
        {fieldError.product ? (
          <span className="form-error small" role="alert">
            {fieldError.product}
          </span>
        ) : null}
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
        {fieldError.title ? (
          <span className="form-error small" role="alert">
            {fieldError.title}
          </span>
        ) : null}
      </label>
      <label>
        <span>{t("forwardForm.description")}</span>
        <textarea name="description" required minLength={10} rows={4} disabled={saving} />
        {fieldError.description ? (
          <span className="form-error small" role="alert">
            {fieldError.description}
          </span>
        ) : null}
      </label>
      <div className="form-row">
        <label>
          <span>{t("forwardForm.qty")}</span>
          <input name="qtyExpected" type="number" min={1} required disabled={saving} />
          {fieldError.qty ? (
            <span className="form-error small" role="alert">
              {fieldError.qty}
            </span>
          ) : null}
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
        {fieldError.marz ? (
          <span className="form-error small" role="alert">
            {fieldError.marz}
          </span>
        ) : null}
      </label>
      <div className="form-row">
        <label>
          <span>{t("jobsForm.phone")}</span>
          <input name="phone" required defaultValue={defaultPhone || ""} disabled={saving} />
          {fieldError.phone ? (
            <span className="form-error small" role="alert">
              {fieldError.phone}
            </span>
          ) : null}
        </label>
        <label>
          <span>WhatsApp</span>
          <input name="whatsapp" defaultValue={defaultPhone || ""} disabled={saving} />
        </label>
      </div>
      <ImageUploadField
        files={files}
        onChange={onFilesChange}
        existingUrls={uploadedUrls}
        onExistingChange={setUploadedUrls}
        failedIndices={failedIndices}
        uploading={phase === "uploading"}
        uploadProgress={uploadProgress}
        disabled={saving}
      />
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="listing-form-actions">
        <button
          type="submit"
          className="btn primary"
          disabled={saving || !productId}
          aria-busy={saving}
        >
          {submitLabel()}
        </button>
        {canContinueAfterUploadFail ? (
          <button
            type="button"
            className="btn ghost"
            disabled={saving}
            onClick={continueWithoutFailed}
          >
            {uploadedUrls.length > 0
              ? t("images.continueWithoutFailed")
              : t("images.continueWithoutPhotos")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
