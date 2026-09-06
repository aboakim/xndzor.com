"use client";

import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";

/** Thin top bar — appears instantly on internal link click, hides when route settles. */
export function NavigationProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(false);
  }, [pathname]);

  useEffect(() => {
    function maybeStart(e: Event) {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const anchor = target.closest("a[href]");
      if (!anchor || anchor.getAttribute("target") === "_blank") return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      if (/^https?:\/\//i.test(href)) {
        try {
          const url = new URL(href);
          if (url.origin !== window.location.origin) return;
        } catch {
          return;
        }
      }
      setPending(true);
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      maybeStart(e);
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("touchstart", maybeStart, { capture: true, passive: true });
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("touchstart", maybeStart, true);
    };
  }, []);

  if (!pending) return null;

  return <div className="nav-progress" role="progressbar" aria-label="Loading page" />;
}
