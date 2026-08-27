"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { signOut, useSession } from "next-auth/react";
import { ActionIcon } from "@/components/AgIcons";

const locales = [
  { code: "hy", label: "ՀԱՅ" },
  { code: "ru", label: "РУС" },
  { code: "en", label: "ENG" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const brand = useTranslations();
  const pathname = usePathname();
  const locale = useLocale();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("nav-open", open);
    return () => document.body.classList.remove("nav-open");
  }, [open]);

  const postHref = session ? "/plots/new" : "/auth/login";

  return (
    <header className="site-header list-style-header">
      <div className="header-utility">
        <div className="header-utility-inner">
          <span className="utility-brand">{brand("brandLatin")}</span>
          <div className="utility-right">
            <div className="locale-switch" role="navigation" aria-label="Language">
              {locales.map((l) => (
                <Link
                  key={l.code}
                  href={pathname}
                  locale={l.code}
                  className={locale === l.code ? "active" : undefined}
                  prefetch={false}
                >
                  {l.label}
                </Link>
              ))}
            </div>
            {session ? (
              <>
                <Link href="/pricing" className="utility-link utility-pro">
                  {t("pricing")}
                </Link>
                <Link href="/farms/me" className="utility-link">
                  {t("myPassport")}
                </Link>
                <Link href="/account/billing" className="utility-link">
                  {t("billing")}
                </Link>
                <button
                  type="button"
                  className="linkish utility-auth"
                  onClick={() => signOut({ callbackUrl: `/${locale}` })}
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <Link href="/pricing" className="utility-link">
                  {t("pricing")}
                </Link>
                <Link href="/auth/login" className="utility-link">
                  {t("login")}
                </Link>
                <Link href="/auth/register" className="utility-link">
                  {t("register")}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="header-inner">
        <Link href="/" className="logo">
          <span className="logo-mark" aria-hidden>
            <ActionIcon action="plot" size={20} />
          </span>
          <span className="logo-text">
            <strong>{brand("brand")}</strong>
            <em>FarmOS</em>
          </span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="main-nav-drawer"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="nav-toggle-bars" aria-hidden />
          <span className="sr-only">{open ? "Close" : "Menu"}</span>
        </button>

        <nav
          id="main-nav-drawer"
          className={`main-nav ${open ? "is-open" : ""}`}
          aria-label="Main"
        >
          <Link href="/" className="nav-item nav-drawer-only" onClick={() => setOpen(false)}>
            {t("home")}
          </Link>
          <Link href="/farms/me" className="nav-item nav-drawer-only" onClick={() => setOpen(false)}>
            {t("myPassport")}
          </Link>
          <Link href="/grow" className="nav-item" onClick={() => setOpen(false)}>
            {t("grow")}
          </Link>
          <Link href="/plots" className="nav-item nav-drawer-only" onClick={() => setOpen(false)}>
            {t("plots")}
          </Link>
          <Link href="/forward" className="nav-item nav-drawer-only" onClick={() => setOpen(false)}>
            {t("forward")}
          </Link>
          <Link href="/demand" className="nav-item nav-drawer-only" onClick={() => setOpen(false)}>
            {t("demand")}
          </Link>
          <Link href="/supply" className="nav-item nav-drawer-only" onClick={() => setOpen(false)}>
            {t("supply")}
          </Link>
          <Link href="/jobs" className="nav-item nav-drawer-only" onClick={() => setOpen(false)}>
            {t("jobs")}
          </Link>
          <Link href="/machinery" className="nav-item nav-drawer-only" onClick={() => setOpen(false)}>
            {t("machinery")}
          </Link>
          <Link href="/animals" className="nav-item nav-drawer-only" onClick={() => setOpen(false)}>
            {t("animals")}
          </Link>
          <Link href="/shop/fertilizers" className="nav-item nav-drawer-only" onClick={() => setOpen(false)}>
            {t("fertilizers")}
          </Link>
          <Link href="/shop/seeds" className="nav-item nav-drawer-only" onClick={() => setOpen(false)}>
            {t("seeds")}
          </Link>
          <Link href="/shop/feed" className="nav-item nav-drawer-only" onClick={() => setOpen(false)}>
            {t("feed")}
          </Link>
          <Link href="/shop/chemicals" className="nav-item nav-drawer-only" onClick={() => setOpen(false)}>
            {t("chemicals")}
          </Link>
          <Link href="/shop/tools" className="nav-item nav-drawer-only" onClick={() => setOpen(false)}>
            {t("tools")}
          </Link>
          <Link href="/shop/land" className="nav-item nav-drawer-only" onClick={() => setOpen(false)}>
            {t("land")}
          </Link>
          <Link href="/group-buy" className="nav-item nav-drawer-only" onClick={() => setOpen(false)}>
            {t("groupBuy")}
          </Link>
          <div className="locale-switch locale-mobile" role="navigation" aria-label="Language">
            {locales.map((l) => (
              <Link
                key={l.code}
                href={pathname}
                locale={l.code}
                className={locale === l.code ? "active" : undefined}
                prefetch={false}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>

        <Link href={postHref} className="btn primary header-post-cta">
          {t("post")}
        </Link>
      </div>
      {open ? (
        <button
          type="button"
          className="nav-backdrop"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </header>
  );
}
