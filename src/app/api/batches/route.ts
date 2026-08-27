import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { allocateBatchCode, ensureFarmId } from "@/lib/farm-id";
import { effectiveTons } from "@/lib/yield";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z
  .object({
    futureHarvestId: z.string().min(1).optional(),
    plotId: z.string().min(1).optional(),
    qtyTons: z.number().positive().max(100000).optional(),
    harvestDate: z.string().optional(),
    note: z.string().max(500).optional(),
  })
  .refine((d) => d.futureHarvestId || d.plotId, {
    message: "SOURCE_REQUIRED",
  });

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const userId = session.user.id;

  const ip = clientIp(req);
  const limited = rateLimit(`batch:${userId}:${ip}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  await ensureFarmId(userId);

  let productId: string;
  let plotId: string | null = null;
  let futureHarvestId: string | null = null;
  let qtyTons: number;
  let harvestDate: Date;
  let productSlug: string;

  if (parsed.data.futureHarvestId) {
    const fh = await prisma.futureHarvest.findFirst({
      where: { id: parsed.data.futureHarvestId, userId },
      include: { product: true, plot: { include: { yieldEstimate: true } } },
    });
    if (!fh) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    futureHarvestId = fh.id;
    plotId = fh.plotId;
    productId = fh.productId;
    productSlug = fh.product.slug;
    harvestDate = parsed.data.harvestDate
      ? new Date(parsed.data.harvestDate)
      : fh.harvestDate;
    if (parsed.data.qtyTons != null) {
      qtyTons = parsed.data.qtyTons;
    } else {
      const u = fh.unit.toLowerCase();
      qtyTons =
        u === "kg" ? fh.qtyExpected / 1000 : fh.qtyExpected;
    }
  } else {
    const plot = await prisma.plot.findFirst({
      where: { id: parsed.data.plotId!, userId },
      include: { cropProduct: true, yieldEstimate: true },
    });
    if (!plot) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    plotId = plot.id;
    productId = plot.cropProductId;
    productSlug = plot.cropProduct.slug;
    harvestDate = parsed.data.harvestDate
      ? new Date(parsed.data.harvestDate)
      : plot.harvestFrom || plot.harvestTo || new Date();
    if (parsed.data.qtyTons != null) {
      qtyTons = parsed.data.qtyTons;
    } else if (plot.yieldEstimate) {
      qtyTons = effectiveTons(plot.yieldEstimate);
    } else {
      qtyTons = plot.hectares; // last-resort placeholder
    }
  }

  const batchCode = await allocateBatchCode(productSlug, harvestDate);
  const batch = await prisma.productBatch.create({
    data: {
      batchCode,
      userId,
      productId,
      plotId,
      futureHarvestId,
      qtyTons,
      harvestDate,
      note: parsed.data.note?.trim() || null,
      status: "PUBLISHED",
    },
    select: { id: true, batchCode: true },
  });

  return NextResponse.json(batch, { status: 201 });
}
