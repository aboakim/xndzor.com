/** Shared URL sort for marketplace browse boards. */
export function browseOrderBy(sort?: string):
  | { createdAt: "desc" }
  | { priceAmd: "asc" }
  | { priceAmd: "desc" } {
  if (sort === "price_asc") return { priceAmd: "asc" };
  if (sort === "price_desc") return { priceAmd: "desc" };
  return { createdAt: "desc" };
}
