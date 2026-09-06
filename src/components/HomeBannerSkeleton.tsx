/** Lightweight placeholder while below-fold homepage banner JS loads. */
export function HomeBannerSkeleton() {
  return (
    <div className="home-banner-skel" aria-hidden>
      <div className="skeleton home-banner-skel-lead" />
      <div className="home-banner-skel-pair">
        <div className="skeleton home-banner-skel-tile" />
        <div className="skeleton home-banner-skel-tile" />
      </div>
    </div>
  );
}

export function HomeStripSkeleton() {
  return (
    <div className="home-strip-skel" aria-hidden>
      <div className="skeleton skeleton-text md" style={{ maxWidth: "12rem" }} />
      <div className="home-strip-skel-row">
        <span className="skeleton skeleton-pill" />
        <span className="skeleton skeleton-pill" />
        <span className="skeleton skeleton-pill" />
        <span className="skeleton skeleton-pill" />
      </div>
    </div>
  );
}
