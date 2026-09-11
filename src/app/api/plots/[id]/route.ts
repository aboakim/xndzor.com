import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  plotPhotoSchema,
  plotSchema,
  plotTaskStatusSchema,
  yieldOverrideSchema,
} from "@/lib/validations";
import { effectiveTons, estimateYieldTons, tonsToListingQty } from "@/lib/yield";
import { resolveLocationRefs, resolveProductId } from "@/lib/resolve-refs";
import { canManageListing, listingAuthError } from "@/lib/listing-ownership";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const plot = await prisma.plot.findUnique({
    where: { id },
    include: {
      cropProduct: true,
      marz: true,
      village: true,
      yieldEstimate: true,
      tasks: { orderBy: [{ status: "asc" }, { priority: "desc" }] },
      futureHarvests: {
        include: {
          preOffers: { include: { fromUser: { select: { id: true, name: true } } } },
          product: true,
        },
      },
    },
  });
  if (!plot || !canManageListing(session, plot.userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(plot);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getSession();
  const { id } = await ctx.params;
  const body = await req.json();

  const plot = await prisma.plot.findUnique({ where: { id } });
  const authErr = listingAuthError(session, plot?.userId);
  if (authErr) return authErr;
  if (!plot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!body.action) {
    const parsed = plotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const [productRef, locRef] = await Promise.all([
      resolveProductId(d.cropProductId),
      resolveLocationRefs(d.marzId, d.villageId || null),
    ]);
    if (!productRef.ok) {
      return NextResponse.json({ error: productRef.error }, { status: 400 });
    }
    if (!locRef.ok) {
      return NextResponse.json({ error: locRef.error }, { status: 400 });
    }
    const product = await prisma.product.findUnique({ where: { id: productRef.productId } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 400 });

    const est = estimateYieldTons(product.slug, d.hectares, "hy");
    const override =
      d.farmerOverrideTons === "" || d.farmerOverrideTons == null
        ? null
        : Number(d.farmerOverrideTons);

    const updated = await prisma.plot.update({
      where: { id },
      data: {
        name: d.name,
        hectares: d.hectares,
        cropProductId: productRef.productId,
        plantDate: new Date(d.plantDate),
        irrigationNotes: d.irrigationNotes || null,
        lastFertilizer: d.lastFertilizer || null,
        lastIrrigationAt: d.lastIrrigationAt ? new Date(d.lastIrrigationAt) : null,
        harvestFrom: d.harvestFrom ? new Date(d.harvestFrom) : null,
        harvestTo: d.harvestTo ? new Date(d.harvestTo) : null,
        marzId: locRef.marzId,
        villageId: locRef.villageId,
        yieldEstimate: {
          upsert: {
            create: {
              tonsMin: est.tonsMin,
              tonsMax: est.tonsMax,
              assumptionNote: est.assumptionNote,
              farmerOverrideTons: override,
              source: "RULE_TABLE",
            },
            update: {
              tonsMin: est.tonsMin,
              tonsMax: est.tonsMax,
              assumptionNote: est.assumptionNote,
              farmerOverrideTons: override,
              source: "RULE_TABLE",
            },
          },
        },
      },
      include: { yieldEstimate: true, cropProduct: true },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "yieldOverride") {
    const parsed = yieldOverrideSchema.safeParse({ ...body, plotId: id });
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const est = await prisma.yieldEstimate.update({
      where: { plotId: id },
      data: { farmerOverrideTons: parsed.data.farmerOverrideTons },
    });
    return NextResponse.json(est);
  }

  if (body.action === "taskStatus") {
    const parsed = plotTaskStatusSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const task = await prisma.plotTask.findFirst({
      where: { id: parsed.data.taskId, plotId: id },
    });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    const updated = await prisma.plotTask.update({
      where: { id: task.id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "photo") {
    const parsed = plotPhotoSchema.safeParse({ ...body, plotId: id });
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const urls: string[] = JSON.parse(plot.photoUrls || "[]");
    urls.push(parsed.data.imageUrl);
    const updated = await prisma.plot.update({
      where: { id },
      data: {
        photoUrls: JSON.stringify(urls.slice(-8)),
        photoNote:
          "possible_issue_review — Not a diagnosis. Review checklist / consult an agronomist. Berqo and specialists exist for clinical plant advice.",
      },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "publishHarvest") {
    const full = await prisma.plot.findUnique({
      where: { id },
      include: { yieldEstimate: true, cropProduct: true, user: true },
    });
    if (!full?.yieldEstimate) return NextResponse.json({ error: "No yield" }, { status: 400 });

    const tons = effectiveTons(full.yieldEstimate);
    const unit = body.unit === "kg" ? "kg" : "ton";
    const qty = tonsToListingQty(tons, unit);
    const harvestDate =
      full.harvestTo || full.harvestFrom || new Date(Date.now() + 30 * 86400000);

    const listing = await prisma.futureHarvest.create({
      data: {
        productId: full.cropProductId,
        plotId: full.id,
        title: body.title || `${full.name} — ապագա բերք`,
        description:
          body.description ||
          `Հողամասից կանխատեսում՝ ${full.yieldEstimate.tonsMin}–${full.yieldEstimate.tonsMax} տ. ${full.yieldEstimate.assumptionNote}`,
        qtyExpected: qty,
        unit,
        harvestDate,
        priceAmd: body.priceAmd != null && body.priceAmd !== "" ? Number(body.priceAmd) : null,
        marzId: full.marzId,
        villageId: full.villageId,
        phone: full.user.phone || "+37400000000",
        whatsapp: full.user.phone,
        userId: full.userId,
      },
    });
    return NextResponse.json(listing, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
