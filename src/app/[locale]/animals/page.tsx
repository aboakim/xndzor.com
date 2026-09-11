import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { browseOrderBy } from "@/lib/browse-sort";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import { ListingBrowseLayout } from "@/components/ListingBrowseLayout";
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

import { seoMessagesMetadata } from "@/lib/seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return seoMessagesMetadata(locale, "/animals", "animals");
}

export const dynamic = "force-dynamic";
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
    sort?: string;
  }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();

  const [session, listings] = await Promise.all([
    getSession(),
    prisma.animalListing.findMany({
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
      orderBy: browseOrderBy(sp.sort),
    }),
  ]);

  const [snippets, boostMap, proIds] = await Promise.all([
    getFarmScoreSnippets(listings.map((a) => a.userId)),
    getActiveBoostMap(
      "ANIMAL",
      listings.map((a) => a.id),
    ),
    getProUserIds(listings.map((a) => a.userId)),
  ]);
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

      <ListingBrowseLayout
        sort={sp.sort}
        hasResults={ranked.length > 0}
        resultCount={ranked.length}
        empty={
          <EmptyState
            message={t("animalsBoard.empty")}
            actionHref="/animals/new"
            actionLabel={t("common.add")}
            cue={t("browse.emptyCue")}
          />
        }
        sidebar={
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
        }
      >
        {ranked.map((a) => {
          const sn = snippets.get(a.userId);
          return (
            <AnimalCard
              key={a.id}
              id={a.id}
              title={a.title}
              description={a.description}
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
              createdAt={a.createdAt}
            />
          );
        })}
      </ListingBrowseLayout>
    </div>
  );
}
