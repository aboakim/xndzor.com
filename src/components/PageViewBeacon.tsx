"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SID_KEY = "xz_sid";
let lastSentPath = "";

function sessionId(): string {
  try {
    const existing = localStorage.getItem(SID_KEY);
    if (
      existing &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)
    ) {
      return existing;
    }
    const id = crypto.randomUUID();
    localStorage.setItem(SID_KEY, id);
    return id;
  } catch {
    return "";
  }
}

function postJson(url: string, body: Record<string, string>) {
  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}

/** One pageview per public navigation, plus a presence heartbeat. Admin is skipped. */
export function PageViewBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.includes("/admin")) return;
    const sid = sessionId();

    if (lastSentPath !== pathname) {
      lastSentPath = pathname;
      postJson("/api/pageview", { path: pathname, sessionId: sid });
    }

    if (!sid) return;

    const beat = () => {
      if (document.visibilityState === "hidden") return;
      postJson("/api/presence", { sessionId: sid });
    };

    beat();
    const timer = window.setInterval(beat, 25_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  return null;
}
