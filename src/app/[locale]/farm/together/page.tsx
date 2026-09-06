import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { FarmPageShell } from "@/components/farm/FarmPageShell";
import { TogetherJoinButton } from "@/components/farm/TogetherJoinButton";

export const dynamic = "force-dynamic";

export default async function TogetherPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("farm");
  const tn = await getTranslations("nav");
  const session = await getSession();

  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { village: true },
      })
    : null;

  const villageId = user?.villageId;
  const goals = villageId
    ? await prisma.villageGoal.findMany({
        where: { villageId, status: "OPEN" },
        include: {
          joins: { include: { user: { select: { name: true, farmName: true } } } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const demo = {
    title: t("together.demoTitle"),
    targetQty: 200,
    progressQty: 85,
    unit: "ton",
    joins: 6,
  };

  return (
    <FarmPageShell
      title={t("tools.together.title")}
      lede={t("tools.together.desc")}
      breadcrumbs={[
        { href: "/", label: tn("home") },
        { href: "/farm", label: t("hub.title") },
        { label: t("tools.together.title") },
      ]}
    >
      {!villageId ? (
        <div className="farm-journey-demo">
          <p className="farm-pill">{t("together.stubBadge")}</p>
          <h2>{demo.title}</h2>
          <div className="farm-score-bar tall">
            <i style={{ width: `${Math.round((demo.progressQty / demo.targetQty) * 100)}%` }} />
          </div>
          <p>
            {demo.progressQty} / {demo.targetQty} {demo.unit} · {demo.joins}{" "}
            {t("together.farmsJoined")}
          </p>
          <p className="muted small">{t("together.setVillage")}</p>
        </div>
      ) : goals.length === 0 ? (
        <p className="muted">{t("together.empty")}</p>
      ) : (
        <ul className="farm-list">
          {goals.map((g) => {
            const pct = g.targetQty > 0 ? Math.min(100, Math.round((g.progressQty / g.targetQty) * 100)) : 0;
            return (
              <li key={g.id}>
                <div className="farm-list-main">
                  <strong>{g.title}</strong>
                  <div className="farm-score-bar tall">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                  <p>
                    {g.progressQty} / {g.targetQty} {g.unit} · {g.joins.length}{" "}
                    {t("together.farmsJoined")}
                  </p>
                  {session?.user ? (
                    <TogetherJoinButton goalId={g.id} label={t("together.join")} />
                  ) : (
                    <Link href="/auth/login">{tn("login")}</Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </FarmPageShell>
  );
}
