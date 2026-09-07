import type { ReactNode } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs, type Crumb } from "@/components/Breadcrumbs";

export type FeatureAboutStep = { title: string; body: string };
export type FeatureAboutAdvantage = { title: string; body: string };
export type FeatureAboutFaq = { q: string; a: string };
export type FeatureAboutProblem = { problem: string; solution: string };

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

export type FeatureAboutScene = {
  src: string;
  label: string;
  caption: string;
};

export type FeatureAboutVisual = {
  heroSrc: string;
  heroAlt: string;
  scenes?: FeatureAboutScene[];
  problemImages?: string[];
  stepImages?: string[];
};

type FeatureAboutLayoutProps = {
  breadcrumbs: Crumb[];
  badge: string;
  eyebrow: string;
  title: string;
  lede: string;
  brand?: string;
  problemsTitle?: string;
  problemLabel?: string;
  solutionLabel?: string;
  problems?: FeatureAboutProblem[];
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
  whoBody: string | string[];
  faqTitle: string;
  faq: FeatureAboutFaq[];
  ctaTitle: string;
  ctaLede: string;
  ctas: FeatureAboutCta[];
  visual?: FeatureAboutVisual;
};

export function FeatureAboutLayout({
  breadcrumbs,
  badge,
  eyebrow,
  title,
  lede,
  brand,
  problemsTitle,
  problemLabel,
  solutionLabel,
  problems,
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
  visual,
}: FeatureAboutLayoutProps) {
  const whoParagraphs = Array.isArray(whoBody) ? whoBody : [whoBody];
  const showProblems = Boolean(problemsTitle && problems && problems.length > 0);
  const isVisual = Boolean(visual?.heroSrc);

  return (
    <div className={`section gba-page${isVisual ? " gba-page-visual" : ""}`}>
      <Breadcrumbs items={breadcrumbs} />

      <header className={`gba-hero${isVisual ? " gba-hero-visual" : ""}`}>
        {visual?.heroSrc ? (
          <div className="gba-hero-media" aria-hidden>
            <Image
              src={visual.heroSrc}
              alt=""
              fill
              priority
              sizes="(max-width: 900px) 100vw, 56rem"
              className="gba-hero-img"
            />
            <div className="gba-hero-shade" />
          </div>
        ) : null}
        <div className="gba-hero-copy">
          {brand ? <p className="gba-brand">{brand}</p> : null}
          {!brand ? (
            <p className="gba-badge">
              <span className="gba-badge-dot" aria-hidden />
              {badge}
            </p>
          ) : null}
          <p className="gba-eyebrow">{eyebrow}</p>
          <h1 className="gba-title">{title}</h1>
          <p className="gba-lede">{lede}</p>
        </div>
      </header>

      {visual?.scenes && visual.scenes.length > 0 ? (
        <section className="gba-scenes" aria-label={title}>
          <ul className="gba-scene-grid">
            {visual.scenes.map((scene) => (
              <li key={scene.src + scene.label} className="gba-scene">
                <div className="gba-scene-media">
                  <Image
                    src={scene.src}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, 14rem"
                    className="gba-scene-img"
                  />
                </div>
                <div className="gba-scene-copy">
                  <strong>{scene.label}</strong>
                  <span>{scene.caption}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showProblems ? (
        <section className="gba-block" aria-labelledby="fa-problems">
          <h2 id="fa-problems">{problemsTitle}</h2>
          <ul className={`gba-problems${isVisual ? " gba-problems-visual" : ""}`}>
            {problems!.map((item, i) => {
              const img = visual?.problemImages?.[i];
              return (
                <li key={item.problem} className="gba-problem">
                  {img ? (
                    <div className="gba-problem-thumb">
                      <Image
                        src={img}
                        alt=""
                        fill
                        sizes="5.5rem"
                        className="gba-problem-thumb-img"
                      />
                    </div>
                  ) : null}
                  <div className="gba-problem-body">
                    <div className="gba-problem-col">
                      {problemLabel ? (
                        <span className="gba-problem-label">{problemLabel}</span>
                      ) : null}
                      <p>{item.problem}</p>
                    </div>
                    <div className="gba-problem-col gba-problem-col-sol">
                      {solutionLabel ? (
                        <span className="gba-problem-label">{solutionLabel}</span>
                      ) : null}
                      <p>{item.solution}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section
        className={`gba-block${isVisual ? " gba-split" : ""}`}
        aria-labelledby="fa-what"
      >
        {isVisual && visual?.scenes?.[0] ? (
          <div className="gba-split-media">
            <Image
              src={visual.scenes[0].src}
              alt=""
              fill
              sizes="(max-width: 720px) 100vw, 18rem"
              className="gba-split-img"
            />
          </div>
        ) : null}
        <div className="gba-split-copy">
          <h2 id="fa-what">{whatTitle}</h2>
          {whatBody.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </section>

      <section
        className={`gba-block${isVisual ? " gba-split gba-split-flip" : ""}`}
        aria-labelledby="fa-why"
      >
        {isVisual && visual?.scenes?.[1] ? (
          <div className="gba-split-media">
            <Image
              src={visual.scenes[1].src}
              alt=""
              fill
              sizes="(max-width: 720px) 100vw, 18rem"
              className="gba-split-img"
            />
          </div>
        ) : null}
        <div className="gba-split-copy">
          <h2 id="fa-why">{whyTitle}</h2>
          {whyBody.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </section>

      <section className="gba-block" aria-labelledby="fa-how">
        <h2 id="fa-how">{howTitle}</h2>
        <ol className={`gba-steps${isVisual ? " gba-steps-visual" : ""}`}>
          {steps.map((step, i) => {
            const img = visual?.stepImages?.[i];
            return (
              <li key={step.title} className="gba-step">
                {img ? (
                  <div className="gba-step-media">
                    <Image
                      src={img}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 12rem"
                      className="gba-step-img"
                    />
                    <span className="gba-step-num gba-step-num-on-media" aria-hidden>
                      {i + 1}
                    </span>
                  </div>
                ) : (
                  <span className="gba-step-num" aria-hidden>
                    {i + 1}
                  </span>
                )}
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="gba-block" aria-labelledby="fa-adv">
        <h2 id="fa-adv">{advantagesTitle}</h2>
        <ul className={`gba-advantages${isVisual ? " gba-advantages-visual" : ""}`}>
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
        {isVisual ? (
          <ul className="gba-who-cards">
            {whoParagraphs.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : (
          whoParagraphs.map((p) => <p key={p}>{p}</p>)
        )}
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
