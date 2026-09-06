import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import { AnimalTypeIcon } from "@/components/AgIcons";
import { AnimalListingActions } from "@/components/AnimalListingActions";
import { tContent } from "@/lib/content-locale";
import { formatAmd, parseImageUrls } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyAnimalsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/my/animals`);
  }

  const listings = await prisma.animalListing.findMany({
    where: { userId: session.user.id },
    include: { marz: true, village: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="section page-board">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { href: "/animals", label: t("animalsBoard.title") },
          { label: t("myAnimals.title") },
        ]}
      />
      <div className="section-head">
        <div>
          <h1>{t("myAnimals.title")}</h1>
          <p className="lede">{t("myAnimals.lede")}</p>
        </div>
        <Link href="/animals/new" className="btn primary">
          {t("common.add")}
        </Link>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          message={t("myAnimals.empty")}
          actionHref="/animals/new"
          actionLabel={t("common.add")}
        />
      ) : (
        <ul className="my-machinery-list">
          {listings.map((a) => {
            const thumb = parseImageUrls(a.imageUrls)[0];
            return (
              <li key={a.id} className="my-machinery-row">
                <Link href={`/animals/${a.id}`} className="my-machinery-main">
                  <span className="my-machinery-thumb" aria-hidden>
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" />
                    ) : (
                      <AnimalTypeIcon type={a.animalType} size={28} />
                    )}
                  </span>
                  <span>
                    <strong>{tContent(locale, a.title)}</strong>
                    <span className="muted">
                      {a.breed} · {t(`animalTypes.${a.animalType}` as "animalTypes.COW")} ·{" "}
                      {t(`animals.status.${a.status}` as "animals.status.ACTIVE")}
                      {a.priceAmd != null ? ` · ${formatAmd(a.priceAmd, locale)} ֏` : ""}
                    </span>
                  </span>
                </Link>
                <AnimalListingActions id={a.id} status={a.status} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
