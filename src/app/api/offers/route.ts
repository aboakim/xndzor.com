import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { offerSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = offerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { supplyId, demandId, message } = parsed.data;
  const [supply, demand] = await Promise.all([
    prisma.supply.findUnique({ where: { id: supplyId } }),
    prisma.demand.findUnique({ where: { id: demandId } }),
  ]);
  if (!supply || !demand || supply.status !== "ACTIVE" || demand.status !== "ACTIVE") {
    return NextResponse.json({ error: "Invalid supply or demand" }, { status: 400 });
  }
  if (supply.userId !== session.user.id && demand.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const offer = await prisma.offer.upsert({
    where: {
      supplyId_demandId_fromUserId: {
        supplyId,
        demandId,
        fromUserId: session.user.id,
      },
    },
    create: {
      supplyId,
      demandId,
      fromUserId: session.user.id,
      message: message || null,
    },
    update: {
      message: message || null,
      status: "SENT",
    },
  });

  return NextResponse.json(offer, { status: 201 });
}
