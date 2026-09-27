import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { AdminUsersTable } from "./AdminUsersTable";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; recent?: string; earlyBird?: string }>;
}) {
  const { locale } = await params;
  const { q = "", recent = "", earlyBird = "" } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const query = q.trim();
  const recentOnly = recent === "7";
  const earlyBirdOnly = earlyBird === "1";
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const users = await prisma.user.findMany({
    where:
      query || recentOnly || earlyBirdOnly
        ? {
            ...(query
              ? {
                  OR: [
                    { email: { contains: query } },
                    { name: { contains: query } },
                    { phone: { contains: query } },
                    { farmId: { contains: query } },
                  ],
                }
              : {}),
            ...(recentOnly ? { createdAt: { gte: weekAgo } } : {}),
            ...(earlyBirdOnly ? { earlyBirdClaimedAt: { not: null } } : {}),
          }
        : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      farmId: true,
      farmVerified: true,
      suspended: true,
      isPro: true,
      createdAt: true,
    },
  });

  return (
    <>
      <h2>
        {earlyBirdOnly ? t("stats.earlyBird") : recentOnly ? t("stats.recentUsers") : t("users")}
      </h2>
      <p className="lede">
        {earlyBirdOnly
          ? t("usersEarlyBirdLede")
          : recentOnly
            ? t("usersRecentLede")
            : t("usersLede")}
      </p>
      <AdminUsersTable
        locale={locale}
        query={query}
        recent={recentOnly ? "7" : ""}
        earlyBird={earlyBirdOnly ? "1" : ""}
        users={users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
