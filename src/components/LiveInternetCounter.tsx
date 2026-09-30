"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Dedupe React Strict Mode double-mount for the same path. */
let lastHitPath = "";

/** LiveInternet is registered for xndzor.com; production canonical is www — strip www on hit URLs. */
function urlForLiveInternet(raw: string): string {
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    if (u.hostname === "www.xndzor.com") u.hostname = "xndzor.com";
    return u.toString();
  } catch {
    return raw;
  }
}

function hitLiveInternet() {
  const screenPart =
    typeof screen === "undefined"
      ? ""
      : ";s" +
        screen.width +
        "*" +
        screen.height +
        "*" +
        (screen.colorDepth ? screen.colorDepth : screen.pixelDepth);

  new Image().src =
    "https://counter.yadro.ru/hit?r" +
    escape(urlForLiveInternet(document.referrer)) +
    screenPart +
    ";u" +
    escape(urlForLiveInternet(document.URL)) +
    ";h" +
    escape(document.title.substring(0, 150)) +
    ";" +
    Math.random();
}

/** Invisible LiveInternet pixel — one hit per public client navigation. */
export function LiveInternetCounter() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.includes("/admin")) return;
    if (lastHitPath === pathname) return;
    lastHitPath = pathname;
    hitLiveInternet();
  }, [pathname]);

  return null;
}
