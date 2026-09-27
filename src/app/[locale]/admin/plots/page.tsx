import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";

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
      <div className="admin-table-wrap admin-responsive-table">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t("col.title")}</th>
              <th>{t("col.owner")}</th>
              <th>{t("col.status")}</th>
              <th>{t("col.created")}</th>
            </tr>
          </thead>
          <tbody>
            {plots.length === 0 ? (
              <tr>
                <td colSpan={4}>{t("noResults")}</td>
              </tr>
            ) : (
              plots.map((plot) => (
                <tr key={plot.id}>
                  <td data-label={t("col.title")}>{plot.name}</td>
                  <td data-label={t("col.owner")}>
                    {plot.user.farmId ? (
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
                    )}
                    <span className="tiny muted block">{plot.user.email}</span>
                  </td>
                  <td data-label={t("col.status")}>{plot.status}</td>
                  <td data-label={t("col.created")}>{dateFmt.format(plot.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
