"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "@/i18n/navigation";

/** Prefetch a route once — on hover, focus, touch, or scroll-into-view. */
export function usePrefetchOnIntent() {
  const router = useRouter();
  const prefetched = useRef(new Set<string>());

  const prefetch = useCallback(
    (href: string) => {
      if (!href || prefetched.current.has(href)) return;
      prefetched.current.add(href);
      router.prefetch(href);
    },
    [router],
  );

  const bind = useCallback(
    (href: string) => ({
      onMouseEnter: () => prefetch(href),
      onFocus: () => prefetch(href),
      onTouchStart: () => prefetch(href),
    }),
    [prefetch],
  );

  return { prefetch, bind };
}
