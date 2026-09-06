import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { AdminUsersTable } from "./AdminUsersTable";

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q = "" } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const query = q.trim();
  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { email: { contains: query } },
            { name: { contains: query } },
            { phone: { contains: query } },
            { farmId: { contains: query } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      farmVerified: true,
      suspended: true,
      isPro: true,
      createdAt: true,
    },
  });

  return (
    <>
      <h2>{t("users")}</h2>
      <p className="lede">{t("usersLede")}</p>
      <AdminUsersTable
        locale={locale}
        query={query}
        users={users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
