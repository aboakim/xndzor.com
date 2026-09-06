import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DiaryRecorder } from "@/components/farm-os/DiaryRecorder";

export default async function DiaryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/diary`);
  }

  const [plots, entries] = await Promise.all([
    prisma.plot.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.farmDiaryEntry.findMany({
      where: { userId: session.user.id },
      include: { plot: { select: { name: true } } },
      orderBy: { entryDate: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div className="section page-board">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { href: "/today", label: t("farmOs.today.title") },
          { label: t("farmOs.diary.title") },
        ]}
      />
      <div className="section-head">
        <div>
          <h1>{t("farmOs.diary.title")}</h1>
          <p className="lede">{t("farmOs.diary.lede")}</p>
        </div>
        <Link href="/today" className="btn ghost">
          {t("farmOs.today.title")}
        </Link>
      </div>

      <DiaryRecorder plots={plots} />

      <section className="fos-panel" style={{ marginTop: "2rem" }}>
        <h2>{t("farmOs.diary.recent")}</h2>
        {entries.length === 0 ? (
          <p className="muted">{t("farmOs.diary.empty")}</p>
        ) : (
          <ul className="fos-expense-list">
            {entries.map((e) => {
              let parsed: { keywords?: string[] } = {};
              try {
                parsed = JSON.parse(e.parsedJson || "{}");
              } catch {
                /* ignore */
              }
              return (
                <li key={e.id}>
                  <div>
                    <strong>{e.entryDate.toISOString().slice(0, 10)}</strong>
                    <p>{e.rawText}</p>
                    <p className="muted tiny">
                      {e.plot?.name || ""}
                      {parsed.keywords?.length
                        ? ` · ${parsed.keywords.join(", ")}`
                        : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
