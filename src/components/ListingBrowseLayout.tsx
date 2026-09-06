"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

type ViewMode = "grid" | "list";
type SortMode = "newest" | "price_asc" | "price_desc";
type DensityMode = "cozy" | "dense";

type ListingBrowseLayoutProps = {
  sidebar: ReactNode;
  children: ReactNode;
  /** Shown when there are no results (EmptyState). */
  empty?: ReactNode;
  hasResults?: boolean;
  resultCount?: number;
  /** Current sort from URL search params. */
  sort?: string;
};

const VIEW_KEY = "xndzor-browse-view";
const DENSITY_KEY = "xndzor-browse-density";

export function ListingBrowseLayout({
  sidebar,
  children,
  empty,
  hasResults = true,
  resultCount,
  sort: sortProp,
}: ListingBrowseLayoutProps) {
  const t = useTranslations("browse");
  const router = useRouter();
  const pathname = usePathname();
  const [view, setView] = useState<ViewMode>("grid");
  const [density, setDensity] = useState<DensityMode>("cozy");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const sort: SortMode =
    sortProp === "price_asc" || sortProp === "price_desc" ? sortProp : "newest";

  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEW_KEY);
      if (stored === "grid" || stored === "list") setView(stored);
      const dens = localStorage.getItem(DENSITY_KEY);
      if (dens === "cozy" || dens === "dense") setDensity(dens);
    } catch {
      /* ignore */
    }
  }, []);

  function setViewMode(next: ViewMode) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* ignore */
    }
  }

  function setDensityMode(next: DensityMode) {
    setDensity(next);
    try {
      localStorage.setItem(DENSITY_KEY, next);
    } catch {
      /* ignore */
    }
  }

  function setSort(next: SortMode) {
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    );
    if (next === "newest") params.delete("sort");
    else params.set("sort", next);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    router.push("/");
  }

  return (
    <div className="listing-browse listing-browse-shell listing-browse-shell--depth">
      <button
        type="button"
        className="btn ghost browse-filters-toggle"
        onClick={() => setFiltersOpen(true)}
      >
        {t("filters")}
        {resultCount != null ? ` · ${resultCount}` : ""}
      </button>

      <div className="browse-layout">
        <aside
          className={`browse-sidebar${filtersOpen ? " is-open" : ""}`}
          aria-label={t("filters")}
        >
          <div className="browse-sidebar-head">
            <h2>{t("filters")}</h2>
            <button
              type="button"
              className="browse-sidebar-close"
              onClick={() => setFiltersOpen(false)}
              aria-label={t("closeFilters")}
            >
              ×
            </button>
          </div>
          <div
            className="browse-sidebar-body"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (
                target.closest("button[type='submit']") ||
                target.closest("a.browse-clear")
              ) {
                setFiltersOpen(false);
              }
            }}
          >
            {sidebar}
          </div>
        </aside>
        {filtersOpen ? (
          <button
            type="button"
            className="browse-sidebar-backdrop"
            aria-label={t("closeFilters")}
            onClick={() => setFiltersOpen(false)}
          />
        ) : null}

        <div className="browse-main">
          <div className="browse-toolbar">
            <button
              type="button"
              className="browse-back"
              onClick={goBack}
              aria-label={t("back")}
            >
              <BackIcon />
            </button>

            <label className="browse-sort">
              <span className="sr-only">{t("sort")}</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
              >
                <option value="newest">{t("sortNewest")}</option>
                <option value="price_asc">{t("sortPriceAsc")}</option>
                <option value="price_desc">{t("sortPriceDesc")}</option>
              </select>
            </label>

            <div className="browse-view-toggle" role="group" aria-label={t("view")}>
              <button
                type="button"
                className={view === "grid" ? "active" : undefined}
                onClick={() => setViewMode("grid")}
                aria-pressed={view === "grid"}
              >
                <GridIcon />
                <span>{t("grid")}</span>
              </button>
              <button
                type="button"
                className={view === "list" ? "active" : undefined}
                onClick={() => setViewMode("list")}
                aria-pressed={view === "list"}
              >
                <ListIcon />
                <span>{t("list")}</span>
              </button>
            </div>

            <div
              className="browse-density-toggle"
              role="group"
              aria-label={t("density")}
            >
              <button
                type="button"
                className={density === "cozy" ? "active" : undefined}
                onClick={() => setDensityMode("cozy")}
                aria-pressed={density === "cozy"}
                title={t("densityCozy")}
              >
                {t("densityCozy")}
              </button>
              <button
                type="button"
                className={density === "dense" ? "active" : undefined}
                onClick={() => setDensityMode("dense")}
                aria-pressed={density === "dense"}
                title={t("densityDense")}
              >
                {t("densityDense")}
              </button>
            </div>
          </div>

          {resultCount != null ? (
            <div className="browse-results-summary" role="status">
              <span className="browse-results-count">
                {t("resultsCount", { n: resultCount })}
              </span>
              <span className="browse-results-cue">{t("resultsCue")}</span>
            </div>
          ) : null}

          {!hasResults ? (
            empty
          ) : (
            <div
              className={[
                view === "grid"
                  ? "listing-card-grid browse-results"
                  : "browse-results browse-results-list",
                density === "dense" ? "browse-results--dense" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 6h13M8 12h13M8 18h13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="4" cy="6" r="1.5" fill="currentColor" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" />
      <circle cx="4" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}
