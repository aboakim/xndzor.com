import { NextResponse } from "next/server";
import type { AppSession } from "@/lib/session";

/** Owner or admin may manage a listing. */
export function canManageListing(
  session: AppSession | null | undefined,
  ownerId: string,
): boolean {
  if (!session?.user?.id) return false;
  if (session.user.id === ownerId) return true;
  return Boolean(session.user.isAdmin);
}

export function listingAuthError(
  session: AppSession | null | undefined,
  ownerId: string | null | undefined,
): NextResponse | null {
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ownerId || !canManageListing(session, ownerId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/** Status-only PATCH bodies used by MyListingActions (single `status` key). */
export function isStatusOnlyBody(body: unknown): boolean {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  const keys = Object.keys(body as object);
  return keys.length === 1 && keys[0] === "status";
}
