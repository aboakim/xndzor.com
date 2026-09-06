import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const schema = z.object({
  fromNote: z.string().min(2).max(200),
  toNote: z.string().min(2).max(200),
  dateHint: z.string().max(80).optional().nullable(),
  capacityNote: z.string().max(200).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const offer = await prisma.returnCapacityOffer.create({
    data: {
      userId: session.user.id,
      fromNote: d.fromNote,
      toNote: d.toNote,
      dateHint: d.dateHint || null,
      capacityNote: d.capacityNote || null,
      phone: d.phone || null,
    },
  });

  return NextResponse.json(offer, { status: 201 });
}
