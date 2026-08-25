"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MARZES, localizedPlaceName, type LocationVillage } from "@/lib/places";

type Category = { id: string; slug: string; nameKey: string };

export function ListingFilters({
  categories,
  q,
  category,
  marz,
  village,
  type,
}: {
  categories: Category[];
  q?: string;
  category?: string;
  marz?: string;
  village?: string;
  type?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [marzId, setMarzId] = useState(marz || "");
  const [villageId, setVillageId] = useState(village || "");
  const [villages, setVillages] = useState<LocationVillage[]>([]);

  useEffect(() => {
    if (!marzId) {
      setVillages([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/villages?marzId=${encodeURIComponent(marzId)}`)
      .then((r) => r.json())
      .then((data: LocationVillage[]) => {
        if (cancelled) return;
        setVillages(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setVillages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [marzId]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    const qVal = String(fd.get("q") || "").trim();
    const categoryVal = String(fd.get("category") || "").trim();
    const typeVal = String(fd.get("type") || "").trim();
    if (qVal) params.set("q", qVal);
    if (categoryVal) params.set("category", categoryVal);
    if (marzId) params.set("marz", marzId);
    if (villageId) params.set("village", villageId);
    if (typeVal) params.set("type", typeVal);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/listings?${qs}` : "/listings");
    });
  }

  return (
    <form className="filters" onSubmit={onSubmit}>
      <h2>{t("listings.filters")}</h2>
      <label>
        <span>{t("listings.search")}</span>
        <input name="q" defaultValue={q || ""} placeholder={t("listings.search")} />
      </label>
      <label>
        <span>{t("post.fields.category")}</span>
        <select name="category" defaultValue={category || ""}>
          <option value="">{t("listings.allCategories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {t(c.nameKey as "categories.animals")}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t("post.fields.marz")}</span>
        <select
          name="marz"
          value={marzId}
          onChange={(e) => {
            setMarzId(e.target.value);
            setVillageId("");
          }}
        >
          <option value="">{t("listings.allMarzes")}</option>
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
          name="village"
          value={villageId}
          onChange={(e) => setVillageId(e.target.value)}
          disabled={!marzId}
        >
          <option value="">{t("listings.allVillages")}</option>
          {villages.map((v) => (
            <option key={v.id} value={v.id}>
              {localizedPlaceName(v, locale)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t("post.fields.type")}</span>
        <select name="type" defaultValue={type || ""}>
          <option value="">{t("listings.typeAll")}</option>
          <option value="SELL">{t("listings.typeSell")}</option>
          <option value="BUY">{t("listings.typeBuy")}</option>
        </select>
      </label>
      <div className="filter-actions">
        <button type="submit" className="btn primary" disabled={pending}>
          {t("listings.apply")}
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() =>
            startTransition(() => {
              setMarzId("");
              setVillageId("");
              router.push("/listings");
            })
          }
        >
          {t("listings.reset")}
        </button>
      </div>
    </form>
  );
}
