"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MARZES, localizedPlaceName, type LocationVillage } from "@/lib/places";
import {
  MACHINERY_CONDITIONS,
  MACHINERY_TYPES,
  prefersEngineHours,
  prefersMileage,
} from "@/lib/machinery";
import { ImageUploadField, uploadImages } from "@/components/ImageUploadField";
import { MachineryTypeIcon } from "@/components/AgIcons";

export function MachineryForm({
  defaultMarzId,
  defaultPhone,
}: {
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
  const [machineryType, setMachineryType] = useState<(typeof MACHINERY_TYPES)[number]>("TRACTOR");
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
      const body = {
        title: String(fd.get("title") || ""),
        description: String(fd.get("description") || ""),
        machineryType,
        make: String(fd.get("make") || ""),
        model: String(fd.get("model") || ""),
        year: fd.get("year"),
        engineHours: fd.get("engineHours") || "",
        mileageKm: fd.get("mileageKm") || "",
        condition: String(fd.get("condition") || "USED"),
        priceAmd: fd.get("priceAmd") || "",
        priceNegotiable: negotiable,
        powerHp: fd.get("powerHp") || "",
        transmission: String(fd.get("transmission") || ""),
        driveType: String(fd.get("driveType") || ""),
        fuel: String(fd.get("fuel") || ""),
        workingWidth: String(fd.get("workingWidth") || ""),
        capacity: String(fd.get("capacity") || ""),
        attachments: String(fd.get("attachments") || ""),
        documentsNote: String(fd.get("documentsNote") || ""),
        marzId,
        villageId,
        phone: String(fd.get("phone") || ""),
        whatsapp: String(fd.get("whatsapp") || ""),
        imageUrls,
      };
      const res = await fetch("/api/machinery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(t("postMachinery.error"));
        setSaving(false);
        return;
      }
      const created = await res.json();
      router.push(`/machinery/${created.id}`);
      router.refresh();
    } catch {
      setError(t("images.uploadError"));
      setSaving(false);
    }
  }

  const showHours = prefersEngineHours(machineryType) || machineryType === "OTHER";
  const showKm = prefersMileage(machineryType) || machineryType === "OTHER";

  return (
    <form className="listing-form stack-form machinery-form" onSubmit={onSubmit}>
      <fieldset className="form-section">
        <legend>{t("postMachinery.sections.basics")}</legend>
        <label>
          <span>{t("postMachinery.fields.title")}</span>
          <input
            name="title"
            required
            minLength={5}
            maxLength={160}
            placeholder={t("postMachinery.fields.titleHint")}
          />
        </label>
        <label>
          <span>{t("postMachinery.fields.type")}</span>
          <span className="select-with-icon">
            <MachineryTypeIcon type={machineryType} size={18} />
            <select
              value={machineryType}
              onChange={(e) => setMachineryType(e.target.value as (typeof MACHINERY_TYPES)[number])}
              required
            >
              {MACHINERY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`machineryTypes.${type}` as "machineryTypes.TRACTOR")}
                </option>
              ))}
            </select>
          </span>
          <span className="product-icon-row" aria-hidden>
            {MACHINERY_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={`product-icon-btn ${machineryType === type ? "on" : ""}`}
                onClick={() => setMachineryType(type)}
                title={t(`machineryTypes.${type}` as "machineryTypes.TRACTOR")}
              >
                <MachineryTypeIcon type={type} size={16} />
              </button>
            ))}
          </span>
        </label>
        <div className="form-row">
          <label>
            <span>{t("postMachinery.fields.make")}</span>
            <input name="make" required maxLength={80} placeholder="John Deere, MTZ…" />
          </label>
          <label>
            <span>{t("postMachinery.fields.model")}</span>
            <input name="model" required maxLength={80} />
          </label>
        </div>
        <div className="form-row">
          <label>
            <span>{t("postMachinery.fields.year")}</span>
            <input
              name="year"
              type="number"
              min={1950}
              max={2100}
              required
              defaultValue={2018}
            />
          </label>
          <label>
            <span>{t("postMachinery.fields.condition")}</span>
            <select name="condition" defaultValue="USED" required>
              {MACHINERY_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {t(`machineryConditions.${c}` as "machineryConditions.USED")}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>{t("postMachinery.sections.usage")}</legend>
        <div className="form-row">
          {showHours ? (
            <label>
              <span>{t("postMachinery.fields.engineHours")}</span>
              <input name="engineHours" type="number" min={0} />
            </label>
          ) : null}
          {showKm ? (
            <label>
              <span>{t("postMachinery.fields.mileageKm")}</span>
              <input name="mileageKm" type="number" min={0} />
            </label>
          ) : null}
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>{t("postMachinery.sections.specs")}</legend>
        <div className="form-row">
          <label>
            <span>{t("postMachinery.fields.powerHp")}</span>
            <input name="powerHp" type="number" min={1} max={2000} />
          </label>
          <label>
            <span>{t("postMachinery.fields.fuel")}</span>
            <input name="fuel" maxLength={80} placeholder={t("postMachinery.fields.fuelHint")} />
          </label>
        </div>
        <div className="form-row">
          <label>
            <span>{t("postMachinery.fields.transmission")}</span>
            <input name="transmission" maxLength={80} />
          </label>
          <label>
            <span>{t("postMachinery.fields.driveType")}</span>
            <input name="driveType" maxLength={80} placeholder="4WD / 2WD" />
          </label>
        </div>
        <div className="form-row">
          <label>
            <span>{t("postMachinery.fields.workingWidth")}</span>
            <input name="workingWidth" maxLength={80} />
          </label>
          <label>
            <span>{t("postMachinery.fields.capacity")}</span>
            <input name="capacity" maxLength={120} />
          </label>
        </div>
        <label>
          <span>{t("postMachinery.fields.attachments")}</span>
          <textarea name="attachments" rows={2} maxLength={500} />
        </label>
        <label>
          <span>{t("postMachinery.fields.documentsNote")}</span>
          <textarea name="documentsNote" rows={2} maxLength={500} />
        </label>
      </fieldset>

      <fieldset className="form-section">
        <legend>{t("postMachinery.sections.priceLocation")}</legend>
        <div className="form-row">
          <label>
            <span>{t("postMachinery.fields.price")}</span>
            <input name="priceAmd" type="number" min={0} />
          </label>
          <label className="checkbox-label">
            <span>{t("postMachinery.fields.negotiable")}</span>
            <input
              type="checkbox"
              checked={negotiable}
              onChange={(e) => setNegotiable(e.target.checked)}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            <span>{t("postMachinery.fields.marz")}</span>
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
            <span>{t("postMachinery.fields.village")}</span>
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
            <span>{t("postMachinery.fields.phone")}</span>
            <input name="phone" required defaultValue={defaultPhone || ""} />
          </label>
          <label>
            <span>{t("postMachinery.fields.whatsapp")}</span>
            <input name="whatsapp" defaultValue={defaultPhone || ""} />
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>{t("postMachinery.sections.description")}</legend>
        <label>
          <span>{t("postMachinery.fields.description")}</span>
          <textarea
            name="description"
            required
            minLength={20}
            maxLength={12000}
            rows={10}
            placeholder={t("postMachinery.fields.descriptionHint")}
          />
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
        {saving ? t("postMachinery.saving") : t("postMachinery.submit")}
      </button>
    </form>
  );
}
