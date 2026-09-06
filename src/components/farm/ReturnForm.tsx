"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function ReturnForm({
  marzes,
}: {
  marzes: { id: string; slug: string; name: string }[];
}) {
  const t = useTranslations("farm.returns");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fromNote, setFromNote] = useState("");
  const [toNote, setToNote] = useState("");
  const [fromMarzId, setFromMarzId] = useState(marzes[0]?.id || "");
  const [toMarzId, setToMarzId] = useState(marzes[1]?.id || marzes[0]?.id || "");
  const [freeTons, setFreeTons] = useState("10");
  const [priceAmd, setPriceAmd] = useState("50000");
  const [departAt, setDepartAt] = useState("");
  const [phone, setPhone] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/farm/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromNote,
        toNote,
        fromMarzId,
        toMarzId,
        freeTons: Number(freeTons),
        priceAmd: Number(priceAmd),
        departAt: departAt || null,
        phone,
        capacityNote: `${freeTons} t`,
      }),
    });
    if (!res.ok) {
      setError(t("saveError"));
      return;
    }
    router.push("/farm/returns");
    router.refresh();
  }

  return (
    <form className="farm-form" onSubmit={save}>
      <label>
        {t("from")}
        <input required value={fromNote} onChange={(e) => setFromNote(e.target.value)} />
      </label>
      <label>
        {t("to")}
        <input required value={toNote} onChange={(e) => setToNote(e.target.value)} />
      </label>
      <label>
        {t("fromMarz")}
        <select value={fromMarzId} onChange={(e) => setFromMarzId(e.target.value)}>
          {marzes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("toMarz")}
        <select value={toMarzId} onChange={(e) => setToMarzId(e.target.value)}>
          {marzes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("freeTons")}
        <input type="number" required value={freeTons} onChange={(e) => setFreeTons(e.target.value)} />
      </label>
      <label>
        {t("price")}
        <input type="number" required value={priceAmd} onChange={(e) => setPriceAmd(e.target.value)} />
      </label>
      <label>
        {t("departAt")}
        <input type="datetime-local" value={departAt} onChange={(e) => setDepartAt(e.target.value)} />
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
