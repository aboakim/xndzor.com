"use client";

import { useCallback, useEffect, useRef } from "react";
import { ActionIcon } from "@/components/AgIcons";
import { PrefetchLink } from "@/components/PrefetchLink";
import { usePrefetchOnIntent } from "@/hooks/usePrefetchOnIntent";

export type CategoryItem = {
  href: string;
  action: string;
  label: string;
};

function CategoryScrollItem({ cat }: { cat: CategoryItem }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const { prefetch } = usePrefetchOnIntent();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) prefetch(cat.href);
      },
      { rootMargin: "120px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cat.href, prefetch]);

  return (
    <PrefetchLink
      ref={ref}
      href={cat.href}
      prefetch
      pressable
      className="category-scroll-item"
      role="listitem"
    >
      <span className={`cat-icon action-${cat.action}`} aria-hidden>
        <ActionIcon action={cat.action} size={22} />
      </span>
      <span className="category-scroll-label">{cat.label}</span>
    </PrefetchLink>
  );
}

function ScrollArrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={dir === "prev" ? "M14 6l-6 6 6 6" : "M10 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Horizontal scroll row of ag category pills (vendo-style) with arrow nav. */
export function CategoryScroll({ items }: { items: CategoryItem[] }) {
  const { prefetch } = usePrefetchOnIntent();
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    for (const cat of items) prefetch(cat.href);
  }, [items, prefetch]);

  const scrollBy = useCallback((dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const step = Math.min(240, el.clientWidth * 0.65);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }, []);

  return (
    <div className="category-scroll-wrap">
      <button
        type="button"
        className="category-scroll-nav category-scroll-nav-prev"
        aria-label="Previous"
        onClick={() => scrollBy(-1)}
      >
        <ScrollArrow dir="prev" />
      </button>
      <div className="category-scroll motion-chip-stagger" role="list" ref={trackRef}>
        {items.map((cat) => (
          <CategoryScrollItem key={cat.href + cat.action} cat={cat} />
        ))}
      </div>
      <button
        type="button"
        className="category-scroll-nav category-scroll-nav-next"
        aria-label="Next"
        onClick={() => scrollBy(1)}
      >
        <ScrollArrow dir="next" />
      </button>
    </div>
  );
}
