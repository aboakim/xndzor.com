import { Suspense } from "react";
import {
  ListingCreatedShareBanner,
  type ListingCreatedShareBannerProps,
} from "@/components/ListingCreatedShareBanner";

/** Server-friendly wrapper (Suspense for `useSearchParams`). */
export function ListingCreatedShareBannerSlot(props: ListingCreatedShareBannerProps) {
  return (
    <Suspense fallback={null}>
      <ListingCreatedShareBanner {...props} />
    </Suspense>
  );
}
