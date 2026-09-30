"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Dedupe React Strict Mode double-mount for the same path. */
let lastHitPath = "";

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
    escape(document.referrer) +
    screenPart +
    ";u" +
    escape(document.URL) +
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
