import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getUserEntitlements } from "@/lib/monetization";

const schema = z.object({
  productId: z.string().min(1),
  active: z.boolean().optional(),
});

/** Farm Pro: subscribe to demand alerts for a crop. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ent = await getUserEntitlements(session.user.id);
  if (!ent?.isPro) {
    return NextResponse.json({ error: "pro_required" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
  });
  if (!product) {
    return NextResponse.json({ error: "product_not_found" }, { status: 404 });
  }

  const active = parsed.data.active !== false;
  await prisma.demandAlert.upsert({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId: product.id,
      },
    },
    create: {
      userId: session.user.id,
      productId: product.id,
      active,
    },
    update: { active },
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const alerts = await prisma.demandAlert.findMany({
    where: { userId: session.user.id, active: true },
    include: { product: true },
  });
  return NextResponse.json(alerts);
}
