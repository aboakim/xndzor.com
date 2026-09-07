import { NextResponse } from "next/server";
import { getProducts, PRODUCT_CATALOG } from "@/lib/products";
import { ensureAllProducts } from "@/lib/ensure-products";

/** Crop/product catalog for selects — never returns empty when static catalog exists. */
export async function GET() {
  const products = await getProducts();
  if (products.length === 0) {
    void ensureAllProducts().catch(() => {});
    return NextResponse.json(PRODUCT_CATALOG);
  }
  return NextResponse.json(products);
}
