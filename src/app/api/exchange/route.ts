import { NextResponse } from "next/server";
import {
  getCropRankings,
  getDemandSnapshot,
  getMarzBalances,
  getMatchLists,
  getBuyerKindBreakdown,
  getSignalForCrop,
} from "@/lib/exchange";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "rankings";
  const productId = searchParams.get("productId") || undefined;
  const productSlug = searchParams.get("product") || undefined;
  const marzId = searchParams.get("marz") || undefined;

  if (mode === "snapshot" && productId) {
    const snap = await getDemandSnapshot({ productId, marzId });
    return NextResponse.json(snap);
  }

  if (mode === "signal") {
    const row = await getSignalForCrop({ productId, productSlug, marzId });
    return NextResponse.json(row);
  }

  if (mode === "map" && productId) {
    const balances = await getMarzBalances(productId);
    return NextResponse.json(balances);
  }

  if (mode === "detail" && productId) {
    const [balances, matches, kindBreakdown, signal] = await Promise.all([
      getMarzBalances(productId),
      getMatchLists(productId),
      getBuyerKindBreakdown(productId),
      getSignalForCrop({ productId }),
    ]);
    return NextResponse.json({
      balances,
      kindBreakdown,
      signal,
      harvests: matches.harvests.map((h) => ({
        id: h.id,
        title: h.title,
        qtyExpected: h.qtyExpected,
        unit: h.unit,
        harvestDate: h.harvestDate.toISOString(),
        marz: { slug: h.marz.slug },
      })),
      demands: matches.demands.map((d) => ({
        id: d.id,
        title: d.title,
        buyerKind: d.buyerKind || "WHOLESALE",
        qtyMin: d.qtyMin,
        qtyMax: d.qtyMax,
        unit: d.unit,
        marz: { slug: d.marz.slug },
        user: { name: d.user.name },
      })),
    });
  }

  const rankings = await getCropRankings({ marzId });
  return NextResponse.json(rankings);
}

