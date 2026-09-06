import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { FarmPageShell } from "@/components/farm/FarmPageShell";

export const dynamic = "force-dynamic";

export default async function ReturnsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("farm");
  const tn = await getTranslations("nav");
  const session = await getSession();

  const rides = await prisma.returnCapacityOffer.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true, farmName: true } } },
  });

  return (
    <FarmPageShell
      title={t("tools.returns.title")}
      lede={t("tools.returns.desc")}
      breadcrumbs={[
        { href: "/", label: tn("home") },
        { href: "/farm", label: t("hub.title") },
        { label: t("tools.returns.title") },
      ]}
      actions={
        session?.user ? (
          <Link href="/farm/returns/new" className="btn primary">
            {t("returns.add")}
          </Link>
        ) : (
          <Link href="/auth/login" className="btn">
            {tn("login")}
          </Link>
        )
      }
    >
      {rides.length === 0 ? (
        <p className="muted">{t("returns.empty")}</p>
      ) : (
        <ul className="farm-list">
          {rides.map((r) => (
            <li key={r.id}>
              <div className="farm-list-main">
                <strong>
                  {r.fromNote} → {r.toNote}
                </strong>
                <p>
                  {r.freeTons != null ? `${r.freeTons} t` : r.capacityNote || "—"}
                  {r.priceAmd != null ? ` · ${r.priceAmd.toLocaleString()} AMD` : ""}
                  {r.departAt
                    ? ` · ${r.departAt.toLocaleString(locale)}`
                    : r.dateHint
                      ? ` · ${r.dateHint}`
                      : ""}
                </p>
                <p className="muted small">
                  {r.user.farmName || r.user.name}
                  {r.phone ? ` · ${r.phone}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </FarmPageShell>
  );
}
