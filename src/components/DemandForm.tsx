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
  isVillageOptionalForMarz,
  listingErrorI18nKey,
  locationReadyForSubmit,
} from "@/lib/listing-create";

type Product = CatalogProduct;
type Phase = "idle" | "uploading" | "publishing";

export function DemandForm({
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
  const submittingRef = useRef(false);
  const [marzId, setMarzId] = useState(defaultMarzId || "");
  const [villageId, setVillageId] = useState(defaultVillageId || "");
  const [villages, setVillages] = useState<LocationVillage[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
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

  function resolveError(dataError: unknown, fallbackKey: string) {
    try {
      return t(listingErrorI18nKey(dataError) as "listingErrors.publishFailed");
    } catch {
      return t(fallbackKey as "postDemand.error");
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current || saving) return;
    if (!productId) {
      setError(t("listingErrors.invalidProduct"));
      return;
    }
    if (!locationReady) {
      setError(t("listingErrors.villageRequired"));
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
      const body = {
        title: String(fd.get("title") || ""),
        description: String(fd.get("description") || ""),
        productId,
        qtyMin: fd.get("qtyMin"),
        qtyMax: fd.get("qtyMax") || "",
        unit: String(fd.get("unit") || "kg"),
        buyerKind: String(fd.get("buyerKind") || "WHOLESALE"),
        priceMinAmd: fd.get("priceMinAmd") || "",
        priceMaxAmd: fd.get("priceMaxAmd") || "",
        timingNote: String(fd.get("timingNote") || ""),
        marzId,
        villageId: villageId || "",
        phone: String(fd.get("phone") || ""),
        whatsapp: String(fd.get("whatsapp") || ""),
        imageUrls,
      };
      const res = await fetch("/api/demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(resolveError(data.error, "postDemand.error"));
        setPhase("idle");
        submittingRef.current = false;
        return;
      }
      const created = await res.json();
      router.push(`/demand/${created.id}`);
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
    if (phase === "publishing") return t("postDemand.saving");
    return t("postDemand.submit");
  }

  return (
    <form className="listing-form stack-form" onSubmit={onSubmit}>
      <label>
        <span>{t("postDemand.fields.title")}</span>
        <input name="title" required minLength={5} maxLength={120} disabled={saving} />
      </label>
      <label>
        <span>{t("postDemand.fields.description")}</span>
        <textarea
          name="description"
          required
          minLength={20}
          maxLength={8000}
          rows={10}
          placeholder={t("postDemand.fields.descriptionHint")}
          disabled={saving}
        />
      </label>
      <div className="form-row">
        <label>
          <span>{t("postDemand.fields.product")}</span>
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
        <label>
          <span>{t("postDemand.fields.unit")}</span>
          <select name="unit" defaultValue="kg" disabled={saving}>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {t(`units.${u}` as "units.kg")}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <span>{t("postDemand.fields.buyerKind")}</span>
        <select name="buyerKind" defaultValue="WHOLESALE" disabled={saving}>
          {(["FACTORY", "SHOP_CHAIN", "RESTAURANT", "WHOLESALE", "EXPORTER", "OTHER"] as const).map(
            (k) => (
              <option key={k} value={k}>
                {t(`buyerKinds.${k}`)}
              </option>
            ),
          )}
        </select>
      </label>
      <div className="form-row">
        <label>
          <span>{t("postDemand.fields.qtyMin")}</span>
          <input name="qtyMin" type="number" min={1} required disabled={saving} />
        </label>
        <label>
          <span>{t("postDemand.fields.qtyMax")}</span>
          <input name="qtyMax" type="number" min={1} disabled={saving} />
        </label>
      </div>
      <div className="form-row">
        <label>
          <span>{t("postDemand.fields.priceMin")}</span>
          <input name="priceMinAmd" type="number" min={0} disabled={saving} />
        </label>
        <label>
          <span>{t("postDemand.fields.priceMax")}</span>
          <input name="priceMaxAmd" type="number" min={0} disabled={saving} />
        </label>
      </div>
      <label>
        <span>{t("postDemand.fields.timing")}</span>
        <input
          name="timingNote"
          maxLength={200}
          placeholder={t("postDemand.fields.timingHint")}
          disabled={saving}
        />
      </label>
      <div className="form-row">
        <label>
          <span>{t("postDemand.fields.marz")}</span>
          <select
            value={marzId}
            onChange={(e) => {
              setMarzId(e.target.value);
              setVillageId("");
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
        </label>
        <label>
          <span>
            {t("postDemand.fields.village")}
            {villageOptional ? ` (${t("auth.placeholders.villageOptional")})` : ""}
          </span>
          <select
            value={villageId}
            onChange={(e) => setVillageId(e.target.value)}
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
          {villageOptional ? (
            <small className="field-hint">{t("auth.hints.villageYerevan")}</small>
          ) : null}
        </label>
      </div>
      <div className="form-row">
        <label>
          <span>{t("postDemand.fields.phone")}</span>
          <input name="phone" required defaultValue={defaultPhone || ""} disabled={saving} />
        </label>
        <label>
          <span>{t("postDemand.fields.whatsapp")}</span>
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
        disabled={saving || !locationReady || !productId}
        aria-busy={saving}
      >
        {submitLabel()}
      </button>
    </form>
  );
}
