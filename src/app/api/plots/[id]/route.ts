import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { plotPhotoSchema, plotTaskStatusSchema, yieldOverrideSchema } from "@/lib/validations";
import { effectiveTons, tonsToListingQty } from "@/lib/yield";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const plot = await prisma.plot.findFirst({
    where: { id, userId: session.user.id },
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
  if (!plot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(plot);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();

  const plot = await prisma.plot.findFirst({ where: { id, userId: session.user.id } });
  if (!plot) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
    const full = await prisma.plot.findFirst({
      where: { id, userId: session.user.id },
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
        userId: session.user.id,
      },
    });
    return NextResponse.json(listing, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
