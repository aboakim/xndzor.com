import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import {
  AdminEmpty,
  AdminField,
  AdminRecord,
  AdminRecordList,
} from "@/components/AdminRecord";

export const dynamic = "force-dynamic";

export default async function AdminPlotsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const plots = await prisma.plot.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true, farmId: true } },
    },
  });

  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <>
      <h2>{t("plotsTitle")}</h2>
      <p className="lede">{t("plotsLede")}</p>
      {plots.length === 0 ? (
        <AdminEmpty>{t("noResults")}</AdminEmpty>
      ) : (
        <AdminRecordList>
          {plots.map((plot) => (
            <AdminRecord
              key={plot.id}
              title={plot.name}
              subtitle={
                plot.user.farmId ? (
                  <Link href={`/farms/${plot.user.farmId}`} className="linkish">
                    {plot.user.name}
                  </Link>
                ) : (
                  <Link
                    href={`/admin/users?q=${encodeURIComponent(plot.user.email)}`}
                    className="linkish"
                  >
                    {plot.user.name}
                  </Link>
                )
              }
            >
              <AdminField label={t("col.email")}>{plot.user.email}</AdminField>
              <AdminField label={t("col.status")}>{plot.status}</AdminField>
              <AdminField label={t("col.created")}>{dateFmt.format(plot.createdAt)}</AdminField>
            </AdminRecord>
          ))}
        </AdminRecordList>
      )}
    </>
  );
}
