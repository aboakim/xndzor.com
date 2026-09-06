"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const TYPES = ["WAREHOUSE", "COLD", "SILO", "GREENHOUSE"] as const;

export function SpaceListingForm({
  marzes,
}: {
  marzes: { id: string; label: string }[];
}) {
  const t = useTranslations("farmOs.spaces");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setErr(null);
    try {
      const priceRaw = String(fd.get("priceAmd") || "");
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fd.get("title"),
          description: fd.get("description"),
          spaceType: fd.get("spaceType"),
          capacityNote: fd.get("capacityNote") || null,
          availableFrom: fd.get("availableFrom") || null,
          availableTo: fd.get("availableTo") || null,
          priceAmd: priceRaw ? Number(priceRaw) : null,
          priceUnit: fd.get("priceUnit") || "PER_MONTH",
          marzId: fd.get("marzId"),
          phone: fd.get("phone"),
        }),
      });
      if (!res.ok) {
        setErr(t("error"));
        return;
      }
      e.currentTarget.reset();
      router.refresh();
    } catch {
      setErr(t("error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="fos-expense-form stack-form" onSubmit={onSubmit} style={{ marginTop: "2rem" }}>
      <h2>{t("addTitle")}</h2>
      <label>
        <span>{t("fields.title")}</span>
        <input name="title" required minLength={3} />
      </label>
      <label>
        <span>{t("fields.description")}</span>
        <textarea name="description" required rows={3} />
      </label>
      <label>
        <span>{t("fields.type")}</span>
        <select name="spaceType" defaultValue="WAREHOUSE">
          {TYPES.map((ty) => (
            <option key={ty} value={ty}>
              {t(`types.${ty}`)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t("fields.marz")}</span>
        <select name="marzId" required>
          {marzes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t("fields.capacity")}</span>
        <input name="capacityNote" />
      </label>
      <label>
        <span>{t("fields.from")}</span>
        <input type="date" name="availableFrom" />
      </label>
      <label>
        <span>{t("fields.to")}</span>
        <input type="date" name="availableTo" />
      </label>
      <label>
        <span>{t("fields.price")}</span>
        <input type="number" name="priceAmd" min={0} />
      </label>
      <label>
        <span>{t("fields.priceUnit")}</span>
        <select name="priceUnit" defaultValue="PER_MONTH">
          <option value="PER_DAY">{t("priceUnit.PER_DAY")}</option>
          <option value="PER_MONTH">{t("priceUnit.PER_MONTH")}</option>
          <option value="LOT">{t("priceUnit.LOT")}</option>
        </select>
      </label>
      <label>
        <span>{t("fields.phone")}</span>
        <input name="phone" required />
      </label>
      {err ? <p className="form-error">{err}</p> : null}
      <button type="submit" className="btn primary" disabled={busy}>
        {busy ? t("saving") : t("save")}
      </button>
    </form>
  );
}
