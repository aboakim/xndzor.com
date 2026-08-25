"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

export function SearchBar({
  compact = false,
  large = false,
  defaultValue = "",
}: {
  compact?: boolean;
  large?: boolean;
  defaultValue?: string;
}) {
  const t = useTranslations("board");
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    router.push(trimmed ? `/demand?q=${encodeURIComponent(trimmed)}` : "/demand");
  }

  return (
    <form
      className={`search-bar ${compact ? "compact" : ""} ${large ? "large" : ""}`}
      onSubmit={onSubmit}
      role="search"
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={large ? t("searchHome") : t("search")}
        aria-label={t("search")}
      />
      <button type="submit" className="btn primary">
        {t("search")}
      </button>
    </form>
  );
}
