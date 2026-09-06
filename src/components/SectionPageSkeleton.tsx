/** Generic section page skeleton for non-browse routes (grow, supply, jobs, etc.). */
export function SectionPageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="section page-board section-skeleton" aria-busy="true" aria-label="Loading">
      <div className="skeleton-breadcrumbs">
        <span className="skeleton skeleton-text sm" />
        <span className="skeleton skeleton-text sm" />
      </div>

      <div className="section-head browse-skeleton-head">
        <div>
          <div className="skeleton skeleton-text lg" />
          <div className="skeleton skeleton-text md" style={{ marginTop: "0.5rem", maxWidth: "24rem" }} />
        </div>
      </div>

      <div className="listing-card-grid browse-skeleton-grid" aria-hidden>
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="listing-card browse-skeleton-card">
            <div className="listing-card-media skeleton skeleton-media" />
            <div className="listing-card-body">
              <div className="skeleton skeleton-text sm" />
              <div className="skeleton skeleton-text lg" style={{ marginTop: "0.35rem" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
