"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger direct children with CSS delays when visible */
  stagger?: boolean;
  /** Extra delay before the reveal transition starts (ms) */
  delayMs?: number;
  as?: ElementType;
  id?: string;
  /** IntersectionObserver threshold */
  threshold?: number;
};

/**
 * Scroll-into-view fade/rise. GPU-friendly (opacity + translateY only).
 * Honors prefers-reduced-motion by showing content immediately.
 */
export function Reveal({
  children,
  className = "",
  stagger = false,
  delayMs = 0,
  as: Tag = "div",
  id,
  threshold = 0.12,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    // Already in view on mount (above-fold): reveal without waiting for scroll
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  const style: CSSProperties | undefined =
    delayMs > 0 ? ({ ["--reveal-delay" as string]: `${delayMs}ms` } as CSSProperties) : undefined;

  return (
    <Tag
      ref={ref as never}
      id={id}
      className={`motion-reveal${stagger ? " motion-stagger" : ""} ${visible ? "is-in" : ""} ${className}`.trim()}
      style={style}
    >
      {children}
    </Tag>
  );
}
