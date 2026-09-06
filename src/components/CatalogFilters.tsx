"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { MARZES, localizedPlaceName, type LocationVillage } from "@/lib/places";
import {
  CATALOG_ROUTE,
  CATALOG_SUBTYPES,
  type CatalogCategory,
} from "@/lib/catalog";

export function CatalogFilters({
  category,
  subtype,
  marz,
  village,
  q,
  priceMin,
  priceMax,
}: {
  category: CatalogCategory;
  subtype?: string;
  marz?: string;
  village?: string;
  q?: string;
  priceMin?: string;
  priceMax?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const route = CATALOG_ROUTE[category];
  const [sub, setSub] = useState(subtype || "");
  const [marzId, setMarzId] = useState(marz || "");
  const [villageId, setVillageId] = useState(village || "");
  const [villages, setVillages] = useState<LocationVillage[]>([]);
  const [query, setQuery] = useState(q || "");
  const [pMin, setPMin] = useState(priceMin || "");
  const [pMax, setPMax] = useState(priceMax || "");

  useEffect(() => {
    setSub(subtype || "");
    setMarzId(marz || "");
    setVillageId(village || "");
    setQuery(q || "");
    setPMin(priceMin || "");
    setPMax(priceMax || "");
  }, [subtype, marz, village, q, priceMin, priceMax]);

  useEffect(() => {
    if (!marzId) {
      setVillages([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/villages?marzId=${encodeURIComponent(marzId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setVillages(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setVillages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [marzId]);

  function apply(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (sub) params.set("subtype", sub);
    if (marzId) params.set("marz", marzId);
    if (villageId) params.set("village", villageId);
    if (query.trim()) params.set("q", query.trim());
    if (pMin) params.set("priceMin", pMin);
    if (pMax) params.set("priceMax", pMax);
    const qs = params.toString();
    router.push(qs ? `/shop/${route}?${qs}` : `/shop/${route}`);
  }

  return (
    <form className="browse-filter-form" onSubmit={apply}>
      <div className="browse-filter-clear-row">
        <Link href={`/shop/${route}`} className="browse-clear">
          {t("browse.clearAll")}
        </Link>
      </div>
      <label>
        <span>{t("board.search")}</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <label>
        <span>{t("catalogBoard.subtype")}</span>
        <select value={sub} onChange={(e) => setSub(e.target.value)}>
          <option value="">{t("catalogBoard.allSubtypes")}</option>
          {CATALOG_SUBTYPES[category].map((s) => (
            <option key={s} value={s}>
              {t(`catalogSubtypes.${category}.${s}` as "catalogSubtypes.FERTILIZER.NPK")}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t("board.marz")}</span>
        <select
          value={marzId}
          onChange={(e) => {
            setMarzId(e.target.value);
            setVillageId("");
          }}
        >
          <option value="">{t("board.allMarzes")}</option>
          {MARZES.map((m) => (
            <option key={m} value={m}>
              {t(`marzes.${m}` as "marzes.Yerevan")}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t("board.village")}</span>
        <select value={villageId} onChange={(e) => setVillageId(e.target.value)} disabled={!marzId}>
          <option value="">{t("board.allVillages")}</option>
          {villages.map((v) => (
            <option key={v.id} value={v.id}>
              {localizedPlaceName(v, locale)}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="browse-price-range">
        <legend>{t("browse.price")}</legend>
        <div className="browse-price-inputs">
          <label>
            <span>{t("browse.priceFrom")}</span>
            <input type="number" min={0} value={pMin} onChange={(e) => setPMin(e.target.value)} />
          </label>
          <label>
            <span>{t("browse.priceTo")}</span>
            <input type="number" min={0} value={pMax} onChange={(e) => setPMax(e.target.value)} />
          </label>
        </div>
      </fieldset>
      <button type="submit" className="btn primary browse-apply">
        {t("board.apply")}
      </button>
    </form>
  );
}
