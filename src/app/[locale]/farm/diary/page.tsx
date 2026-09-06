import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { FarmPageShell } from "@/components/farm/FarmPageShell";
import { DiaryForm } from "@/components/farm/DiaryForm";

export default async function FarmDiaryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("farm");
  const tn = await getTranslations("nav");
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/farm/diary`);
  }

  const [plots, entries] = await Promise.all([
    prisma.plot.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.farmDiaryEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { entryDate: "desc" },
      take: 20,
      include: { plot: { select: { name: true } } },
    }),
  ]);

  return (
    <FarmPageShell
      title={t("tools.diary.title")}
      lede={t("tools.diary.desc")}
      breadcrumbs={[
        { href: "/", label: tn("home") },
        { href: "/farm", label: t("hub.title") },
        { label: t("tools.diary.title") },
      ]}
    >
      <DiaryForm plots={plots} />

      <h2 className="farm-subhead">{t("diary.history")}</h2>
      {entries.length === 0 ? (
        <p className="muted">{t("diary.empty")}</p>
      ) : (
        <ul className="farm-list">
          {entries.map((e) => {
            let parsed: { keywords?: string[]; expenseAmd?: number } = {};
            try {
              parsed = JSON.parse(e.parsedJson) as typeof parsed;
            } catch {
              /* ignore */
            }
            return (
              <li key={e.id}>
                <div className="farm-list-main">
                  <strong>
                    {e.entryDate.toLocaleDateString(locale)}
                    {e.plot ? ` · ${e.plot.name}` : ""}
                  </strong>
                  <p>{e.rawText}</p>
                  {parsed.keywords?.length ? (
                    <span className="muted small">
                      {parsed.keywords.join(", ")}
                      {parsed.expenseAmd
                        ? ` · ${parsed.expenseAmd.toLocaleString()} AMD`
                        : ""}
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="muted small">
        <Link href="/farm/costs">{t("diary.toCosts")}</Link>
      </p>
    </FarmPageShell>
  );
}
