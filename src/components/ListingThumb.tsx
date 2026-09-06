"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type ListingThumbProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  fallback?: ReactNode;
  placeholderClassName?: string;
};

/** Photo with category-colored placeholder when the file is missing or fails to load. */
export function ListingThumb({
  src,
  alt = "",
  className,
  fallback,
  placeholderClassName = "listing-card-placeholder",
}: ListingThumbProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    if (!fallback) return null;
    return <div className={placeholderClassName}>{fallback}</div>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      sizes="(max-width: 640px) 46vw, (max-width: 1100px) 22vw, 200px"
      onError={() => setFailed(true)}
    />
  );
}
