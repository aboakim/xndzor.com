import { NextResponse } from "next/server";
import { getProducts, PRODUCT_CATALOG } from "@/lib/products";

/** Crop/product catalog for selects — never returns empty when static catalog exists. */
export async function GET() {
  try {
    const products = await getProducts();
    if (products.length === 0) {
      return NextResponse.json(PRODUCT_CATALOG);
    }
    return NextResponse.json(products);
  } catch {
    return NextResponse.json(PRODUCT_CATALOG);
  }
}
