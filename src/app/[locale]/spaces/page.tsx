import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { formatAmd } from "@/lib/utils";
import { localizedPlaceName } from "@/lib/places";
import { getSession } from "@/lib/session";
import { SpaceListingForm } from "@/components/farm-os/SpaceListingForm";

export const dynamic = "force-dynamic";

export default async function SpacesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();

  const [listings, marzes] = await Promise.all([
    safeQuery(
      () =>
        prisma.spaceListing.findMany({
          where: { status: "ACTIVE" },
          include: { marz: true, village: true },
          orderBy: { createdAt: "desc" },
          take: 40,
        }),
      [],
    ),
    safeQuery(() => prisma.marz.findMany({ orderBy: { sortOrder: "asc" } }), []),
  ]);

  return (
    <div className="section page-board">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { href: "/today", label: t("farmOs.today.title") },
          { label: t("farmOs.spaces.title") },
        ]}
      />
      <div className="section-head">
        <div>
          <h1>{t("farmOs.spaces.title")}</h1>
          <p className="lede">{t("farmOs.spaces.lede")}</p>
        </div>
      </div>

      {listings.length === 0 ? (
        <p className="empty-state">{t("farmOs.spaces.empty")}</p>
      ) : (
        <ul className="match-list">
          {listings.map((s) => (
            <li key={s.id} className="match-row">
              <div>
                <strong>{s.title}</strong>
                <p>
                  {t(`farmOs.spaces.types.${s.spaceType}` as "farmOs.spaces.types.WAREHOUSE")}
                  {" · "}
                  {t(`marzes.${s.marz.slug}` as "marzes.Yerevan")}
                  {s.village
                    ? ` · ${localizedPlaceName(s.village, locale)}`
                    : ""}
                  {s.capacityNote ? ` · ${s.capacityNote}` : ""}
                </p>
                <p className="muted tiny">
                  {s.availableFrom
                    ? `${s.availableFrom.toISOString().slice(0, 10)}`
                    : "—"}
                  {s.availableTo
                    ? ` → ${s.availableTo.toISOString().slice(0, 10)}`
                    : ""}
                  {s.priceAmd != null
                    ? ` · ${formatAmd(s.priceAmd)} ֏ / ${t(
                        `farmOs.spaces.priceUnit.${s.priceUnit}` as "farmOs.spaces.priceUnit.PER_MONTH"
                      )}`
                    : ""}
                </p>
                <p className="muted tiny">{t("farmOs.spaces.matchTeaser")}</p>
              </div>
              <a className="btn ghost" href={`tel:${s.phone}`}>
                {s.phone}
              </a>
            </li>
          ))}
        </ul>
      )}

      {session?.user?.id ? (
        <SpaceListingForm
          marzes={marzes.map((m) => ({
            id: m.id,
            label: t(`marzes.${m.slug}` as "marzes.Yerevan"),
          }))}
        />
      ) : (
        <p className="muted">
          <Link href="/auth/login">{t("nav.login")}</Link> — {t("farmOs.spaces.loginToAdd")}
        </p>
      )}
    </div>
  );
}
