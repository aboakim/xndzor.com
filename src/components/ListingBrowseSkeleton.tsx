/** Skeleton placeholder matching ListingBrowseLayout (sidebar + card grid). */
export function ListingBrowseSkeleton() {
  return (
    <div className="section page-board browse-skeleton" aria-busy="true" aria-label="Loading">
      <div className="skeleton-breadcrumbs">
        <span className="skeleton skeleton-text sm" />
        <span className="skeleton skeleton-text sm" />
      </div>

      <div className="section-head browse-skeleton-head">
        <div>
          <div className="skeleton skeleton-text lg" />
          <div className="skeleton skeleton-text md" style={{ marginTop: "0.5rem", maxWidth: "28rem" }} />
        </div>
        <div className="skeleton skeleton-btn" />
      </div>

      <div className="category-shortcuts browse-skeleton-shortcuts" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="skeleton skeleton-pill" />
        ))}
      </div>

      <div className="browse-layout">
        <aside className="browse-sidebar browse-skeleton-sidebar" aria-hidden>
          <div className="skeleton skeleton-text md" />
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="skeleton skeleton-field" />
          ))}
        </aside>

        <div className="browse-main">
          <div className="browse-toolbar browse-skeleton-toolbar" aria-hidden>
            <span className="skeleton skeleton-icon" />
            <span className="skeleton skeleton-select" />
            <span className="skeleton skeleton-toggle" />
          </div>

          <div className="listing-card-grid browse-results browse-skeleton-grid" aria-hidden>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="listing-card browse-skeleton-card">
                <div className="listing-card-media skeleton skeleton-media" />
                <div className="listing-card-body">
                  <div className="skeleton skeleton-text sm" />
                  <div className="skeleton skeleton-text lg" style={{ marginTop: "0.35rem" }} />
                  <div className="skeleton skeleton-text md" style={{ marginTop: "0.35rem", maxWidth: "70%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
