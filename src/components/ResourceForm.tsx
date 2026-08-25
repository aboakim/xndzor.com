"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { MARZES, localizedPlaceName, type LocationVillage } from "@/lib/places";
import { RESOURCE_PRICE_UNITS, RESOURCE_TYPES } from "@/lib/validations";

export function ResourceForm({
  defaultMarzId,
  defaultPhone,
}: {
  defaultMarzId?: string | null;
  defaultPhone?: string | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [marzId, setMarzId] = useState(defaultMarzId || "");
  const [villageId, setVillageId] = useState("");
  const [villages, setVillages] = useState<LocationVillage[]>([]);
  const [priceUnit, setPriceUnit] = useState<string>("free");
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!marzId) {
      setVillages([]);
      setVillageId("");
      return;
    }
    setLoadingVillages(true);
    fetch(`/api/villages?marzId=${encodeURIComponent(marzId)}`)
      .then((r) => r.json())
      .then((data) => {
        setVillages(Array.isArray(data) ? data : []);
        setVillageId("");
      })
      .finally(() => setLoadingVillages(false));
  }, [marzId]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = {
      type: String(fd.get("type") || ""),
      title: String(fd.get("title") || ""),
      description: String(fd.get("description") || ""),
      availabilityNote: String(fd.get("availabilityNote") || ""),
      capacityNote: String(fd.get("capacityNote") || ""),
      priceAmd: fd.get("priceAmd") || "",
      priceUnit,
      marzId,
      villageId,
      phone: String(fd.get("phone") || ""),
      whatsapp: String(fd.get("whatsapp") || ""),
    };
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      setError(t("postResource.error"));
      return;
    }
    const created = await res.json();
    router.push(`/resources/${created.id}`);
    router.refresh();
  }

  return (
    <form className="listing-form" onSubmit={onSubmit}>
      <label>
        <span>{t("postResource.fields.type")}</span>
        <select name="type" required defaultValue="TRACTOR">
          {RESOURCE_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`resources.types.${type}` as "resources.types.TRACTOR")}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t("postResource.fields.title")}</span>
        <input name="title" required minLength={5} maxLength={120} />
      </label>
      <label>
        <span>{t("postResource.fields.description")}</span>
        <textarea name="description" required minLength={10} rows={5} />
      </label>
      <div className="form-row">
        <label>
          <span>{t("postResource.fields.capacity")}</span>
          <input name="capacityNote" placeholder={t("postResource.fields.capacityHint")} />
        </label>
        <label>
          <span>{t("postResource.fields.availability")}</span>
          <input name="availabilityNote" placeholder={t("postResource.fields.availabilityHint")} />
        </label>
      </div>
      <div className="form-row">
        <label>
          <span>{t("postResource.fields.priceUnit")}</span>
          <select value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)}>
            {RESOURCE_PRICE_UNITS.map((u) => (
              <option key={u} value={u}>
                {t(`resources.priceUnits.${u}` as "resources.priceUnits.free")}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t("postResource.fields.price")}</span>
          <input name="priceAmd" type="number" min={0} disabled={priceUnit === "free"} />
        </label>
      </div>
      <div className="form-row">
        <label>
          <span>{t("postResource.fields.marz")}</span>
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
          <span>{t("postResource.fields.village")}</span>
          <select
            value={villageId}
            onChange={(e) => setVillageId(e.target.value)}
            disabled={!marzId || loadingVillages}
          >
            <option value="">{t("common.optional")}</option>
            {villages.map((v) => (
              <option key={v.id} value={v.id}>
                {localizedPlaceName(v, "hy")}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-row">
        <label>
          <span>{t("postResource.fields.phone")}</span>
          <input name="phone" required defaultValue={defaultPhone || ""} />
        </label>
        <label>
          <span>{t("postResource.fields.whatsapp")}</span>
          <input name="whatsapp" defaultValue={defaultPhone || ""} />
        </label>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn primary" disabled={saving || !marzId}>
        {saving ? t("postResource.saving") : t("postResource.submit")}
      </button>
    </form>
  );
}
