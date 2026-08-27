import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import { AnimalCard } from "@/components/AnimalCard";
import { AnimalFilters } from "@/components/AnimalFilters";
import { AnimalTypeIcon } from "@/components/AgIcons";
import { ANIMAL_TYPES } from "@/lib/animals";
import { getSession } from "@/lib/session";
import { getFarmScoreSnippets } from "@/lib/farm-score";
import {
  getActiveBoostMap,
  getProUserIds,
  sortByMonetization,
} from "@/lib/monetization";

export default async function AnimalsBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    type?: string;
    marz?: string;
    village?: string;
    purpose?: string;
    q?: string;
    ageMin?: string;
    ageMax?: string;
    priceMin?: string;
    priceMax?: string;
  }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();

  const listings = await prisma.animalListing.findMany({
    where: {
      status: "ACTIVE",
      ...(sp.type ? { animalType: sp.type } : {}),
      ...(sp.marz ? { marzId: sp.marz } : {}),
      ...(sp.village ? { villageId: sp.village } : {}),
      ...(sp.purpose ? { purpose: sp.purpose } : {}),
      ...(sp.ageMin || sp.ageMax
        ? {
            ageValue: {
              ...(sp.ageMin ? { gte: Number(sp.ageMin) } : {}),
              ...(sp.ageMax ? { lte: Number(sp.ageMax) } : {}),
            },
          }
        : {}),
      ...(sp.priceMin || sp.priceMax
        ? {
            priceAmd: {
              ...(sp.priceMin ? { gte: Number(sp.priceMin) } : {}),
              ...(sp.priceMax ? { lte: Number(sp.priceMax) } : {}),
            },
          }
        : {}),
      ...(sp.q
        ? {
            OR: [
              { title: { contains: sp.q } },
              { description: { contains: sp.q } },
              { breed: { contains: sp.q } },
            ],
          }
        : {}),
    },
    include: { marz: true, village: true },
    orderBy: { createdAt: "desc" },
  });

  const snippets = await getFarmScoreSnippets(listings.map((a) => a.userId));
  const boostMap = await getActiveBoostMap(
    "ANIMAL",
    listings.map((a) => a.id),
  );
  const proIds = await getProUserIds(listings.map((a) => a.userId));
  const ranked = sortByMonetization(listings, boostMap, proIds);

  return (
    <div className="section page-board">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { label: t("animalsBoard.title") },
        ]}
      />
      <div className="section-head">
        <div>
          <h1>{t("animalsBoard.title")}</h1>
          <p className="lede">{t("animalsBoard.lede")}</p>
        </div>
        <div className="section-head-actions">
          {session ? (
            <Link href="/my/animals" className="btn ghost">
              {t("myAnimals.title")}
            </Link>
          ) : null}
          <Link href="/animals/new" className="btn primary">
            {t("common.add")}
          </Link>
        </div>
      </div>

      <div className="category-shortcuts" aria-label={t("animalsBoard.type")}>
        <Link href="/animals" className={!sp.type ? "active" : undefined}>
          {t("animalsBoard.allTypes")}
        </Link>
        {ANIMAL_TYPES.map((type) => (
          <Link
            key={type}
            href={`/animals?type=${type}`}
            className={sp.type === type ? "active" : undefined}
          >
            <AnimalTypeIcon type={type} size={15} />
            {t(`animalTypes.${type}` as "animalTypes.COW")}
          </Link>
        ))}
      </div>

      <AnimalFilters
        type={sp.type}
        marz={sp.marz}
        village={sp.village}
        purpose={sp.purpose}
        q={sp.q}
        ageMin={sp.ageMin}
        ageMax={sp.ageMax}
        priceMin={sp.priceMin}
        priceMax={sp.priceMax}
      />

      {ranked.length === 0 ? (
        <EmptyState
          message={t("animalsBoard.empty")}
          actionHref="/animals/new"
          actionLabel={t("common.add")}
        />
      ) : (
        <div className="classified-list">
          {ranked.map((a) => {
            const sn = snippets.get(a.userId);
            return (
              <AnimalCard
                key={a.id}
                id={a.id}
                title={a.title}
                animalType={a.animalType}
                breed={a.breed}
                sex={a.sex}
                ageValue={a.ageValue}
                ageUnit={a.ageUnit}
                quantity={a.quantity}
                purpose={a.purpose}
                priceAmd={a.priceAmd}
                priceNegotiable={a.priceNegotiable}
                priceMode={a.priceMode}
                marz={{ ...a.marz, slug: a.marz.slug }}
                village={a.village}
                imageUrls={a.imageUrls}
                farmScore={sn?.score ?? null}
                trusted={sn?.trusted ?? false}
                isPro={proIds.has(a.userId)}
                boosted={boostMap.has(a.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
