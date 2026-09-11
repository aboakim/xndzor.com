"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const TYPES = ["WAREHOUSE", "COLD", "SILO", "GREENHOUSE", "DRYER", "LAND"] as const;

export function SpaceForm({
  marzes,
  defaultMarzId,
  listingId,
  initial,
}: {
  marzes: { id: string; slug: string; name: string }[];
  defaultMarzId?: string | null;
  listingId?: string;
  initial?: {
    title: string;
    description: string;
    spaceType: string;
    area: number | null;
    priceAmd: number | null;
    marzId: string;
    phone: string;
    capacityNote: string | null;
  };
}) {
  const t = useTranslations("farm.spaces");
  const tEdit = useTranslations("listingEdit");
  const router = useRouter();
  const isEdit = Boolean(listingId);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(initial?.title || "");
  const [spaceType, setSpaceType] = useState<string>(initial?.spaceType || "WAREHOUSE");
  const [description, setDescription] = useState(initial?.description || "");
  const [area, setArea] = useState(initial?.area != null ? String(initial.area) : "");
  const [priceAmd, setPriceAmd] = useState(
    initial?.priceAmd != null ? String(initial.priceAmd) : "",
  );
  const [marzId, setMarzId] = useState(initial?.marzId || defaultMarzId || marzes[0]?.id || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [capacityNote, setCapacityNote] = useState(initial?.capacityNote || "");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(isEdit ? `/api/farm/spaces/${listingId}` : "/api/farm/spaces", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        spaceType,
        area: area ? Number(area) : null,
        priceAmd: priceAmd ? Number(priceAmd) : null,
        marzId,
        phone,
        capacityNote,
      }),
    });
    if (!res.ok) {
      setError(isEdit ? tEdit("error") : t("saveError"));
      return;
    }
    router.push("/farm/spaces");
    router.refresh();
  }

  return (
    <form className="farm-form" onSubmit={save}>
      <label>
        {t("titleField")}
        <input required value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label>
        {t("type")}
        <select value={spaceType} onChange={(e) => setSpaceType(e.target.value)}>
          {TYPES.map((ty) => (
            <option key={ty} value={ty}>
              {t(`types.${ty}`)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("description")}
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label>
        {t("area")}
        <input type="number" value={area} onChange={(e) => setArea(e.target.value)} />
      </label>
      <label>
        {t("capacity")}
        <input value={capacityNote} onChange={(e) => setCapacityNote(e.target.value)} />
      </label>
      <label>
        {t("price")}
        <input type="number" value={priceAmd} onChange={(e) => setPriceAmd(e.target.value)} />
      </label>
      <label>
        {t("marz")}
        <select required value={marzId} onChange={(e) => setMarzId(e.target.value)}>
          {marzes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("phone")}
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <button type="submit" className="btn primary">
        {isEdit ? tEdit("submit") : t("publish")}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}
