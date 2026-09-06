import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { groupBuyJoinSchema, groupBuySchema } from "@/lib/validations";

export async function GET() {
  const campaigns = await prisma.groupBuyCampaign.findMany({
    where: { status: { in: ["OPEN", "QUOTED"] } },
    include: {
      product: true,
      marz: true,
      joins: { where: { status: "JOINED" } },
      organizer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (body.campaignId && body.qty != null) {
    const parsed = groupBuyJoinSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const campaign = await prisma.groupBuyCampaign.findUnique({
      where: { id: parsed.data.campaignId },
    });
    if (!campaign || campaign.status !== "OPEN") {
      return NextResponse.json({ error: "Group buy closed" }, { status: 400 });
    }
    const join = await prisma.groupBuyJoin.upsert({
      where: {
        campaignId_userId: {
          campaignId: parsed.data.campaignId,
          userId: session.user.id,
        },
      },
      create: {
        campaignId: parsed.data.campaignId,
        userId: session.user.id,
        qty: parsed.data.qty,
      },
      update: { qty: parsed.data.qty, status: "JOINED" },
    });
    return NextResponse.json(join, { status: 201 });
  }

  const parsed = groupBuySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const campaign = await prisma.groupBuyCampaign.create({
    data: {
      productId: d.productId,
      title: d.title,
      description: d.description,
      targetQty: d.targetQty,
      unit: d.unit,
      pricePerUnitAmd:
        d.pricePerUnitAmd === "" || d.pricePerUnitAmd == null ? null : Number(d.pricePerUnitAmd),
      deadline: d.deadline ? new Date(d.deadline) : null,
      marzId: d.marzId || null,
      organizerId: session.user.id,
    },
  });
  return NextResponse.json(campaign, { status: 201 });
}
