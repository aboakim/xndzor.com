"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { ActionIcon } from "@/components/AgIcons";
import { PrefetchLink } from "@/components/PrefetchLink";
import {
  MEGA_MENU_CATEGORIES,
  megaMenuAllSubs,
  type MegaMenuCategory,
} from "@/lib/categories-menu";
import { usePrefetchOnIntent } from "@/hooks/usePrefetchOnIntent";

type CategoriesMegaMenuProps = {
  open: boolean;
  onClose: () => void;
  /** Desktop dropdown vs mobile full-screen drawer */
  variant: "desktop" | "mobile";
};

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CategoryIconWrap({ icon, tone }: { icon: string; tone: string }) {
  return (
    <span className={`mega-menu-icon mega-menu-icon--${tone}`} aria-hidden>
      <ActionIcon action={icon} size={20} />
    </span>
  );
}

function SubGroups({
  cat,
  onNavigate,
}: {
  cat: MegaMenuCategory;
  onNavigate: () => void;
}) {
  const t = useTranslations("megaMenu");

  return (
    <div className="mega-menu-groups">
      {cat.groups.map((group) => (
        <div key={group.id} className="mega-menu-group">
          <h3 className="mega-menu-group-title">{t(`groups.${group.id}`)}</h3>
          <ul className="mega-menu-group-list">
            {group.subs.map((sub) => (
              <li key={sub.id}>
                <PrefetchLink
                  href={sub.href}
                  prefetch
                  className="mega-menu-sub-link"
                  onClick={onNavigate}
                >
                  {t(`subs.${sub.id}`)}
                </PrefetchLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="mega-menu-group mega-menu-group-all">
        <PrefetchLink
          href={cat.href}
          prefetch
          className="mega-menu-sub-link mega-menu-sub-all"
          onClick={onNavigate}
        >
          {t("allIn", { category: t(`categories.${cat.id}.label`) })}
        </PrefetchLink>
      </div>
    </div>
  );
}

export function CategoriesMegaMenu({ open, onClose, variant }: CategoriesMegaMenuProps) {
  const t = useTranslations("megaMenu");
  const { prefetch } = usePrefetchOnIntent();
  const menuId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const ignoreOutsideRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [desktopTop, setDesktopTop] = useState<number | null>(null);
  const [activeId, setActiveId] = useState(MEGA_MENU_CATEGORIES[0]?.id ?? "grow");
  const [expandedMobile, setExpandedMobile] = useState<string | null>(
    MEGA_MENU_CATEGORIES[0]?.id ?? "grow",
  );

  const active =
    MEGA_MENU_CATEGORIES.find((c) => c.id === activeId) ?? MEGA_MENU_CATEGORIES[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const hrefs = new Set<string>();
    for (const cat of MEGA_MENU_CATEGORIES) {
      hrefs.add(cat.href);
      for (const sub of megaMenuAllSubs(cat)) hrefs.add(sub.href);
    }
    for (const href of hrefs) prefetch(href);
  }, [open, prefetch]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    ignoreOutsideRef.current = true;
    const unlockOutside = window.setTimeout(() => {
      ignoreOutsideRef.current = false;
    }, 0);

    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    }

    function onPointer(e: MouseEvent | TouchEvent) {
      if (ignoreOutsideRef.current) return;
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.(".sections-btn, .nav-toggle")) return;
      handleClose();
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      window.clearTimeout(unlockOutside);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open, handleClose]);

  useEffect(() => {
    if (!open || variant !== "desktop") {
      setDesktopTop(null);
      return;
    }

    function syncTop() {
      const header = document.querySelector<HTMLElement>(".site-header");
      if (!header) return;
      setDesktopTop(header.getBoundingClientRect().bottom + 4);
    }

    syncTop();
    window.addEventListener("resize", syncTop);
    window.addEventListener("scroll", syncTop, true);
    return () => {
      window.removeEventListener("resize", syncTop);
      window.removeEventListener("scroll", syncTop, true);
    };
  }, [open, variant]);

  useEffect(() => {
    if (open) {
      setActiveId(MEGA_MENU_CATEGORIES[0]?.id ?? "grow");
      setExpandedMobile(MEGA_MENU_CATEGORIES[0]?.id ?? "grow");
    }
  }, [open]);

  useEffect(() => {
    document.body.classList.toggle("mega-menu-open", open);
    return () => document.body.classList.remove("mega-menu-open");
  }, [open]);

  if (!open || !mounted) return null;

  const desktopStyle =
    variant === "desktop" && desktopTop != null
      ? ({ top: `${desktopTop}px` } as const)
      : undefined;

  function renderOverlay(content: ReactNode) {
    return createPortal(content, document.body);
  }

  function onSidebarKey(e: KeyboardEvent<HTMLButtonElement>, id: string, index: number) {
    const buttons = panelRef.current?.querySelectorAll<HTMLButtonElement>(
      ".mega-menu-sidebar-item",
    );
    if (!buttons?.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      buttons[Math.min(index + 1, buttons.length - 1)]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      buttons[Math.max(index - 1, 0)]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      buttons[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      buttons[buttons.length - 1]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setActiveId(id);
    }
  }

  function toggleMobileAccordion(id: string) {
    setExpandedMobile((prev) => (prev === id ? null : id));
    setActiveId(id);
    const cat = MEGA_MENU_CATEGORIES.find((c) => c.id === id);
    if (cat) {
      prefetch(cat.href);
      for (const sub of megaMenuAllSubs(cat)) prefetch(sub.href);
    }
  }

  if (variant === "mobile") {
    return renderOverlay(
      <>
        <div
          ref={panelRef}
          id={menuId}
          className="mega-menu mega-menu--mobile"
          role="dialog"
          aria-modal="true"
          aria-label={t("title")}
        >
          <div className="mega-menu-mobile-head">
            <h2>{t("title")}</h2>
            <button type="button" className="mega-menu-close" onClick={handleClose}>
              <span className="sr-only">{t("close")}</span>
              <CloseIcon />
            </button>
          </div>
          <ul className="mega-menu-accordion">
            {MEGA_MENU_CATEGORIES.map((cat) => {
              const expanded = expandedMobile === cat.id;
              return (
                <li key={cat.id} className={expanded ? "is-expanded" : undefined}>
                  <button
                    type="button"
                    className="mega-menu-accordion-trigger"
                    aria-expanded={expanded}
                    onClick={() => toggleMobileAccordion(cat.id)}
                  >
                    <CategoryIconWrap icon={cat.icon} tone={cat.iconTone} />
                    <span className="mega-menu-cat-label">
                      {t(`categories.${cat.id}.label`)}
                    </span>
                    <ChevronRight
                      className={`mega-menu-chevron ${expanded ? "is-open" : ""}`}
                    />
                  </button>
                  <div className="mega-menu-accordion-panel" hidden={!expanded}>
                    <p className="mega-menu-desc">{t(`categories.${cat.id}.desc`)}</p>
                    <SubGroups cat={cat} onNavigate={handleClose} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <button
          type="button"
          className="mega-menu-backdrop"
          aria-label={t("close")}
          onClick={handleClose}
        />
      </>,
    );
  }

  return renderOverlay(
    <>
      <div
        ref={panelRef}
        id={menuId}
        className="mega-menu mega-menu--desktop"
        style={desktopStyle}
        role="dialog"
        aria-modal="false"
        aria-label={t("title")}
      >
        <nav className="mega-menu-sidebar" aria-label={t("title")}>
          <ul className="mega-menu-sidebar-list">
            {MEGA_MENU_CATEGORIES.map((cat, index) => {
              const isActive = cat.id === activeId;
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    className={`mega-menu-sidebar-item${isActive ? " is-active" : ""}`}
                    aria-current={isActive ? "true" : undefined}
                    onMouseEnter={() => {
                      setActiveId(cat.id);
                      prefetch(cat.href);
                    }}
                    onFocus={() => setActiveId(cat.id)}
                    onClick={() => setActiveId(cat.id)}
                    onKeyDown={(e) => onSidebarKey(e, cat.id, index)}
                  >
                    <CategoryIconWrap icon={cat.icon} tone={cat.iconTone} />
                    <span className="mega-menu-cat-label">
                      {t(`categories.${cat.id}.label`)}
                    </span>
                    <ChevronRight
                      className={`mega-menu-chevron${isActive ? " is-active" : ""}`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {active ? (
          <div className="mega-menu-panel" key={active.id}>
            <PrefetchLink
              href={active.href}
              prefetch
              className="mega-menu-panel-title"
              onClick={handleClose}
            >
              {t(`categories.${active.id}.label`)}
              <ChevronRight />
            </PrefetchLink>
            <p className="mega-menu-desc">{t(`categories.${active.id}.desc`)}</p>
            <SubGroups cat={active} onNavigate={handleClose} />
          </div>
        ) : null}
      </div>
      <button
        type="button"
        className="mega-menu-backdrop"
        aria-label={t("close")}
        onClick={handleClose}
        tabIndex={-1}
      />
    </>,
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
