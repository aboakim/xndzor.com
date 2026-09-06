"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const locales = [
  { code: "hy" },
  { code: "ru" },
  { code: "en" },
] as const;

type LocaleCode = (typeof locales)[number]["code"];

export function LanguageDropdown() {
  const t = useTranslations("nav.locale");
  const pathname = usePathname();
  const locale = useLocale() as LocaleCode;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = locales.find((l) => l.code === locale) ?? locales[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="locale-dropdown" ref={rootRef}>
      <button
        type="button"
        className="locale-dropdown-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("label")}
        onClick={() => setOpen((v) => !v)}
      >
        <LocaleFlag code={current.code} />
        <span className="locale-dropdown-current">{t(current.code)}</span>
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <ul className="locale-dropdown-panel" role="listbox" aria-label={t("label")}>
          {locales.map((l) => (
            <li key={l.code} role="option" aria-selected={locale === l.code}>
              <Link
                href={pathname}
                locale={l.code}
                prefetch={false}
                className={`locale-dropdown-option${locale === l.code ? " active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <LocaleFlag code={l.code} />
                <span>{t(l.code)}</span>
                {locale === l.code ? (
                  <span className="locale-dropdown-check" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function LocaleFlag({ code }: { code: LocaleCode }) {
  return (
    <svg
      className="locale-dropdown-flag"
      width="20"
      height="14"
      viewBox="0 0 20 14"
      aria-hidden
    >
      {code === "hy" ? (
        <>
          <rect width="20" height="4.667" fill="#D90012" />
          <rect y="4.667" width="20" height="4.667" fill="#0033A0" />
          <rect y="9.333" width="20" height="4.667" fill="#F2A800" />
        </>
      ) : null}
      {code === "ru" ? (
        <>
          <rect width="20" height="4.667" fill="#FFFFFF" />
          <rect y="4.667" width="20" height="4.667" fill="#0039A6" />
          <rect y="9.333" width="20" height="4.667" fill="#D52B1E" />
        </>
      ) : null}
      {code === "en" ? (
        <>
          <rect width="20" height="14" fill="#B22234" />
          <rect y="1.077" width="20" height="1.077" fill="#FFFFFF" />
          <rect y="3.231" width="20" height="1.077" fill="#FFFFFF" />
          <rect y="5.385" width="20" height="1.077" fill="#FFFFFF" />
          <rect y="7.538" width="20" height="1.077" fill="#FFFFFF" />
          <rect y="9.692" width="20" height="1.077" fill="#FFFFFF" />
          <rect y="11.846" width="20" height="1.077" fill="#FFFFFF" />
          <rect width="8" height="7.692" fill="#3C3B6E" />
          <g fill="#FFFFFF">
            <circle cx="1.6" cy="1.4" r="0.45" />
            <circle cx="3.2" cy="1.4" r="0.45" />
            <circle cx="4.8" cy="1.4" r="0.45" />
            <circle cx="6.4" cy="1.4" r="0.45" />
            <circle cx="2.4" cy="2.6" r="0.45" />
            <circle cx="4" cy="2.6" r="0.45" />
            <circle cx="5.6" cy="2.6" r="0.45" />
            <circle cx="1.6" cy="3.8" r="0.45" />
            <circle cx="3.2" cy="3.8" r="0.45" />
            <circle cx="4.8" cy="3.8" r="0.45" />
            <circle cx="6.4" cy="3.8" r="0.45" />
            <circle cx="2.4" cy="5" r="0.45" />
            <circle cx="4" cy="5" r="0.45" />
            <circle cx="5.6" cy="5" r="0.45" />
            <circle cx="1.6" cy="6.2" r="0.45" />
            <circle cx="3.2" cy="6.2" r="0.45" />
            <circle cx="4.8" cy="6.2" r="0.45" />
            <circle cx="6.4" cy="6.2" r="0.45" />
          </g>
        </>
      ) : null}
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`locale-dropdown-chevron${open ? " open" : ""}`}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
    >
      <path
        d="M2.5 4.5L6 8L9.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
