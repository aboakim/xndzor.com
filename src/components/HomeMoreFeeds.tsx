"use client";

import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";

const DESKTOP_MQ = "(min-width: 768px)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(DESKTOP_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(DESKTOP_MQ).matches;
}

function getServerSnapshot() {
  return false;
}

/**
 * Secondary homepage feeds: expanded on desktop, collapsed behind a summary on phones
 * so the first screen stays about sell / buy / Solve / group buy.
 */
export function HomeMoreFeeds({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const isDesktop = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <details className="home-more-feeds" {...(isDesktop ? { open: true } : {})}>
      <summary className="home-more-feeds-summary">{label}</summary>
      <div className="home-more-feeds-body">{children}</div>
    </details>
  );
}
