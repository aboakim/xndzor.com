"use client";

import { usePathname } from "@/i18n/navigation";
import type { ReactNode } from "react";

/**
 * Light opacity fade when the App Router pathname changes.
 * Keyed remount keeps it simple without View Transitions API.
 */
export function PageFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-fade">
      {children}
    </div>
  );
}
