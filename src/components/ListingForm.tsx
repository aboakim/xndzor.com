"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MARZES, localizedPlaceName, type LocationVillage } from "@/lib/places";

type Category = { id: string; slug: string; nameKey: string };

const MAX_IMAGES = 8;

export function ListingForm({
  categories,
  defaultPhone,
  defaultMarzId,
}: {
  categories: Category[];
  defaultPhone?: string | null;
  defaultMarzId?: string | null;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [marzId, setMarzId] = useState(defaultMarzId || "");
  const [villageId, setVillageId] = useState("");
  const [villages, setVillages] = useState<LocationVillage[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

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
      .then((data: LocationVillage[]) => {
        if (cancelled) return;
        setVillages(Array.isArray(data) ? data : []);
        setVillageId("");
      })
      .catch(() => {
        if (!cancelled) setVillages([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingVillages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [marzId]);

  const villageOptions = useMemo(
    () =>
      villages.map((v) => ({
        id: v.id,
        label: localizedPlaceName(v, locale),
      })),
    [villages, locale]
  );

  function onImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    const next = [...files, ...selected].slice(0, MAX_IMAGES);
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
    e.target.value = "";
  }

  function removeImage(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let imageUrls: string[] = [];
      if (files.length > 0) {
        const fd = new FormData();
        for (const file of files) fd.append("files", file);
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        if (!up.ok) {
          const data = await up.json().catch(() => ({}));
          throw new Error(data.error || t("post.uploadError"));
        }
        const data = await up.json();
        imageUrls = data.urls || [];
      }

      const form = new FormData(e.currentTarget);
      const body = {
        title: form.get("title"),
        description: form.get("description"),
        priceAmd: form.get("priceAmd"),
        type: form.get("type"),
        categoryId: form.get("categoryId"),
        marzId,
        villageId,
        phone: form.get("phone"),
        whatsapp: form.get("whatsapp"),
        imageUrls,
      };

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("auth.registerError"));
      }
      const listing = await res.json();
      router.push(`/listings/${listing.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.registerError"));
      setSaving(false);
    }
  }

  return (
    <form className="stack-form" onSubmit={onSubmit}>
      <label>
        <span>{t("post.fields.title")}</span>
        <input name="title" required minLength={5} maxLength={120} />
      </label>

      <label>
        <span>{t("post.fields.description")}</span>
        <textarea
          name="description"
          required
          minLength={20}
          maxLength={8000}
          rows={10}
          placeholder={t("post.fields.descriptionHint")}
        />
      </label>

      <div className="form-row">
        <label>
          <span>{t("post.fields.price")}</span>
          <input name="priceAmd" type="number" min={1} required />
        </label>
        <label>
          <span>{t("post.fields.type")}</span>
          <select name="type" defaultValue="SELL" required>
            <option value="SELL">{t("listings.typeSell")}</option>
            <option value="BUY">{t("listings.typeBuy")}</option>
          </select>
        </label>
      </div>

      <label>
        <span>{t("post.fields.category")}</span>
        <select name="categoryId" required defaultValue="">
          <option value="" disabled>
            —
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {t(c.nameKey as "categories.animals")}
            </option>
          ))}
        </select>
      </label>

      <div className="form-row">
        <label>
          <span>{t("post.fields.marz")}</span>
          <select
            name="marzId"
            required
            value={marzId}
            onChange={(e) => setMarzId(e.target.value)}
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
          <span>{t("post.fields.village")}</span>
          <select
            name="villageId"
            required
            value={villageId}
            onChange={(e) => setVillageId(e.target.value)}
            disabled={!marzId || loadingVillages}
          >
            <option value="" disabled>
              {loadingVillages ? t("post.loadingVillages") : "—"}
            </option>
            {villageOptions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label>
          <span>{t("post.fields.phone")}</span>
          <input name="phone" required defaultValue={defaultPhone || ""} minLength={8} />
        </label>
        <label>
          <span>{t("post.fields.whatsapp")}</span>
          <input
            name="whatsapp"
            defaultValue={defaultPhone || ""}
            minLength={8}
            placeholder={t("post.fields.whatsappHint")}
          />
        </label>
      </div>

      <fieldset className="image-upload">
        <legend>{t("post.fields.images")}</legend>
        <p className="muted small">{t("post.fields.imagesHint")}</p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={onImagesChange}
          disabled={files.length >= MAX_IMAGES}
        />
        {previews.length > 0 && (
          <ul className="image-preview-grid">
            {previews.map((src, i) => (
              <li key={src}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" />
                <button type="button" className="btn ghost tiny" onClick={() => removeImage(i)}>
                  {t("post.removeImage")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn primary" disabled={saving || !villageId}>
        {saving ? t("post.saving") : t("post.submit")}
      </button>
    </form>
  );
}
