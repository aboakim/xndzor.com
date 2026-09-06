"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type PastelTone = "peach" | "mint" | "sky" | "lemon" | "cream";

type FeatureCard = {
  id: "groupBuy" | "solve" | "grow" | "route" | "passport";
  href: string;
  tone: PastelTone;
  icon: string;
};

const CARDS: FeatureCard[] = [
  { id: "groupBuy", href: "/group-buy/about", tone: "peach", icon: "🤝" },
  { id: "solve", href: "/features/solve", tone: "mint", icon: "✨" },
  { id: "grow", href: "/features/grow", tone: "lemon", icon: "🌱" },
  { id: "route", href: "/features/route", tone: "sky", icon: "🚛" },
  { id: "passport", href: "/features/passport", tone: "cream", icon: "🪪" },
];

function ScrollArrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={dir === "prev" ? "M14 6l-6 6 6 6" : "M10 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Soft pastel promo row (vendo-style) — light cards with illustration pops.
 * Replaces the heavy green banner stack + competing hero slider.
 */
export function PastelFeatureCards() {
  const t = useTranslations("xndzor.pastelCards");
  const tPromo = useTranslations("xndzor.promoSlider");
  const labelId = useId();
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = useCallback((dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const step = Math.min(280, el.clientWidth * 0.7);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (el.scrollWidth <= el.clientWidth + 8) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <section className="pastel-features" aria-labelledby={labelId}>
      <div className="pastel-features-head">
        <h2 id={labelId} className="pastel-features-title">
          {t("sectionTitle")}
        </h2>
        <p className="pastel-features-lede">{t("sectionLede")}</p>
      </div>

      <div className="pastel-features-shell">
        <button
          type="button"
          className="pastel-features-nav pastel-features-nav-prev"
          aria-label={tPromo("prev")}
          onClick={() => scrollBy(-1)}
        >
          <ScrollArrow dir="prev" />
        </button>

        <div className="pastel-features-track" ref={trackRef} role="list">
          {CARDS.map((card) => (
            <article
              key={card.id}
              className={`pastel-card pastel-card--${card.tone}`}
              role="listitem"
            >
              <div className="pastel-card-copy">
                <strong className="pastel-card-title">
                  {tPromo(`items.${card.id}.title`)}
                </strong>
                <p className="pastel-card-hook">{tPromo(`items.${card.id}.hook`)}</p>
                <Link href={card.href} className="pastel-card-cta">
                  {tPromo("cta")}
                  <span aria-hidden>→</span>
                </Link>
              </div>
              <span className="pastel-card-illust" aria-hidden>
                {card.icon}
              </span>
            </article>
          ))}
        </div>

        <button
          type="button"
          className="pastel-features-nav pastel-features-nav-next"
          aria-label={tPromo("next")}
          onClick={() => scrollBy(1)}
        >
          <ScrollArrow dir="next" />
        </button>
      </div>
    </section>
  );
}
