"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { IconBuy, IconForward, IconOrderJob, IconPlot, IconToday } from "@/components/AgIcons";

const TABS = [
  { href: "/", key: "home" as const, Icon: IconToday, match: (p: string) => p === "/" },
  {
    href: "/plots",
    key: "plots" as const,
    Icon: IconPlot,
    match: (p: string) => p.startsWith("/plots"),
  },
  {
    href: "/forward",
    key: "sellCrop" as const,
    Icon: IconForward,
    match: (p: string) => p.startsWith("/forward") || p.startsWith("/supply"),
  },
  {
    href: "/demand",
    key: "findBuyer" as const,
    Icon: IconBuy,
    match: (p: string) => p.startsWith("/demand"),
  },
  {
    href: "/jobs",
    key: "jobsShort" as const,
    Icon: IconOrderJob,
    match: (p: string) =>
      p.startsWith("/jobs") || p.startsWith("/providers") || p.startsWith("/group-buy"),
  },
];

export function MobileTabBar() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav className="mobile-tab-bar" aria-label="Main">
      {TABS.map(({ href, key, Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={key}
            href={href}
            className={`mobile-tab ${active ? "is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={22} />
            <span>{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
