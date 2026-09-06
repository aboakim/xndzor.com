import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { formatAmd } from "@/lib/utils";

const SOLO_PRICE = 85_000;
const GROUP_PRICE = 48_000;
const SAVINGS_PCT = Math.round((1 - GROUP_PRICE / SOLO_PRICE) * 100);

type Step = { title: string; body: string };
type Advantage = { title: string; body: string };
type FaqItem = { q: string; a: string };

export default async function GroupBuyAboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("groupBuy.about");
  const navT = await getTranslations("nav");
  const gbT = await getTranslations("groupBuy");

  const steps = t.raw("steps") as Step[];
  const advantages = t.raw("advantages") as Advantage[];
  const faq = t.raw("faq") as FaqItem[];
  const whatBody = t.raw("whatBody") as string[];

  return (
    <div className="section gba-page">
      <Breadcrumbs
        items={[
          { href: "/", label: navT("home") },
          { href: "/group-buy", label: gbT("title") },
          { label: t("title") },
        ]}
      />

      <header className="gba-hero">
        <p className="gba-badge">
          <span className="gba-badge-dot" aria-hidden />
          {t("badge")}
        </p>
        <p className="gba-eyebrow">{t("eyebrow")}</p>
        <h1 className="gba-title">{t("title")}</h1>
        <p className="gba-lede">{t("lede")}</p>
      </header>

      <section className="gba-block" aria-labelledby="gba-what">
        <h2 id="gba-what">{t("whatTitle")}</h2>
        {whatBody.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </section>

      <section className="gba-block" aria-labelledby="gba-how">
        <h2 id="gba-how">{t("howTitle")}</h2>
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

      <section className="gba-block" aria-labelledby="gba-adv">
        <h2 id="gba-adv">{t("advantagesTitle")}</h2>
        <ul className="gba-advantages">
          {advantages.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="gba-example" aria-labelledby="gba-example">
        <h2 id="gba-example">{t("exampleTitle")}</h2>
        <p className="gba-example-lede">{t("exampleLede")}</p>
        <div className="gba-compare">
          <div className="gba-compare-solo">
            <span className="gba-compare-label">{t("soloLabel")}</span>
            <del className="gba-compare-price">
              {formatAmd(SOLO_PRICE, locale)} ֏
            </del>
            <span className="gba-compare-unit">{t("perFarm")}</span>
          </div>
          <div className="gba-compare-group">
            <span className="gba-compare-label">{t("groupLabel")}</span>
            <strong className="gba-compare-price">
              {formatAmd(GROUP_PRICE, locale)} ֏
            </strong>
            <span className="gba-compare-unit">{t("perFarm")}</span>
          </div>
        </div>
        <p className="gba-save-note">{t("saveNote", { pct: SAVINGS_PCT })}</p>
      </section>

      <section className="gba-block" aria-labelledby="gba-who">
        <h2 id="gba-who">{t("whoTitle")}</h2>
        <p>{t("whoBody")}</p>
      </section>

      <section className="gba-block" aria-labelledby="gba-faq">
        <h2 id="gba-faq">{t("faqTitle")}</h2>
        <div className="gba-faq">
          {faq.map((item) => (
            <details key={item.q} className="gba-faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="gba-cta" aria-labelledby="gba-cta">
        <h2 id="gba-cta">{t("ctaTitle")}</h2>
        <p>{t("ctaLede")}</p>
        <div className="gba-cta-actions">
          <Link href="/group-buy" className="btn primary">
            {t("ctaOffers")}
          </Link>
          <Link href="/group-buy" className="btn ghost">
            {t("ctaJoin")}
          </Link>
        </div>
      </section>
    </div>
  );
}
