"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { SolutionBundle, SolutionMode } from "@/lib/xndzor-solution";
import { SolutionBundleCard } from "./SolutionBundle";
import { GroupOrderCard } from "./GroupOrderCard";
import { XndzorRouteSection } from "./XndzorRouteSection";

const QUICK_LINKS = [
  { href: "/grow", icon: "🌱", labelKey: "grow" as const },
  { href: "/forward", icon: "🍎", labelKey: "forward" as const },
  { href: "/supply", icon: "📦", labelKey: "sellNow" as const },
  { href: "/group-buy", icon: "🤝", labelKey: "groupBuy" as const },
] as const;

const TRUST_BADGES = ["verified", "amd", "exclusive"] as const;

const NEED_CHIPS = [
  { emoji: "🚜", key: "harvest" as const },
  { emoji: "🔧", key: "tractor" as const },
  { emoji: "👷", key: "workers" as const },
  { emoji: "🌱", key: "seed" as const },
  { emoji: "🧪", key: "fertilizer" as const },
  { emoji: "🚛", key: "truck" as const },
  { emoji: "🏭", key: "warehouse" as const },
  { emoji: "🛒", key: "buyer" as const },
  { emoji: "🎓", key: "agronomist" as const },
  { emoji: "💧", key: "irrigation" as const },
] as const;

const HAVE_CHIPS = [
  { emoji: "🍎", key: "crop" as const },
  { emoji: "🚜", key: "equipment" as const },
  { emoji: "👷", key: "workers" as const },
  { emoji: "🏭", key: "warehouse" as const },
  { emoji: "🚛", key: "truck" as const },
  { emoji: "🌾", key: "services" as const },
] as const;

type XndzorHeroProps = {
  greeting?: string;
};

export function XndzorHero({ greeting }: XndzorHeroProps) {
  const t = useTranslations("xndzor");
  const tMenu = useTranslations("menu");
  const tTrust = useTranslations("xndzor.welcomeTrust");
  const locale = useLocale();
  const [mode, setMode] = useState<SolutionMode>("need");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [bundle, setBundle] = useState<SolutionBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFeatures, setShowFeatures] = useState(false);

  const chips = mode === "need" ? NEED_CHIPS : HAVE_CHIPS;

  const applyChip = useCallback(
    (key: string) => {
      const chipText = t(`chips.${mode}.${key}` as "chips.need.harvest");
      setText(chipText);
      setBundle(null);
      setShowFeatures(false);
    },
    [mode, t],
  );

  const findSolution = useCallback(async () => {
    const query = text.trim();
    if (!query) return;

    setLoading(true);
    setError(null);
    setBundle(null);
    setShowFeatures(false);

    try {
      const res = await fetch("/api/xndzor/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query, mode }),
      });
      if (!res.ok) throw new Error("solve_failed");
      const data = (await res.json()) as { bundle: SolutionBundle };
      setBundle(data.bundle);
      setShowFeatures(true);
    } catch {
      setError(t("errors.solveFailed"));
    } finally {
      setLoading(false);
    }
  }, [text, mode, t]);

  return (
    <section id="xndzor-hero" className="xndzor-hero" aria-label={t("heroTitle")}>
      <div className="xndzor-hero-band" aria-hidden>
        <span className="xndzor-hero-band-grain" />
        <span className="xndzor-hero-band-orb xndzor-hero-band-orb-left" />
        <span className="xndzor-hero-band-orb xndzor-hero-band-orb-right" />
        <span className="xndzor-hero-band-motif xndzor-hero-band-motif-orchard" />
        <span className="xndzor-hero-band-motif xndzor-hero-band-motif-hills" />
        <span className="xndzor-hero-band-motif xndzor-hero-band-motif-wheat" />
        <span className="xndzor-hero-band-motif xndzor-hero-band-motif-apple" />
        <span className="xndzor-hero-band-accent xndzor-hero-band-accent-left">🌾</span>
        <span className="xndzor-hero-band-accent xndzor-hero-band-accent-right">🍎</span>
      </div>

      <div className="xndzor-hero-shell">
        <aside className="xndzor-hero-rail xndzor-hero-rail-left" aria-label={t("heroSide.quickLabel")}>
          <p className="xndzor-hero-rail-label">{t("heroSide.quickLabel")}</p>
          <nav className="xndzor-hero-rail-links">
            {QUICK_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="xndzor-hero-rail-link">
                <span className="xndzor-hero-rail-link-icon" aria-hidden>
                  {link.icon}
                </span>
                <span>{tMenu(link.labelKey)}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <div className="xndzor-hero-inner">
        <div className="xndzor-hero-brand">
          <span className="xndzor-apple" aria-hidden>
            🍎
          </span>
          <h1 className="xndzor-hero-title">{t("heroTitle")}</h1>
          <p className="xndzor-hero-tagline">{t("heroTagline")}</p>
          {greeting ? <p className="xndzor-hero-greeting">{greeting}</p> : null}
        </div>

        <div className="xndzor-mode-toggle" role="tablist" aria-label={t("modeLabel")}>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "need"}
            className={`xndzor-mode-btn${mode === "need" ? " is-active" : ""}`}
            onClick={() => {
              setMode("need");
              setBundle(null);
              setShowFeatures(false);
            }}
          >
            {t("modeNeed")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "have"}
            className={`xndzor-mode-btn${mode === "have" ? " is-active" : ""}`}
            onClick={() => {
              setMode("have");
              setBundle(null);
              setShowFeatures(false);
            }}
          >
            {t("modeHave")}
          </button>
        </div>

        <div className="xndzor-input-block">
          <label htmlFor="xndzor-problem" className="xndzor-input-label">
            {mode === "need" ? t("whatNeed") : t("whatHave")}
          </label>
          <textarea
            id="xndzor-problem"
            className="xndzor-textarea"
            rows={3}
            placeholder={mode === "need" ? t("placeholderNeed") : t("placeholderHave")}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setBundle(null);
              setShowFeatures(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void findSolution();
              }
            }}
          />

          <div className="xndzor-chips" aria-label={t("quickChips")}>
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className="xndzor-chip"
                onClick={() => applyChip(chip.key)}
              >
                <span aria-hidden>{chip.emoji}</span>
                {t(`chips.${mode}.${chip.key}` as "chips.need.harvest")}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn primary xndzor-find-btn"
            disabled={!text.trim() || loading}
            onClick={() => void findSolution()}
          >
            {loading ? t("finding") : t("findSolution")}
          </button>

          {error ? <p className="xndzor-error">{error}</p> : null}
        </div>

        {bundle ? (
          <div className="xndzor-result animate-fade">
            <p className="xndzor-result-headline">{t("foundSolution")}</p>
            <SolutionBundleCard bundle={bundle} locale={locale} />
          </div>
        ) : null}

        {showFeatures ? (
          <div className="xndzor-killer-features motion-stagger animate-fade">
            <GroupOrderCard locale={locale} />
            <XndzorRouteSection locale={locale} />
          </div>
        ) : null}
        </div>

        <aside className="xndzor-hero-rail xndzor-hero-rail-right" aria-label={tTrust("badgesLabel")}>
          <p className="xndzor-hero-rail-label">{tTrust("badgesLabel")}</p>
          <ul className="xndzor-hero-rail-badges">
            {TRUST_BADGES.map((key) => (
              <li key={key} className="xndzor-hero-rail-badge">
                <span className="xndzor-hero-rail-badge-dot" aria-hidden />
                {tTrust(`badges.${key}`)}
              </li>
            ))}
          </ul>
          <Link href="/features/solve" className="xndzor-hero-rail-feature">
            <span aria-hidden>✨</span>
            {t("promoSlider.items.solve.title")}
          </Link>
          <Link href="/features/route" className="xndzor-hero-rail-feature">
            <span aria-hidden>🚛</span>
            {t("promoSlider.items.route.title")}
          </Link>
        </aside>
      </div>
    </section>
  );
}
