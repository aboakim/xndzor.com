"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const TYPES = ["WAREHOUSE", "COLD", "SILO", "GREENHOUSE", "DRYER", "LAND"] as const;

export function SpaceForm({
  marzes,
  defaultMarzId,
}: {
  marzes: { id: string; slug: string; name: string }[];
  defaultMarzId?: string | null;
}) {
  const t = useTranslations("farm.spaces");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [spaceType, setSpaceType] = useState<string>("WAREHOUSE");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [priceAmd, setPriceAmd] = useState("");
  const [marzId, setMarzId] = useState(defaultMarzId || marzes[0]?.id || "");
  const [phone, setPhone] = useState("");
  const [capacityNote, setCapacityNote] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/farm/spaces", {
      method: "POST",
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
      setError(t("saveError"));
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
        {t("publish")}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}
