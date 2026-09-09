"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useRef, useState } from "react";

export function SearchBar({
  compact = false,
  large = false,
  header = false,
  defaultValue = "",
}: {
  compact?: boolean;
  large?: boolean;
  header?: boolean;
  defaultValue?: string;
}) {
  const t = useTranslations("board");
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const [isMac, setIsMac] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!header) return;
    try {
      setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent));
    } catch {
      /* ignore */
    }
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "k") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [header]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    // Product search browses things for sale (supply), not buyer-request demand.
    router.push(trimmed ? `/supply?q=${encodeURIComponent(trimmed)}` : "/supply");
  }

  function openFilters() {
    router.push("/supply");
  }

  const className = [
    "search-bar",
    compact ? "compact" : "",
    large ? "large" : "",
    header ? "header-search" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const kbdLabel = isMac ? "⌘K" : "Ctrl+K";

  return (
    <form className={className} onSubmit={onSubmit} role="search">
      <div className="search-input-wrap">
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={header || large ? t("searchHome") : t("search")}
          aria-label={t("search")}
          accessKey="/"
        />
        {header ? (
          <>
            <kbd className="search-kbd-hint" title={t("searchShortcut")}>
              {kbdLabel}
            </kbd>
            <button
              type="button"
              className="search-filter-btn"
              onClick={openFilters}
              aria-label={t("filters")}
            >
              <FilterIcon />
            </button>
          </>
        ) : null}
      </div>
      <button type="submit" className={`btn ${header ? "btn-search" : "primary"}`}>
        {t("search")}
      </button>
    </form>
  );
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
