"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  THEME_STORAGE_KEY,
  applyTheme,
  persistTheme,
  resolveTheme,
  type ThemeMode,
} from "@/lib/theme";

export function ThemeToggle() {
  const t = useTranslations("nav.theme");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = resolveTheme();
    applyTheme(initial);
    setTheme(initial);
    setMounted(true);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      try {
        if (localStorage.getItem(THEME_STORAGE_KEY)) return;
      } catch {
        return;
      }
      const next = mq.matches ? "dark" : "light";
      applyTheme(next);
      setTheme(next);
    };
    mq.addEventListener("change", onSystemChange);
    return () => mq.removeEventListener("change", onSystemChange);
  }, []);

  const isDark = theme === "dark";
  const label = isDark ? t("toLight") : t("toDark");

  function toggle() {
    const next: ThemeMode = isDark ? "light" : "dark";
    applyTheme(next);
    persistTheme(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-pressed={mounted ? isDark : undefined}
    >
      <span className="theme-toggle-track" aria-hidden>
        <SunIcon className={`theme-toggle-icon theme-toggle-sun${isDark ? "" : " active"}`} />
        <MoonIcon className={`theme-toggle-icon theme-toggle-moon${isDark ? " active" : ""}`} />
        <span className={`theme-toggle-thumb${isDark ? " dark" : ""}`} />
      </span>
      <span className="sr-only">{label}</span>
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20.5 14.2A8.2 8.2 0 0 1 9.8 3.5 7.5 7.5 0 1 0 20.5 14.2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
