import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { resolveLocationRefs } from "@/lib/resolve-refs";
import { listingAuthError } from "@/lib/listing-ownership";

const TYPES = new Set(["WAREHOUSE", "COLD", "SILO", "GREENHOUSE", "DRYER", "LAND"]);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const { id } = await params;
  const existing = await prisma.spaceListing.findUnique({ where: { id } });
  const authErr = listingAuthError(session, existing?.userId);
  if (authErr) return authErr;
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as {
    title?: string;
    description?: string;
    spaceType?: string;
    area?: number | null;
    areaUnit?: string;
    capacityNote?: string;
    availableFrom?: string | null;
    priceAmd?: number | null;
    priceUnit?: string;
    marzId?: string;
    villageId?: string | null;
    phone?: string;
  };

  const spaceType = (body.spaceType || existing.spaceType || "").toUpperCase();
  if (!TYPES.has(spaceType)) {
    return NextResponse.json({ error: "Invalid spaceType" }, { status: 400 });
  }
  if (!body.title?.trim() || !body.marzId) {
    return NextResponse.json({ error: "title and marzId required" }, { status: 400 });
  }

  const locRef = await resolveLocationRefs(body.marzId, body.villageId || null);
  if (!locRef.ok) {
    return NextResponse.json({ error: locRef.error }, { status: 400 });
  }

  const row = await prisma.spaceListing.update({
    where: { id },
    data: {
      title: body.title.trim().slice(0, 120),
      description: (body.description || "").slice(0, 2000),
      spaceType,
      area: body.area != null ? Number(body.area) : null,
      areaUnit: body.areaUnit || existing.areaUnit || "m2",
      capacityNote: body.capacityNote?.slice(0, 200) || null,
      availableFrom: body.availableFrom ? new Date(body.availableFrom) : null,
      priceAmd: body.priceAmd != null ? Math.round(Number(body.priceAmd)) : null,
      priceUnit: body.priceUnit || existing.priceUnit || "PER_MONTH",
      marzId: locRef.marzId,
      villageId: locRef.villageId,
      phone: (body.phone || "").slice(0, 40),
    },
  });
  return NextResponse.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const { id } = await params;
  const existing = await prisma.spaceListing.findUnique({ where: { id } });
  const authErr = listingAuthError(session, existing?.userId);
  if (authErr) return authErr;
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.spaceListing.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
