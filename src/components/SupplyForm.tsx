"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MARZES, localizedPlaceName, type LocationVillage } from "@/lib/places";
import { UNITS } from "@/lib/validations";
import { ImageUploadField, uploadImagesDetailed } from "@/components/ImageUploadField";
import { ProductIcon } from "@/components/AgIcons";
import { ProductSelect } from "@/components/ProductSelect";
import { getFeaturedProducts, type CatalogProduct } from "@/lib/products";
import {
  formatUploadBatchError,
  isVillageOptionalForMarz,
  locationReadyForSubmit,
  resolveListingError,
  type ListingField,
} from "@/lib/listing-create";

type Product = CatalogProduct;
type Phase = "idle" | "uploading" | "publishing";

export function SupplyForm({
  products,
  defaultMarzId,
  defaultVillageId,
  defaultPhone,
}: {
  products: Product[];
  defaultMarzId?: string | null;
  defaultVillageId?: string | null;
  defaultPhone?: string | null;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const publishWithOkOnlyRef = useRef(false);
  const [marzId, setMarzId] = useState(defaultMarzId || "");
  const [villageId, setVillageId] = useState(defaultVillageId || "");
  const [villages, setVillages] = useState<LocationVillage[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [failedIndices, setFailedIndices] = useState<number[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<Partial<Record<ListingField, string>>>({});
  const featured = getFeaturedProducts(products);
  const [productId, setProductId] = useState(
    () => featured.find((p) => p.slug !== "other")?.id || products[0]?.id || "",
  );

  useEffect(() => {
    if (productId || products.length === 0) return;
    const next =
      getFeaturedProducts(products).find((p) => p.slug !== "other")?.id || products[0]?.id || "";
    if (next) setProductId(next);
  }, [productId, products]);

  const villageOptional = isVillageOptionalForMarz(marzId);
  const locationReady = locationReadyForSubmit(marzId, villageId);
  const saving = phase !== "idle";
  const canContinueAfterUploadFail = failedIndices.length > 0;

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
        const list = Array.isArray(data) ? data : [];
        setVillages(list);
        setVillageId((prev) => (prev && list.some((v: LocationVillage) => v.id === prev) ? prev : ""));
      })
      .finally(() => {
        if (!cancelled) setLoadingVillages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [marzId]);

  function translateResolved(payload: unknown, fallbackKey: string) {
    try {
      const resolved = resolveListingError(payload);
      const msg = t(resolved.key as "listingErrors.publishFailed", resolved.values);
      if (resolved.field) {
        setFieldError({ [resolved.field]: msg });
      }
      return msg;
    } catch {
      return t(fallbackKey as "postSupply.error");
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
    if (!marzId) {
      const msg = t("listingErrors.invalidMarz");
      setFieldError({ marz: msg });
      setError(msg);
      return;
    }
    if (!locationReady) {
      const msg = t("listingErrors.villageRequired");
      setFieldError({ village: msg });
      setError(msg);
      return;
    }

    submittingRef.current = true;
    setUploadProgress(undefined);
    const skipPendingFiles = publishWithOkOnlyRef.current;
    publishWithOkOnlyRef.current = false;

    try {
      // Read before any await — React nullifies event.currentTarget after the handler yields.
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
          // Keep failed files visible; remapped indices are all "failed" in the new list.
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
      const body = {
        title: String(fd.get("title") || ""),
        description: String(fd.get("description") || ""),
        productId,
        qtyAvailable: fd.get("qtyAvailable"),
        unit: String(fd.get("unit") || "kg"),
        priceAmd: fd.get("priceAmd") || "",
        readyInDays: fd.get("readyInDays") || 0,
        marzId,
        villageId: villageId || "",
        phone,
        whatsapp: String(fd.get("whatsapp") || ""),
        imageUrls,
      };
      const res = await fetch("/api/supply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(translateResolved(data, "postSupply.error"));
        setPhase("idle");
        submittingRef.current = false;
        return;
      }
      const created = await res.json();
      router.push(`/supply/${created.id}`);
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
    if (phase === "publishing") return t("postSupply.saving");
    return t("postSupply.submit");
  }

  return (
    <form ref={formRef} className="listing-form stack-form" onSubmit={onSubmit}>
      <label>
        <span>{t("postSupply.fields.title")}</span>
        <input name="title" required minLength={5} maxLength={120} />
        {fieldError.title ? (
          <span className="form-error small" role="alert">
            {fieldError.title}
          </span>
        ) : null}
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
        {fieldError.description ? (
          <span className="form-error small" role="alert">
            {fieldError.description}
          </span>
        ) : null}
      </label>
      <div className="form-row">
        <label>
          <span>{t("postSupply.fields.product")}</span>
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
        <label>
          <span>{t("postSupply.fields.unit")}</span>
          <select name="unit" defaultValue="kg" disabled={saving}>
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
          <input name="qtyAvailable" type="number" min={1} required disabled={saving} />
          {fieldError.qty ? (
            <span className="form-error small" role="alert">
              {fieldError.qty}
            </span>
          ) : null}
        </label>
        <label>
          <span>{t("postSupply.fields.price")}</span>
          <input name="priceAmd" type="number" min={0} disabled={saving} />
        </label>
      </div>
      <label>
        <span>{t("postSupply.fields.readyInDays")}</span>
        <input
          name="readyInDays"
          type="number"
          min={0}
          max={365}
          defaultValue={0}
          disabled={saving}
        />
      </label>
      <div className="form-row">
        <label>
          <span>{t("postSupply.fields.marz")}</span>
          <select
            value={marzId}
            onChange={(e) => {
              setMarzId(e.target.value);
              setVillageId("");
              setFieldError((prev) => ({ ...prev, marz: undefined, village: undefined }));
            }}
            required
            disabled={saving}
          >
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
        <label>
          <span>
            {t("postSupply.fields.village")}
            {villageOptional ? ` (${t("auth.placeholders.villageOptional")})` : ""}
          </span>
          <select
            value={villageId}
            onChange={(e) => {
              setVillageId(e.target.value);
              setFieldError((prev) => ({ ...prev, village: undefined }));
            }}
            required={!villageOptional}
            disabled={!marzId || loadingVillages || saving}
          >
            <option value="" disabled={!villageOptional}>
              {loadingVillages
                ? t("common.loading")
                : villageOptional
                  ? t("auth.placeholders.villageOptional")
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
          {fieldError.village ? (
            <span className="form-error small" role="alert">
              {fieldError.village}
            </span>
          ) : null}
          {villageOptional ? (
            <small className="field-hint">{t("auth.hints.villageYerevan")}</small>
          ) : null}
        </label>
      </div>
      <div className="form-row">
        <label>
          <span>{t("postSupply.fields.phone")}</span>
          <input name="phone" required defaultValue={defaultPhone || ""} disabled={saving} />
          {fieldError.phone ? (
            <span className="form-error small" role="alert">
              {fieldError.phone}
            </span>
          ) : null}
        </label>
        <label>
          <span>{t("postSupply.fields.whatsapp")}</span>
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
          disabled={saving || !locationReady || !productId}
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
