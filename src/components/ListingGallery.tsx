"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent,
} from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

const SWIPE_THRESHOLD = 48;
const ZOOM_SCALE = 2.4;

export function ListingGallery({ images }: { images: string[] }) {
  const t = useTranslations("images");
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const skipClick = useRef(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const count = images.length;
  const multi = count > 1;

  const goTo = useCallback(
    (i: number) => {
      if (count === 0) return;
      setActive(((i % count) + count) % count);
    },
    [count],
  );
  const prev = useCallback(() => goTo(active - 1), [goTo, active]);
  const next = useCallback(() => goTo(active + 1), [goTo, active]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      else if (e.key === "ArrowLeft" && multi) {
        e.preventDefault();
        goTo(active - 1);
      } else if (e.key === "ArrowRight" && multi) {
        e.preventDefault();
        goTo(active + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, multi, active, goTo]);

  function onMainKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!multi) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setLightboxOpen(true);
    }
  }

  function onTouchStart(e: TouchEvent) {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(e: TouchEvent) {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null || !multi) return;
    const dx = (e.changedTouches[0]?.clientX ?? start) - start;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    skipClick.current = true;
    if (dx < 0) next();
    else prev();
  }

  function openLightbox() {
    if (skipClick.current) {
      skipClick.current = false;
      return;
    }
    setLightboxOpen(true);
  }

  if (count === 0) {
    return <div className="listing-card-placeholder large">{t("none")}</div>;
  }

  return (
    <div className="detail-gallery">
      <div
        ref={mainRef}
        className="gallery-main"
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label={t("galleryLabel")}
        onKeyDown={onMainKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button
          type="button"
          className="gallery-main-hit"
          onClick={openLightbox}
          aria-label={t("zoomOpen")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[active]}
            alt={t("previewAlt", { n: active + 1 })}
            className="detail-image"
            draggable={false}
          />
        </button>

        {multi && (
          <>
            <button
              type="button"
              className="gallery-nav gallery-nav-prev"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label={t("prevPhoto")}
            >
              <ChevronIcon dir="left" />
            </button>
            <button
              type="button"
              className="gallery-nav gallery-nav-next"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label={t("nextPhoto")}
            >
              <ChevronIcon dir="right" />
            </button>
          </>
        )}

        <button
          type="button"
          className="gallery-zoom-btn"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxOpen(true);
          }}
          aria-label={t("zoomOpen")}
        >
          <ZoomIcon />
        </button>

        {multi && (
          <span className="gallery-counter" aria-hidden>
            {active + 1} / {count}
          </span>
        )}
      </div>

      {multi && (
        <ul className="gallery-thumbs" aria-label={t("previewLabel")}>
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                className={i === active ? "active" : undefined}
                onClick={() => setActive(i)}
                aria-label={t("previewAlt", { n: i + 1 })}
                aria-current={i === active ? "true" : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {mounted && lightboxOpen
        ? createPortal(
            <GalleryLightbox
              images={images}
              active={active}
              onClose={() => setLightboxOpen(false)}
              onPrev={prev}
              onNext={next}
              onSelect={setActive}
              labels={{
                close: t("zoomClose"),
                prev: t("prevPhoto"),
                next: t("nextPhoto"),
                zoomIn: t("zoomIn"),
                zoomOut: t("zoomOut"),
                label: t("lightboxLabel"),
                alt: (n) => t("previewAlt", { n }),
                thumbs: t("previewLabel"),
              }}
            />,
            document.body,
          )
        : null}
    </div>
  );
}

type LightboxLabels = {
  close: string;
  prev: string;
  next: string;
  zoomIn: string;
  zoomOut: string;
  label: string;
  alt: (n: number) => string;
  thumbs: string;
};

function GalleryLightbox({
  images,
  active,
  onClose,
  onPrev,
  onNext,
  onSelect,
  labels,
}: {
  images: string[];
  active: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (i: number) => void;
  labels: LightboxLabels;
}) {
  const multi = images.length > 1;
  const [zoomed, setZoomed] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setZoomed(false);
    setOffset({ x: 0, y: 0 });
  }, [active]);

  function closeFromBackdrop(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function toggleZoom(e?: MouseEvent) {
    if (zoomed) {
      setZoomed(false);
      setOffset({ x: 0, y: 0 });
      return;
    }
    setZoomed(true);
    if (e && stageRef.current) {
      const rect = stageRef.current.getBoundingClientRect();
      const cx = e.clientX - rect.left - rect.width / 2;
      const cy = e.clientY - rect.top - rect.height / 2;
      setOffset({ x: -cx * 0.35, y: -cy * 0.35 });
    }
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!zoomed) return;
    if ((e.target as HTMLElement).tagName !== "IMG") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: offset.x,
      origY: offset.y,
      moved: false,
    };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
    setOffset({ x: d.origX + dx, y: d.origY + dy });
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (d.moved) suppressClick.current = true;
    drag.current = null;
  }

  function onTouchStart(e: TouchEvent) {
    if (zoomed) return;
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(e: TouchEvent) {
    if (zoomed) return;
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null || !multi) return;
    const dx = (e.changedTouches[0]?.clientX ?? start) - start;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dx < 0) onNext();
    else onPrev();
  }

  return (
    <div
      className="gallery-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={labels.label}
      onClick={closeFromBackdrop}
    >
      <div className="gallery-lightbox-chrome">
        <button
          type="button"
          className="gallery-lightbox-close"
          onClick={onClose}
          aria-label={labels.close}
        >
          <CloseIcon />
        </button>
        <button
          type="button"
          className="gallery-lightbox-zoom-toggle"
          onClick={() => {
            if (zoomed) {
              setZoomed(false);
              setOffset({ x: 0, y: 0 });
            } else {
              setZoomed(true);
            }
          }}
          aria-label={zoomed ? labels.zoomOut : labels.zoomIn}
        >
          {zoomed ? <ZoomOutIcon /> : <ZoomIcon />}
        </button>
      </div>

      {multi && (
        <>
          <button
            type="button"
            className="gallery-lightbox-nav gallery-lightbox-prev"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label={labels.prev}
          >
            <ChevronIcon dir="left" />
          </button>
          <button
            type="button"
            className="gallery-lightbox-nav gallery-lightbox-next"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label={labels.next}
          >
            <ChevronIcon dir="right" />
          </button>
        </>
      )}

      <div
        ref={stageRef}
        className={`gallery-lightbox-stage${zoomed ? " is-zoomed" : ""}`}
        onClick={() => {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          if (zoomed) {
            setZoomed(false);
            setOffset({ x: 0, y: 0 });
          } else {
            onClose();
          }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active]}
          alt={labels.alt(active + 1)}
          className="gallery-lightbox-image"
          draggable={false}
          onClick={(e) => {
            e.stopPropagation();
            if (suppressClick.current) {
              suppressClick.current = false;
              return;
            }
            toggleZoom(e);
          }}
          style={
            zoomed
              ? {
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${ZOOM_SCALE})`,
                }
              : undefined
          }
        />
      </div>

      {multi && (
        <div className="gallery-lightbox-footer" onClick={(e) => e.stopPropagation()}>
          <span className="gallery-lightbox-counter" aria-live="polite">
            {active + 1} / {images.length}
          </span>
          <ul className="gallery-lightbox-thumbs" aria-label={labels.thumbs}>
            {images.map((src, i) => (
              <li key={src}>
                <button
                  type="button"
                  className={i === active ? "active" : undefined}
                  onClick={() => onSelect(i)}
                  aria-label={labels.alt(i + 1)}
                  aria-current={i === active ? "true" : undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ZoomIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M16 16l5 5M10.5 7.5v6M7.5 10.5h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M16 16l5 5M7.5 10.5h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
