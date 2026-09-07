"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type TouchEvent,
} from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type PromoTone = "pine" | "gold" | "wheat" | "sky" | "apple" | "sage";

type PromoSlide = {
  id: string;
  href: string;
  tone: PromoTone;
  icon: string;
  accents: string[];
};

/** Order mirrors homepage Top 5: Solve, Group buy, then farm helpers. */
const SLIDES: PromoSlide[] = [
  {
    id: "solve",
    href: "/features/solve",
    tone: "pine",
    icon: "✨",
    accents: ["🚜", "👷", "📋"],
  },
  {
    id: "groupBuy",
    href: "/group-buy/about",
    tone: "gold",
    icon: "🤝",
    accents: ["💰", "📦", "🌾"],
  },
  {
    id: "grow",
    href: "/features/grow",
    tone: "sage",
    icon: "🌱",
    accents: ["📊", "🍎", "🌿"],
  },
  {
    id: "passport",
    href: "/features/passport",
    tone: "wheat",
    icon: "🪪",
    accents: ["✅", "📱", "🏆"],
  },
  {
    id: "route",
    href: "/features/route",
    tone: "sky",
    icon: "🚛",
    accents: ["🛣️", "📍", "⏱️"],
  },
  {
    id: "match",
    href: "/matches",
    tone: "apple",
    icon: "🔗",
    accents: ["👨‍🌾", "🛒", "🎯"],
  },
];

const AUTO_MS = 4500;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return reduced;
}

export function HeroPromoSlider() {
  const t = useTranslations("xndzor.promoSlider");
  const reduced = usePrefersReducedMotion();
  const labelId = useId();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const count = SLIDES.length;
  const goTo = useCallback(
    (i: number) => setIndex(((i % count) + count) % count),
    [count],
  );
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (reduced || paused || count <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [reduced, paused, count]);

  const onTouchStart = (e: TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (touchX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 48) return;
    if (dx < 0) next();
    else prev();
  };

  return (
    <section
      className={`xz-promo-slider${reduced ? " is-static" : ""}`}
      aria-roledescription="carousel"
      aria-labelledby={labelId}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <p id={labelId} className="sr-only">
        {t("ariaLabel")}
      </p>

      <div className="xz-promo-slider-viewport">
        <div
          className="xz-promo-slider-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
          aria-live={paused || reduced ? "polite" : "off"}
        >
          {SLIDES.map((slide, i) => {
            const isActive = i === index;
            const highlights = t.raw(`items.${slide.id}.highlights`) as string[];

            return (
              <div
                key={slide.id}
                className={`xz-promo-slide xz-promo-slide-${slide.tone}${isActive ? " is-active" : ""}`}
                role="group"
                aria-roledescription="slide"
                aria-label={t("slideOf", { current: i + 1, total: count })}
                aria-hidden={!isActive}
              >
                <span className="xz-promo-slide-glow" aria-hidden />
                <span className="xz-promo-slide-pattern" aria-hidden />
                <span className="xz-promo-slide-shape xz-promo-shape-a" aria-hidden />
                <span className="xz-promo-slide-shape xz-promo-shape-b" aria-hidden />
                <span className="xz-promo-slide-sheen" aria-hidden />

                <div className="xz-promo-slide-accents" aria-hidden>
                  {slide.accents.map((emoji, ai) => (
                    <span
                      key={emoji}
                      className={`xz-promo-accent xz-promo-accent-${ai + 1}`}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>

                <div className="xz-promo-slide-body">
                  <div className="xz-promo-slide-icon-wrap">
                    <span className="xz-promo-slide-icon-ring" aria-hidden />
                    <span className="xz-promo-slide-icon xz-promo-icon-float" aria-hidden>
                      {slide.icon}
                    </span>
                  </div>

                  <div className="xz-promo-slide-copy">
                    <span className="xz-promo-slide-badge xz-promo-reveal xz-promo-reveal-1">
                      {t(`items.${slide.id}.badge`)}
                    </span>
                    <strong className="xz-promo-slide-title xz-promo-reveal xz-promo-reveal-2">
                      {t(`items.${slide.id}.title`)}
                    </strong>
                    <p className="xz-promo-slide-hook xz-promo-reveal xz-promo-reveal-3">
                      {t(`items.${slide.id}.hook`)}
                    </p>
                    <ul className="xz-promo-slide-highlights xz-promo-reveal xz-promo-reveal-4">
                      {highlights.map((item) => (
                        <li key={item} className="xz-promo-chip">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="xz-promo-slide-aside">
                    <div className="xz-promo-slide-stat xz-promo-stat-pulse">
                      <span className="xz-promo-stat-value">
                        {t(`items.${slide.id}.stat.value`)}
                      </span>
                      <span className="xz-promo-stat-label">
                        {t(`items.${slide.id}.stat.label`)}
                      </span>
                    </div>
                    <Link
                      href={slide.href}
                      className="xz-promo-slide-cta xz-promo-cta-shimmer"
                      tabIndex={isActive ? 0 : -1}
                    >
                      {t("cta")}
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="xz-promo-slider-controls">
        <button
          type="button"
          className="xz-promo-nav xz-promo-nav-prev"
          onClick={prev}
          aria-label={t("prev")}
        >
          <span aria-hidden>‹</span>
        </button>

        <div className="xz-promo-dots" role="tablist" aria-label={t("ariaLabel")}>
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              className={`xz-promo-dot${i === index ? " is-active" : ""}`}
              aria-selected={i === index}
              aria-label={t("goTo", { n: i + 1 })}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        <button
          type="button"
          className="xz-promo-nav xz-promo-nav-next"
          onClick={next}
          aria-label={t("next")}
        >
          <span aria-hidden>›</span>
        </button>
      </div>
    </section>
  );
}
