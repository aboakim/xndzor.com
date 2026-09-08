"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MARZES, localizedPlaceName, type LocationVillage } from "@/lib/places";
import { ProductIcon } from "@/components/AgIcons";
import { ProductOptgroupOptions } from "@/components/ProductOptgroupOptions";
import type { CatalogProduct } from "@/lib/products";

type Product = Pick<CatalogProduct, "id" | "slug" | "nameKey" | "sortOrder" | "category">;

export function BoardFilters({
  basePath,
  products,
  product,
  marz,
  village,
  q,
}: {
  basePath: "/demand" | "/supply";
  products: Product[];
  product?: string;
  marz?: string;
  village?: string;
  q?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [productSlug, setProductSlug] = useState(product || "");
  const [marzId, setMarzId] = useState(marz || "");
  const [villageId, setVillageId] = useState(village || "");
  const [villages, setVillages] = useState<LocationVillage[]>([]);
  const [query, setQuery] = useState(q || "");

  // Keep form fields in sync with URL when category chips (or Apply) navigate.
  useEffect(() => {
    setProductSlug(product || "");
    setMarzId(marz || "");
    setVillageId(village || "");
    setQuery(q || "");
  }, [product, marz, village, q]);

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

  function pushFilters(next: {
    product?: string;
    marz?: string;
    village?: string;
    q?: string;
  }) {
    const params = new URLSearchParams();
    if (next.product) params.set("product", next.product);
    if (next.marz) params.set("marz", next.marz);
    if (next.village) params.set("village", next.village);
    if (next.q?.trim()) params.set("q", next.q.trim());
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  function apply(e: FormEvent) {
    e.preventDefault();
    pushFilters({
      product: productSlug,
      marz: marzId,
      village: villageId,
      q: query,
    });
  }

  function onProductChange(nextProduct: string) {
    setProductSlug(nextProduct);
    // Clear stale search text so chips / search / product stay aligned.
    setQuery("");
    pushFilters({
      product: nextProduct,
      marz: marzId,
      village: villageId,
      q: "",
    });
  }

  return (
    <form className="filters-bar" onSubmit={apply}>
      <label>
        <span>{t("board.search")}</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <label>
        <span>{t("board.product")}</span>
        <span className="select-with-icon">
          {productSlug ? <ProductIcon slugOrKey={productSlug} size={16} /> : null}
          <select value={productSlug} onChange={(e) => onProductChange(e.target.value)}>
            <option value="">{t("board.allProducts")}</option>
            <ProductOptgroupOptions products={products} valueKey="slug" />
          </select>
        </span>
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
        <select
          value={villageId}
          onChange={(e) => setVillageId(e.target.value)}
          disabled={!marzId}
        >
          <option value="">{t("board.allVillages")}</option>
          {villages.map((v) => (
            <option key={v.id} value={v.id}>
              {localizedPlaceName(v, locale)}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn primary">
        {t("board.apply")}
      </button>
    </form>
  );
}
