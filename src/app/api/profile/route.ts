import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { cleanText } from "@/lib/sanitize";
import { profileUpdateSchema } from "@/lib/validations";

const profileSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  earlyBirdFree: true,
  avatarUrl: true,
  profileVisibility: true,
  showPhonePublic: true,
  showAvatarPublic: true,
  showMarzPublic: true,
  showVillagePublic: true,
  marzId: true,
  villageId: true,
  marz: {
    select: { id: true, slug: true, nameHy: true, nameEn: true, nameRu: true },
  },
  village: {
    select: { id: true, slug: true, nameHy: true, nameEn: true, nameRu: true, marzId: true },
  },
} as const;

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: profileSelect,
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message || "INVALID_INPUT", code: first?.message },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const update: Record<string, unknown> = {};

  if (data.name !== undefined) {
    const name = cleanText(data.name, 80);
    if (name.length < 2) {
      return NextResponse.json({ error: "INVALID_NAME", code: "INVALID_NAME" }, { status: 400 });
    }
    update.name = name;
  }

  if (data.phone !== undefined) {
    update.phone = data.phone ? cleanText(data.phone, 20) : null;
  }

  if (data.avatarUrl !== undefined) {
    const url = data.avatarUrl.trim();
    if (url && !url.startsWith("/uploads/avatars/")) {
      return NextResponse.json({ error: "INVALID_AVATAR", code: "INVALID_AVATAR" }, { status: 400 });
    }
    update.avatarUrl = url || null;
  }

  if (data.profileVisibility !== undefined) {
    update.profileVisibility = data.profileVisibility;
  }
  if (data.showPhonePublic !== undefined) update.showPhonePublic = data.showPhonePublic;
  if (data.showAvatarPublic !== undefined) update.showAvatarPublic = data.showAvatarPublic;
  if (data.showMarzPublic !== undefined) update.showMarzPublic = data.showMarzPublic;
  if (data.showVillagePublic !== undefined) update.showVillagePublic = data.showVillagePublic;

  if (data.marzId !== undefined || data.villageId !== undefined) {
    const current = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { marzId: true, villageId: true },
    });
    const nextMarzId =
      data.marzId !== undefined ? (data.marzId || null) : current?.marzId ?? null;
    const nextVillageId =
      data.villageId !== undefined ? (data.villageId || null) : current?.villageId ?? null;

    if (nextVillageId) {
      const village = await prisma.village.findUnique({
        where: { id: nextVillageId },
        select: { id: true, marzId: true },
      });
      if (!village || (nextMarzId && village.marzId !== nextMarzId)) {
        return NextResponse.json(
          { error: "INVALID_VILLAGE", code: "INVALID_VILLAGE" },
          { status: 400 }
        );
      }
      update.marzId = village.marzId;
      update.villageId = village.id;
    } else if (data.marzId !== undefined) {
      update.marzId = nextMarzId;
      if (data.villageId === "") {
        update.villageId = null;
      }
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: update,
    select: profileSelect,
  });

  return NextResponse.json(user);
}
