import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const marzId = new URL(req.url).searchParams.get("marzId");
  if (!marzId) {
    return NextResponse.json({ error: "marzId required" }, { status: 400 });
  }

  const villages = await prisma.village.findMany({
    where: { marzId },
    orderBy: { nameHy: "asc" },
    select: {
      id: true,
      slug: true,
      marzId: true,
      nameHy: true,
      nameEn: true,
      nameRu: true,
      kind: true,
      lat: true,
      lng: true,
    },
  });

  return NextResponse.json(villages);
}
