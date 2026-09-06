import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { browseOrderBy } from "@/lib/browse-sort";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import { ListingBrowseLayout } from "@/components/ListingBrowseLayout";
import { MachineryCard } from "@/components/MachineryCard";
import { MachineryFilters } from "@/components/MachineryFilters";
import { MachineryTypeIcon } from "@/components/AgIcons";
import { MACHINERY_TYPES } from "@/lib/machinery";
import { getSession } from "@/lib/session";
import { getFarmScoreSnippets } from "@/lib/farm-score";
import {
  getActiveBoostMap,
  getProUserIds,
  sortByMonetization,
} from "@/lib/monetization";

export const dynamic = "force-dynamic";
export default async function MachineryBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    type?: string;
    marz?: string;
    village?: string;
    condition?: string;
    q?: string;
    yearMin?: string;
    yearMax?: string;
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
    prisma.machineryListing.findMany({
      where: {
        status: "ACTIVE",
        ...(sp.type ? { machineryType: sp.type } : {}),
        ...(sp.marz ? { marzId: sp.marz } : {}),
        ...(sp.village ? { villageId: sp.village } : {}),
        ...(sp.condition ? { condition: sp.condition } : {}),
        ...(sp.yearMin || sp.yearMax
          ? {
              year: {
                ...(sp.yearMin ? { gte: Number(sp.yearMin) } : {}),
                ...(sp.yearMax ? { lte: Number(sp.yearMax) } : {}),
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
                { make: { contains: sp.q } },
                { model: { contains: sp.q } },
              ],
            }
          : {}),
      },
      include: { marz: true, village: true },
      orderBy: browseOrderBy(sp.sort),
    }),
  ]);

  const [snippets, boostMap, proIds] = await Promise.all([
    getFarmScoreSnippets(listings.map((m) => m.userId)),
    getActiveBoostMap(
      "MACHINERY",
      listings.map((m) => m.id),
    ),
    getProUserIds(listings.map((m) => m.userId)),
  ]);
  const ranked = sortByMonetization(listings, boostMap, proIds);

  return (
    <div className="section page-board">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { label: t("machineryBoard.title") },
        ]}
      />
      <div className="section-head">
        <div>
          <h1>{t("machineryBoard.title")}</h1>
          <p className="lede">{t("machineryBoard.lede")}</p>
        </div>
        <div className="section-head-actions">
          {session ? (
            <Link href="/my/machinery" className="btn ghost">
              {t("myMachinery.title")}
            </Link>
          ) : null}
          <Link href="/machinery/new" className="btn primary">
            {t("common.add")}
          </Link>
        </div>
      </div>

      <div className="category-shortcuts" aria-label={t("machineryBoard.type")}>
        <Link href="/machinery" className={!sp.type ? "active" : undefined}>
          {t("machineryBoard.allTypes")}
        </Link>
        {MACHINERY_TYPES.map((type) => (
          <Link
            key={type}
            href={`/machinery?type=${type}`}
            className={sp.type === type ? "active" : undefined}
          >
            <MachineryTypeIcon type={type} size={15} />
            {t(`machineryTypes.${type}` as "machineryTypes.TRACTOR")}
          </Link>
        ))}
      </div>

      <ListingBrowseLayout
        sort={sp.sort}
        hasResults={ranked.length > 0}
        resultCount={ranked.length}
        empty={
          <EmptyState
            message={t("machineryBoard.empty")}
            actionHref="/machinery/new"
            actionLabel={t("common.add")}
            cue={t("browse.emptyCue")}
          />
        }
        sidebar={
          <MachineryFilters
            type={sp.type}
            marz={sp.marz}
            village={sp.village}
            condition={sp.condition}
            q={sp.q}
            yearMin={sp.yearMin}
            yearMax={sp.yearMax}
            priceMin={sp.priceMin}
            priceMax={sp.priceMax}
          />
        }
      >
        {ranked.map((m) => {
          const sn = snippets.get(m.userId);
          return (
            <MachineryCard
              key={m.id}
              id={m.id}
              title={m.title}
              description={m.description}
              machineryType={m.machineryType}
              make={m.make}
              model={m.model}
              year={m.year}
              condition={m.condition}
              priceAmd={m.priceAmd}
              priceNegotiable={m.priceNegotiable}
              engineHours={m.engineHours}
              mileageKm={m.mileageKm}
              powerHp={m.powerHp}
              marz={{ ...m.marz, slug: m.marz.slug }}
              village={m.village}
              imageUrls={m.imageUrls}
              farmScore={sn?.score ?? null}
              trusted={sn?.trusted ?? false}
              isPro={proIds.has(m.userId)}
              boosted={boostMap.has(m.id)}
              createdAt={m.createdAt}
            />
          );
        })}
      </ListingBrowseLayout>
    </div>
  );
}
