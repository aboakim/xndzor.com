"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const links = [
  { href: "/admin", key: "dashboard" as const, exact: true },
  { href: "/admin/users", key: "users" as const },
  { href: "/admin/listings", key: "listings" as const },
  { href: "/admin/payments", key: "payments" as const },
  { href: "/admin/plans", key: "plans" as const },
];

export function AdminSidebar() {
  const t = useTranslations("admin");
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-head">
        <strong>{t("title")}</strong>
        <span className="tiny muted">{t("subtitle")}</span>
      </div>
      <nav className="admin-nav" aria-label={t("title")}>
        {links.map((link) => {
          const active =
            link.exact
              ? pathname === link.href || pathname === `${link.href}/`
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={active ? "admin-nav-link active" : "admin-nav-link"}
            >
              {t(link.key)}
            </Link>
          );
        })}
      </nav>
      <Link href="/" className="admin-nav-link admin-nav-back">
        ← {t("backToSite")}
      </Link>
    </aside>
  );
}
