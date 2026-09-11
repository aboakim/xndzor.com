import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import {
  runSiteSearch,
  SITE_SEARCH_MIN_LEN,
  type SearchSectionId,
} from "@/lib/site-search";
import { seoMessagesMetadata } from "@/lib/seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return seoMessagesMetadata(locale, "/search", "search");
}

export const dynamic = "force-dynamic";

const SECTION_TITLE_KEY: Record<SearchSectionId, string> = {
  supply: "supplyBoard.title",
  demand: "demandBoard.title",
  forward: "forwardBoard.title",
  animals: "animalsBoard.title",
  machinery: "machineryBoard.title",
  jobs: "jobsBoard.title",
  providers: "providersBoard.title",
  shop: "nav.shop",
  groupBuy: "groupBuy.title",
  spaces: "farmOs.spaces.title",
};

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
                <ul className="search-hit-list">
                  {section.items.map((hit) => (
                    <li key={hit.id} className="search-hit">
                      <Link href={hit.href} className="search-hit-link">
                        <span className="search-hit-title">{hit.title}</span>
                        {hit.snippet ? (
                          <span className="search-hit-snippet">{hit.snippet}</span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
