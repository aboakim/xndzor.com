import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { commentSchema } from "@/lib/validations";
import { cleanText } from "@/lib/sanitize";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { CommentTargetType } from "@/lib/catalog";

async function targetExists(targetType: CommentTargetType, targetId: string) {
  if (targetType === "MACHINERY") {
    const row = await prisma.machineryListing.findUnique({ where: { id: targetId } });
    return !!row && row.status !== "HIDDEN";
  }
  if (targetType === "ANIMAL") {
    const row = await prisma.animalListing.findUnique({ where: { id: targetId } });
    return !!row && row.status !== "HIDDEN";
  }
  const row = await prisma.catalogListing.findUnique({ where: { id: targetId } });
  return !!row && row.status !== "HIDDEN";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get("targetType");
  const targetId = searchParams.get("targetId");
  if (!targetType || !targetId) {
    return NextResponse.json({ error: "targetType and targetId required" }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: { targetType, targetId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(comments);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`comment-post:${session.user.id}:${clientIp(req)}`, {
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  const body = await req.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const ok = await targetExists(data.targetType, data.targetId);
  if (!ok) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const rating =
    data.rating === "" || data.rating == null ? null : Number(data.rating);

  const comment = await prisma.comment.create({
    data: {
      targetType: data.targetType,
      targetId: data.targetId,
      body: cleanText(data.body, 2000),
      rating,
      userId: session.user.id,
    },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(comment, { status: 201 });
}
