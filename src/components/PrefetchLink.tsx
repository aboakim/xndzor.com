"use client";

import { forwardRef, useState, type ComponentProps, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { usePrefetchOnIntent } from "@/hooks/usePrefetchOnIntent";

type PrefetchLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  /** Adds tap/press visual feedback (scale + opacity). */
  pressable?: boolean;
};

/** Internal navigation link with intent-based prefetch and optional press feedback. */
export const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(function PrefetchLink(
  {
    href,
    children,
    className,
    pressable = false,
    prefetch = true,
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    onMouseEnter,
    onFocus,
    onTouchStart,
    ...rest
  },
  ref,
) {
  const { prefetch: doPrefetch, bind } = usePrefetchOnIntent();
  const hrefStr = typeof href === "string" ? href : (href.pathname ?? "");
  const intent = bind(hrefStr);
  const [pressed, setPressed] = useState(false);

  const mergedClass = [className, pressable && pressed ? "is-pressed" : ""]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <Link
      ref={ref}
      href={href}
      prefetch={prefetch}
      className={mergedClass}
      onMouseEnter={(e) => {
        intent.onMouseEnter();
        onMouseEnter?.(e);
      }}
      onFocus={(e) => {
        intent.onFocus();
        onFocus?.(e);
      }}
      onTouchStart={(e) => {
        intent.onTouchStart();
        onTouchStart?.(e);
      }}
      onPointerDown={(e) => {
        if (pressable) setPressed(true);
        doPrefetch(hrefStr);
        onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        if (pressable) setPressed(false);
        onPointerUp?.(e);
      }}
      onPointerLeave={(e) => {
        if (pressable) setPressed(false);
        onPointerLeave?.(e);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
});
