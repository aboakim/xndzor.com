"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { MARZES } from "@/lib/locations";
import { UNITS } from "@/lib/validations";
import { ProductIcon } from "@/components/AgIcons";

type Product = { id: string; slug: string; nameKey: string };

export function ForwardCropForm({
  products,
  defaultMarzId,
  defaultPhone,
}: {
  products: Product[];
  defaultMarzId?: string | null;
  defaultPhone?: string | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [productId, setProductId] = useState(products[0]?.id || "");
  const selected = products.find((p) => p.id === productId);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/forward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...Object.fromEntries(fd.entries()), productId }),
    });
    setSaving(false);
    if (!res.ok) return;
    const crop = await res.json();
    router.push(`/forward/${crop.id}`);
  }

  return (
    <form className="stack-form listing-form" onSubmit={onSubmit}>
      <label>
        <span>{t("forwardForm.product")}</span>
        <span className="select-with-icon">
          {selected ? <ProductIcon slugOrKey={selected.slug} size={18} /> : null}
          <select
            name="productId"
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {t(p.nameKey as "products.tomato")}
              </option>
            ))}
          </select>
        </span>
        <span className="product-icon-row" aria-hidden>
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`product-icon-btn ${productId === p.id ? "on" : ""}`}
              onClick={() => setProductId(p.id)}
              title={t(p.nameKey as "products.tomato")}
            >
              <ProductIcon slugOrKey={p.slug} size={16} />
            </button>
          ))}
        </span>
      </label>
      <label>
        <span>{t("forwardForm.title")}</span>
        <input name="title" required minLength={5} />
      </label>
      <label>
        <span>{t("forwardForm.description")}</span>
        <textarea name="description" required minLength={10} rows={4} />
      </label>
      <div className="form-row">
        <label>
          <span>{t("forwardForm.qty")}</span>
          <input name="qtyExpected" type="number" min={1} required />
        </label>
        <label>
          <span>{t("forwardForm.unit")}</span>
          <select name="unit" defaultValue="ton">
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
          <span>{t("forwardForm.harvestDate")}</span>
          <input name="harvestDate" type="date" required />
        </label>
        <label>
          <span>{t("forwardForm.price")}</span>
          <input name="priceAmd" type="number" min={0} />
        </label>
      </div>
      <label>
        <span>{t("jobsForm.marz")}</span>
        <select name="marzId" required defaultValue={defaultMarzId || ""}>
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
      <div className="form-row">
        <label>
          <span>{t("jobsForm.phone")}</span>
          <input name="phone" required defaultValue={defaultPhone || ""} />
        </label>
        <label>
          <span>WhatsApp</span>
          <input name="whatsapp" defaultValue={defaultPhone || ""} />
        </label>
      </div>
      <button type="submit" className="btn primary" disabled={saving}>
        {saving ? t("forwardForm.saving") : t("forwardForm.submit")}
      </button>
    </form>
  );
}
