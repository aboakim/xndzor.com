import { NextResponse } from "next/server";
import { userIsAdmin } from "./monetization";
import { getSession } from "./session";

/** 404 for signed-out and non-admin callers, matching the admin pages. */
export async function adminApiGuard(): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session?.user?.id || !(await userIsAdmin(session.user.id))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return null;
}
