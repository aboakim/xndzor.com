"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function ListingGallery({ images }: { images: string[] }) {
  const t = useTranslations("images");
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return <div className="listing-card-placeholder large">{t("none")}</div>;
  }

  return (
    <div className="detail-gallery">
      <div className="gallery-main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active]} alt="" className="detail-image" />
      </div>
      {images.length > 1 && (
        <ul className="gallery-thumbs">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                className={i === active ? "active" : undefined}
                onClick={() => setActive(i)}
                aria-label={`${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
