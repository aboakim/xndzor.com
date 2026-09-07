"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { signOut, useSession } from "next-auth/react";
import { IconApple } from "@/components/AgIcons";
import { CategoriesMegaMenu } from "@/components/CategoriesMegaMenu";
import { LanguageDropdown } from "@/components/LanguageDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchBar } from "@/components/SearchBar";
import { useMinWidth901 } from "@/hooks/useMinWidth901";

export function Header() {
  const t = useTranslations("nav");
  const brand = useTranslations();
  const pathname = usePathname();
  const locale = useLocale();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const isDesktop = useMinWidth901();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  /** Post ad = sell listing (classifieds clarity), not farm-OS plot create. */
  const postHref = session ? "/supply/new" : "/auth/login";

  return (
    <header className={`site-header vendo-header village-header${menuOpen ? " mega-menu-active" : ""}`}>
      <div className="header-utility">
        <div className="header-utility-inner">
          <span className="utility-brand">{brand("brandLatin")}</span>

          <div className="utility-right">
            <ThemeToggle />
            <LanguageDropdown />

            <nav className="utility-nav" aria-label={t("utilityNav")}>
              <Link href="/help" className="utility-link">
                {t("help")}
              </Link>
              {session ? (
                <>
                  <Link href="/security" className="utility-link">
                    {t("security")}
                  </Link>
                  <Link href="/pricing" className="utility-link utility-pro">
                    {t("pricing")}
                  </Link>
                  <span className="utility-sep" aria-hidden />
                  <Link href="/farm" className="utility-link">
                    {t("myFarm")}
                  </Link>
                  <Link href="/today" className="utility-link">
                    {t("today")}
                  </Link>
                  <Link href="/farms/me" className="utility-link">
                    {t("myPassport")}
                  </Link>
                  <Link href="/account/listings" className="utility-link">
                    {t("myListings")}
                  </Link>
                  <Link href="/account/profile" className="utility-link">
                    {t("profile")}
                  </Link>
                  <Link href="/account/billing" className="utility-link">
                    {t("billing")}
                  </Link>
                </>
              ) : (
                <Link href="/pricing" className="utility-link utility-pro">
                  {t("pricing")}
                </Link>
              )}
            </nav>

            <div className="utility-auth-group utility-auth-desktop">
              {session ? (
                <button
                  type="button"
                  className="utility-btn utility-btn-ghost"
                  onClick={() => signOut({ callbackUrl: `/${locale}` })}
                >
                  {t("logout")}
                </button>
              ) : (
                <Link href="/auth/login" className="utility-btn utility-btn-ghost">
                  {t("login")}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="header-main">
        <div className="header-inner header-brand-row">
          <Link href="/" className="logo">
            <span className="logo-mark" aria-hidden>
              <IconApple size={32} />
            </span>
            <span className="logo-text">
              <strong>{brand("brand")}</strong>
              {brand("brandLatin") !== brand("brand") ? (
                <em>{brand("brandLatin")}</em>
              ) : null}
            </span>
          </Link>

          <button
            type="button"
            className="btn sections-btn"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MenuIcon />
            <span>{t("sections")}</span>
          </button>

          <div className="header-search-slot">
            <SearchBar header />
          </div>

          <div className="header-actions">
            {session ? (
              <button
                type="button"
                className="btn header-login-btn header-auth-main"
                onClick={() => signOut({ callbackUrl: `/${locale}` })}
              >
                {t("logout")}
              </button>
            ) : (
              <Link href="/auth/login" className="btn header-login-btn header-auth-main">
                {t("login")}
              </Link>
            )}

            <Link href={postHref} className="btn btn-add header-post-cta">
              + {t("post")}
            </Link>
          </div>

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="nav-toggle-bars" aria-hidden />
            <span className="sr-only">{menuOpen ? "Close" : "Menu"}</span>
          </button>
        </div>

        <CategoriesMegaMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          variant={isDesktop ? "desktop" : "mobile"}
        />
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
