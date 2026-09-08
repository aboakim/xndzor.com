"use client";

import { useTranslations } from "next-intl";
import {
  groupProductsByCategory,
  type CatalogProduct,
} from "@/lib/products";

type ProductOption = Pick<
  CatalogProduct,
  "id" | "slug" | "nameKey" | "sortOrder" | "category"
>;

/**
 * Native `<optgroup>` options (text only). Prefer `ProductSelect` when icons are needed.
 * Products are already Ա→Ֆ sorted via `groupProductsByCategory`.
 */
export function ProductOptgroupOptions({
  products,
  valueKey = "id",
}: {
  products: ProductOption[];
  /** Forms use DB id; board filters use slug in the URL. */
  valueKey?: "id" | "slug";
}) {
  const t = useTranslations();
  const groups = groupProductsByCategory(products);

  if (groups.length === 0) return null;

  return (
    <>
      {groups.map((group) => (
        <optgroup
          key={group.id}
          label={t(group.nameKey as "productCategories.vegetables")}
        >
          {group.products.map((p) => (
            <option key={p.id} value={p[valueKey]}>
              {t(p.nameKey as "products.tomato")}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}
