import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs, type Crumb } from "@/components/Breadcrumbs";

export type FeatureAboutStep = { title: string; body: string };
export type FeatureAboutAdvantage = { title: string; body: string };
export type FeatureAboutFaq = { q: string; a: string };

export type FeatureAboutCta = {
  href: string;
  label: string;
  variant?: "primary" | "ghost";
};

export type FeatureAboutCompare = {
  lede: string;
  beforeLabel: string;
  afterLabel: string;
  beforeValue: ReactNode;
  afterValue: ReactNode;
  unit?: string;
  saveNote?: string;
};

type FeatureAboutLayoutProps = {
  breadcrumbs: Crumb[];
  badge: string;
  eyebrow: string;
  title: string;
  lede: string;
  whatTitle: string;
  whatBody: string[];
  whyTitle: string;
  whyBody: string[];
  howTitle: string;
  steps: FeatureAboutStep[];
  advantagesTitle: string;
  advantages: FeatureAboutAdvantage[];
  exampleTitle: string;
  example: FeatureAboutCompare;
  whoTitle: string;
  whoBody: string;
  faqTitle: string;
  faq: FeatureAboutFaq[];
  ctaTitle: string;
  ctaLede: string;
  ctas: FeatureAboutCta[];
};

export function FeatureAboutLayout({
  breadcrumbs,
  badge,
  eyebrow,
  title,
  lede,
  whatTitle,
  whatBody,
  whyTitle,
  whyBody,
  howTitle,
  steps,
  advantagesTitle,
  advantages,
  exampleTitle,
  example,
  whoTitle,
  whoBody,
  faqTitle,
  faq,
  ctaTitle,
  ctaLede,
  ctas,
}: FeatureAboutLayoutProps) {
  return (
    <div className="section gba-page">
      <Breadcrumbs items={breadcrumbs} />

      <header className="gba-hero">
        <p className="gba-badge">
          <span className="gba-badge-dot" aria-hidden />
          {badge}
        </p>
        <p className="gba-eyebrow">{eyebrow}</p>
        <h1 className="gba-title">{title}</h1>
        <p className="gba-lede">{lede}</p>
      </header>

      <section className="gba-block" aria-labelledby="fa-what">
        <h2 id="fa-what">{whatTitle}</h2>
        {whatBody.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </section>

      <section className="gba-block" aria-labelledby="fa-why">
        <h2 id="fa-why">{whyTitle}</h2>
        {whyBody.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </section>

      <section className="gba-block" aria-labelledby="fa-how">
        <h2 id="fa-how">{howTitle}</h2>
        <ol className="gba-steps">
          {steps.map((step, i) => (
            <li key={step.title} className="gba-step">
              <span className="gba-step-num" aria-hidden>
                {i + 1}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="gba-block" aria-labelledby="fa-adv">
        <h2 id="fa-adv">{advantagesTitle}</h2>
        <ul className="gba-advantages">
          {advantages.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="gba-example" aria-labelledby="fa-example">
        <h2 id="fa-example">{exampleTitle}</h2>
        <p className="gba-example-lede">{example.lede}</p>
        <div className="gba-compare">
          <div className="gba-compare-solo">
            <span className="gba-compare-label">{example.beforeLabel}</span>
            <del className="gba-compare-price">{example.beforeValue}</del>
            {example.unit ? (
              <span className="gba-compare-unit">{example.unit}</span>
            ) : null}
          </div>
          <div className="gba-compare-group">
            <span className="gba-compare-label">{example.afterLabel}</span>
            <strong className="gba-compare-price">{example.afterValue}</strong>
            {example.unit ? (
              <span className="gba-compare-unit">{example.unit}</span>
            ) : null}
          </div>
        </div>
        {example.saveNote ? (
          <p className="gba-save-note">{example.saveNote}</p>
        ) : null}
      </section>

      <section className="gba-block" aria-labelledby="fa-who">
        <h2 id="fa-who">{whoTitle}</h2>
        <p>{whoBody}</p>
      </section>

      <section className="gba-block" aria-labelledby="fa-faq">
        <h2 id="fa-faq">{faqTitle}</h2>
        <div className="gba-faq">
          {faq.map((item) => (
            <details key={item.q} className="gba-faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="gba-cta" aria-labelledby="fa-cta">
        <h2 id="fa-cta">{ctaTitle}</h2>
        <p>{ctaLede}</p>
        <div className="gba-cta-actions">
          {ctas.map((cta) => {
            const useAnchor =
              cta.href.startsWith("#") ||
              cta.href.includes("#") ||
              cta.href.startsWith("http");
            const className = `btn ${cta.variant === "ghost" ? "ghost" : "primary"}`;
            return useAnchor ? (
              <a
                key={`${cta.href}-${cta.label}`}
                href={cta.href}
                className={className}
              >
                {cta.label}
              </a>
            ) : (
              <Link
                key={`${cta.href}-${cta.label}`}
                href={cta.href}
                className={className}
              >
                {cta.label}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
