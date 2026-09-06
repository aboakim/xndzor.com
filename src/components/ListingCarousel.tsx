import type { ReactNode } from "react";

/** Horizontal snap-scroll carousel for listing cards. */
export function ListingCarousel({ children, ariaLabel }: { children: ReactNode; ariaLabel: string }) {
  return (
    <div className="listing-carousel-wrap">
      <div className="listing-carousel" role="list" aria-label={ariaLabel}>
        {children}
      </div>
    </div>
  );
}
