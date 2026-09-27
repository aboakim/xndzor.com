"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { Link, usePathname } from "@/i18n/navigation";

const links = [
  { href: "/admin", key: "dashboard" as const, exact: true },
  { href: "/admin/users", key: "users" as const },
  { href: "/admin/listings", key: "listings" as const },
  { href: "/admin/plots", key: "plots" as const },
  { href: "/admin/payments", key: "payments" as const },
  { href: "/admin/plans", key: "plans" as const },
];

export function AdminSidebar() {
  const t = useTranslations("admin");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  const isActive = (link: (typeof links)[number]) =>
    link.exact
      ? pathname === link.href || pathname === `${link.href}/`
      : pathname.startsWith(link.href);

  const current = links.find(isActive) ?? links[0];

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = nav.querySelector<HTMLElement>(".admin-nav-link.active");
    active?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [pathname]);

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-head">
        <strong>{t("title")}</strong>
        <span className="tiny muted">{t("subtitle")}</span>
      </div>

      {/* Compact bar: on phones this is the admin header, hidden on desktop. */}
      <div className="admin-sidebar-bar">
        <span className="admin-sidebar-id">
          <span className="admin-sidebar-eyebrow">{t("title")}</span>
          <span className="admin-sidebar-current">{t(current.key)}</span>
        </span>
        <div className="admin-sidebar-actions">
          <Link href="/" className="admin-exit">
            {t("backToSite")}
          </Link>
          <button
            type="button"
            className="admin-logout"
            onClick={() => signOut({ callbackUrl: `/${locale}` })}
          >
            {tNav("logout")}
          </button>
        </div>
      </div>

      <div className="admin-nav-scroll" data-scroll-hint>
        <nav ref={navRef} className="admin-nav" aria-label={t("sectionsLabel")}>
        {links.map((link) => {
          const active = isActive(link);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={active ? "admin-nav-link active" : "admin-nav-link"}
            >
              {t(link.key)}
            </Link>
          );
        })}
        </nav>
      </div>

      <Link href="/" className="admin-nav-link admin-nav-back">
        ← {t("backToSite")}
      </Link>
    </aside>
  );
}
