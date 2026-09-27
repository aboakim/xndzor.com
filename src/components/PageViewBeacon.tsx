"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

let lastSentPath = "";

/** One beacon per public navigation. Admin pages are skipped. */
export function PageViewBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.includes("/admin")) return;
    if (lastSentPath === pathname) return;
    lastSentPath = pathname;

    void fetch("/api/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
