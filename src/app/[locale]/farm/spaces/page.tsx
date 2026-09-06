import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { FarmPageShell } from "@/components/farm/FarmPageShell";

export const dynamic = "force-dynamic";

export default async function SpacesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("farm");
  const tn = await getTranslations("nav");
  const root = await getTranslations();
  const session = await getSession();

  const spaces = await prisma.spaceListing.findMany({
    where: { status: "ACTIVE" },
    include: { marz: true, village: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <FarmPageShell
      title={t("tools.spaces.title")}
      lede={t("tools.spaces.desc")}
      breadcrumbs={[
        { href: "/", label: tn("home") },
        { href: "/farm", label: t("hub.title") },
        { label: t("tools.spaces.title") },
      ]}
      actions={
        session?.user ? (
          <Link href="/farm/spaces/new" className="btn primary">
            {t("spaces.add")}
          </Link>
        ) : (
          <Link href="/auth/login" className="btn">
            {tn("login")}
          </Link>
        )
      }
    >
      {spaces.length === 0 ? (
        <p className="muted">{t("spaces.empty")}</p>
      ) : (
        <ul className="farm-list">
          {spaces.map((s) => (
            <li key={s.id}>
              <div className="farm-list-main">
                <strong>
                  {t(`spaces.types.${s.spaceType}` as "spaces.types.WAREHOUSE")} · {s.title}
                </strong>
                <p>
                  {s.village
                    ? locale === "hy"
                      ? s.village.nameHy
                      : locale === "ru"
                        ? s.village.nameRu
                        : s.village.nameEn
                    : null}
                  {s.village ? " · " : ""}
                  {root(`marzes.${s.marz.slug}` as "marzes.Yerevan")}
                  {s.area != null ? ` · ${s.area} ${s.areaUnit}` : ""}
                  {s.capacityNote ? ` · ${s.capacityNote}` : ""}
                </p>
                {s.priceAmd != null ? (
                  <span className="farm-pill">
                    {s.priceAmd.toLocaleString()} AMD / {s.priceUnit}
                  </span>
                ) : null}
                {s.phone ? <p className="muted small">{s.phone}</p> : null}
                {s.description ? <p className="muted small">{s.description}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </FarmPageShell>
  );
}
