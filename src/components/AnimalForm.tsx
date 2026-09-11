"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MARZES, localizedPlaceName, type LocationVillage } from "@/lib/places";
import {
  ANIMAL_AGE_UNITS,
  ANIMAL_PRICE_MODES,
  ANIMAL_PURPOSES,
  ANIMAL_SEXES,
  ANIMAL_TYPES,
} from "@/lib/animals";
import { ImageUploadField, uploadImagesDetailed } from "@/components/ImageUploadField";
import { AnimalTypeIcon } from "@/components/AgIcons";
import {
  formatUploadBatchError,
  resolveListingError,
} from "@/lib/listing-create";

export function AnimalForm({
  defaultMarzId,
  defaultPhone,
  listingId,
  initial,
}: {
  defaultMarzId?: string | null;
  defaultPhone?: string | null;
  listingId?: string;
  initial?: {
    title: string;
    description: string;
    animalType: string;
    breed: string;
    sex: string;
    ageValue: number | null;
    ageUnit: string;
    weightKg: number | null;
    quantity: number;
    purpose: string;
    vaccinated: boolean;
    healthNotes: string | null;
    documentsNote: string | null;
    pedigreeNote: string | null;
    priceAmd: number | null;
    priceNegotiable: boolean;
    priceMode: string;
    marzId: string;
    villageId: string | null;
    phone: string;
    whatsapp: string | null;
    imageUrls: string[];
  };
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const isEdit = Boolean(listingId);
  const [marzId, setMarzId] = useState(initial?.marzId || defaultMarzId || "");
  const [villageId, setVillageId] = useState(initial?.villageId || "");
  const [villages, setVillages] = useState<LocationVillage[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(() => initial?.imageUrls ?? []);
  const [failedIndices, setFailedIndices] = useState<number[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [animalType, setAnimalType] = useState<(typeof ANIMAL_TYPES)[number]>(
    (initial?.animalType as (typeof ANIMAL_TYPES)[number]) || "COW",
  );
  const [negotiable, setNegotiable] = useState(Boolean(initial?.priceNegotiable));
  const [vaccinated, setVaccinated] = useState(Boolean(initial?.vaccinated));

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

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setUploadProgress(undefined);
    try {
      // Read before any await — React nullifies event.currentTarget after the handler yields.
      const fd = new FormData(e.currentTarget);
      let imageUrls = uploadedUrls;
      if (files.length > 0) {
        const alreadyOk = uploadedUrls.length;
        const result = await uploadImagesDetailed(files, { onProgress: setUploadProgress });
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
          setSaving(false);
          return;
        }
        setFiles([]);
        setFailedIndices([]);
      }
      const body = {
        title: String(fd.get("title") || ""),
        description: String(fd.get("description") || ""),
        animalType,
        breed: String(fd.get("breed") || ""),
        sex: String(fd.get("sex") || "MIXED"),
        ageValue: fd.get("ageValue") || "",
        ageUnit: String(fd.get("ageUnit") || "MONTHS"),
        weightKg: fd.get("weightKg") || "",
        quantity: fd.get("quantity") || 1,
        purpose: String(fd.get("purpose") || "OTHER"),
        vaccinated,
        healthNotes: String(fd.get("healthNotes") || ""),
        documentsNote: String(fd.get("documentsNote") || ""),
        pedigreeNote: String(fd.get("pedigreeNote") || ""),
        priceAmd: fd.get("priceAmd") || "",
        priceNegotiable: negotiable,
        priceMode: String(fd.get("priceMode") || "LOT"),
        marzId,
        villageId,
        phone: String(fd.get("phone") || ""),
        whatsapp: String(fd.get("whatsapp") || ""),
        imageUrls,
      };
      const res = await fetch(isEdit ? `/api/animals/${listingId}` : "/api/animals", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        try {
          setError(t(resolveListingError(data).key as "listingErrors.publishFailed"));
        } catch {
          setError(t(isEdit ? "listingEdit.error" : "postAnimals.error"));
        }
        setSaving(false);
        return;
      }
      const created = await res.json();
      router.push(`/animals/${isEdit ? listingId : created.id}`);
      router.refresh();
    } catch (err) {
      try {
        setError(
          t(
            resolveListingError(err instanceof Error ? err.message : undefined)
              .key as "listingErrors.publishFailed",
          ),
        );
      } catch {
        setError(t("images.uploadError"));
      }
      setSaving(false);
    }
  }

  return (
    <form className="listing-form stack-form machinery-form" onSubmit={onSubmit}>
      <fieldset className="form-section">
        <legend>{t("postAnimals.sections.basics")}</legend>
        <label>
          <span>{t("postAnimals.fields.title")}</span>
          <input
            name="title"
            required
            minLength={5}
            maxLength={160}
            placeholder={t("postAnimals.fields.titleHint")}
            defaultValue={initial?.title || ""}
          />
        </label>
        <label>
          <span>{t("postAnimals.fields.type")}</span>
          <span className="select-with-icon">
            <AnimalTypeIcon type={animalType} size={18} />
            <select
              value={animalType}
              onChange={(e) => setAnimalType(e.target.value as (typeof ANIMAL_TYPES)[number])}
              required
            >
              {ANIMAL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`animalTypes.${type}` as "animalTypes.COW")}
                </option>
              ))}
            </select>
          </span>
          <span className="product-icon-row" aria-hidden>
            {ANIMAL_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={`product-icon-btn ${animalType === type ? "on" : ""}`}
                onClick={() => setAnimalType(type)}
                title={t(`animalTypes.${type}` as "animalTypes.COW")}
              >
                <AnimalTypeIcon type={type} size={16} />
              </button>
            ))}
          </span>
        </label>
        <div className="form-row">
          <label>
            <span>{t("postAnimals.fields.breed")}</span>
            <input
              name="breed"
              required
              maxLength={80}
              placeholder={t("postAnimals.fields.breedHint")}
              defaultValue={initial?.breed || ""}
            />
          </label>
          <label>
            <span>{t("postAnimals.fields.sex")}</span>
            <select name="sex" defaultValue={initial?.sex || "MIXED"} required>
              {ANIMAL_SEXES.map((s) => (
                <option key={s} value={s}>
                  {t(`animalSexes.${s}` as "animalSexes.MIXED")}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            <span>{t("postAnimals.fields.purpose")}</span>
            <select name="purpose" defaultValue={initial?.purpose || "OTHER"} required>
              {ANIMAL_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {t(`animalPurposes.${p}` as "animalPurposes.DAIRY")}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t("postAnimals.fields.quantity")}</span>
            <input
              name="quantity"
              type="number"
              min={1}
              defaultValue={initial?.quantity ?? 1}
              required
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>{t("postAnimals.sections.details")}</legend>
        <div className="form-row">
          <label>
            <span>{t("postAnimals.fields.ageValue")}</span>
            <input
              name="ageValue"
              type="number"
              min={0}
              defaultValue={initial?.ageValue ?? ""}
            />
          </label>
          <label>
            <span>{t("postAnimals.fields.ageUnit")}</span>
            <select name="ageUnit" defaultValue={initial?.ageUnit || "MONTHS"}>
              {ANIMAL_AGE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {t(`animalAgeUnits.${u}` as "animalAgeUnits.MONTHS")}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            <span>{t("postAnimals.fields.weightKg")}</span>
            <input
              name="weightKg"
              type="number"
              min={0.1}
              step="0.1"
              defaultValue={initial?.weightKg ?? ""}
            />
          </label>
          <label className="checkbox-label">
            <span>{t("postAnimals.fields.vaccinated")}</span>
            <input
              type="checkbox"
              checked={vaccinated}
              onChange={(e) => setVaccinated(e.target.checked)}
            />
          </label>
        </div>
        <label>
          <span>{t("postAnimals.fields.healthNotes")}</span>
          <textarea
            name="healthNotes"
            rows={3}
            maxLength={2000}
            placeholder={t("postAnimals.fields.healthHint")}
            defaultValue={initial?.healthNotes || ""}
          />
        </label>
        <label>
          <span>{t("postAnimals.fields.pedigreeNote")}</span>
          <textarea
            name="pedigreeNote"
            rows={2}
            maxLength={500}
            defaultValue={initial?.pedigreeNote || ""}
          />
        </label>
        <label>
          <span>{t("postAnimals.fields.documentsNote")}</span>
          <textarea
            name="documentsNote"
            rows={2}
            maxLength={500}
            defaultValue={initial?.documentsNote || ""}
          />
        </label>
      </fieldset>

      <fieldset className="form-section">
        <legend>{t("postAnimals.sections.priceLocation")}</legend>
        <div className="form-row">
          <label>
            <span>{t("postAnimals.fields.price")}</span>
            <input
              name="priceAmd"
              type="number"
              min={0}
              defaultValue={initial?.priceAmd ?? ""}
            />
          </label>
          <label>
            <span>{t("postAnimals.fields.priceMode")}</span>
            <select name="priceMode" defaultValue={initial?.priceMode || "LOT"}>
              {ANIMAL_PRICE_MODES.map((m) => (
                <option key={m} value={m}>
                  {t(`animalPriceModes.${m}` as "animalPriceModes.LOT")}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="checkbox-label">
          <span>{t("postAnimals.fields.negotiable")}</span>
          <input
            type="checkbox"
            checked={negotiable}
            onChange={(e) => setNegotiable(e.target.checked)}
          />
        </label>
        <div className="form-row">
          <label>
            <span>{t("postAnimals.fields.marz")}</span>
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
            <span>{t("postAnimals.fields.village")}</span>
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
            <span>{t("postAnimals.fields.phone")}</span>
            <input name="phone" required defaultValue={initial?.phone || defaultPhone || ""} />
          </label>
          <label>
            <span>{t("postAnimals.fields.whatsapp")}</span>
            <input name="whatsapp" defaultValue={initial?.whatsapp || defaultPhone || ""} />
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>{t("postAnimals.sections.description")}</legend>
        <label>
          <span>{t("postAnimals.fields.description")}</span>
          <textarea
            name="description"
            required
            minLength={20}
            maxLength={12000}
            rows={10}
            placeholder={t("postAnimals.fields.descriptionHint")}
            defaultValue={initial?.description || ""}
          />
        </label>
        <ImageUploadField
          files={files}
          onChange={(next) => {
            setFiles(next);
            setFailedIndices([]);
          }}
          existingUrls={uploadedUrls}
          onExistingChange={setUploadedUrls}
          failedIndices={failedIndices}
          uploading={saving}
          uploadProgress={uploadProgress}
          disabled={saving}
        />
      </fieldset>

      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn primary" disabled={saving || !marzId || !villageId}>
        {saving
          ? t(isEdit ? "listingEdit.saving" : "postAnimals.saving")
          : t(isEdit ? "listingEdit.submit" : "postAnimals.submit")}
      </button>
    </form>
  );
}
