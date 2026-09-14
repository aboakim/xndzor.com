import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ClassifiedRow } from "@/components/ClassifiedRow";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import {
  runSiteSearch,
  SITE_SEARCH_MIN_LEN,
  type SearchHit,
  type SearchSectionId,
} from "@/lib/site-search";
import { seoMessagesMetadata } from "@/lib/seo-metadata";
import { formatAmd, formatPriceRange } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return seoMessagesMetadata(locale, "/search", "search");
}

export const dynamic = "force-dynamic";

/** Labels only — section order is enforced by SEARCH_SECTION_ORDER in site-search. */
const SECTION_TITLE_KEY: Record<SearchSectionId, string> = {
  supply: "supplyBoard.title",
  demand: "demandBoard.title",
  forward: "forwardBoard.title",
  animals: "animalsBoard.title",
  machinery: "machineryBoard.title",
  jobs: "jobsBoard.title",
  shop: "nav.shop",
  providers: "providersBoard.title",
  groupBuy: "groupBuy.title",
  spaces: "farmOs.spaces.title",
};

function hitPriceLabel(
  hit: SearchHit,
  t: Awaited<ReturnType<typeof getTranslations>>,
): string | undefined {
  if (hit.priceAmd == null && hit.priceAmdMax == null) return undefined;
  if (hit.unit) {
    return formatPriceRange(hit.priceAmd, hit.priceAmdMax ?? hit.priceAmd, hit.unit, (k) =>
      t(k as "common.amd"),
    );
  }
  const amount = hit.priceAmd ?? hit.priceAmdMax!;
  return `${formatAmd(amount)} ${t("common.amd")}`;
}

function hitMeta(
  hit: SearchHit,
  t: Awaited<ReturnType<typeof getTranslations>>,
): string {
  const parts: string[] = [];
  if (hit.marzSlug) {
    parts.push(t(`marzes.${hit.marzSlug}` as "marzes.Yerevan"));
  }
  if (hit.snippet) parts.push(hit.snippet);
  return parts.join(" · ");
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();

  const { query, tooShort, sections } = await runSiteSearch(sp.q ?? "");
  const hasQuery = query.length > 0;
  const totalHits = sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <div className="section page-board page-search">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { label: t("searchPage.title") },
        ]}
      />
      <div className="section-head">
        <div>
          <h1>{t("searchPage.title")}</h1>
          <p className="lede">{t("searchPage.lede")}</p>
        </div>
      </div>

      <div className="search-page-bar">
        <SearchBar large key={query || "empty"} defaultValue={query} />
        <p className="muted search-latin-hint">{t("searchPage.latinHint")}</p>
      </div>

      {!hasQuery ? (
        <p className="muted search-page-hint">{t("searchPage.emptyQuery")}</p>
      ) : tooShort ? (
        <p className="muted search-page-hint">
          {t("searchPage.queryTooShort", { min: SITE_SEARCH_MIN_LEN })}
        </p>
      ) : totalHits === 0 ? (
        <EmptyState
          message={t("searchPage.noResults", { q: query })}
          actionHref="/supply"
          actionLabel={t("searchPage.browseSupply")}
          secondaryHref="/machinery"
          secondaryLabel={t("machineryBoard.title")}
        />
      ) : (
        <>
          <p className="search-page-summary">
            {t("searchPage.resultsFor", { q: query, count: totalHits })}
          </p>
          <div className="search-sections">
            {sections.map((section) => (
              <section
                key={section.id}
                className="search-section"
                aria-labelledby={`search-section-${section.id}`}
              >
                <div className="search-section-head">
                  <h2 id={`search-section-${section.id}`}>
                    {t(SECTION_TITLE_KEY[section.id] as "supplyBoard.title")}
                  </h2>
                  <Link href={section.boardHref} className="btn ghost tiny">
                    {t("searchPage.viewAll")}
                  </Link>
                </div>
                <div className="classified-list search-hit-list">
                  {section.items.map((hit) => (
                    <ClassifiedRow
                      key={hit.id}
                      href={hit.href}
                      title={hit.title}
                      meta={hitMeta(hit, t)}
                      value={hitPriceLabel(hit, t)}
                      thumb={hit.imageUrl}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
