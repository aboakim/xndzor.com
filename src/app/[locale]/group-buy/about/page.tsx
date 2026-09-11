import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  FeatureAboutLayout,
  type FeatureAboutAdvantage,
  type FeatureAboutFaq,
  type FeatureAboutProblem,
  type FeatureAboutStep,
} from "@/components/xndzor/FeatureAboutLayout";
import { formatAmd } from "@/lib/utils";
import { GROUP_BUY_ABOUT_VISUALS } from "@/lib/featureAbout";
import { buildPageMetadata } from "@/lib/seo";

const SOLO_PRICE = 85_000;
const GROUP_PRICE = 48_000;
const SAVINGS_PCT = Math.round((1 - GROUP_PRICE / SOLO_PRICE) * 100);

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "groupBuy.about" });
  return buildPageMetadata({
    locale,
    path: "/group-buy/about",
    title: t("title"),
    description: t("lede"),
  });
}

export default async function GroupBuyAboutPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("groupBuy.about");
  const navT = await getTranslations("nav");
  const gbT = await getTranslations("groupBuy");

  const steps = (Array.isArray(t.raw("steps")) ? t.raw("steps") : []) as FeatureAboutStep[];
  const advantages = (Array.isArray(t.raw("advantages"))
    ? t.raw("advantages")
    : []) as FeatureAboutAdvantage[];
  const faq = (Array.isArray(t.raw("faq")) ? t.raw("faq") : []) as FeatureAboutFaq[];
  const whatBody = (Array.isArray(t.raw("whatBody")) ? t.raw("whatBody") : []) as string[];
  const whyBody = (Array.isArray(t.raw("whyBody")) ? t.raw("whyBody") : []) as string[];
  const problems = (
    Array.isArray(t.raw("problems")) ? t.raw("problems") : []
  ) as FeatureAboutProblem[];
  const whoRaw = t.raw("whoBody");
  const whoBody = (
    Array.isArray(whoRaw) ? whoRaw : [typeof whoRaw === "string" ? whoRaw : t("whoBody")]
  ) as string[];

  const media = GROUP_BUY_ABOUT_VISUALS;
  const visual = {
    heroSrc: media.heroSrc,
    heroAlt: t("title"),
    scenes: media.scenes.map((scene) => ({
      src: scene.src,
      label: t(`scenes.${scene.key}.label`),
      caption: t(`scenes.${scene.key}.caption`),
    })),
    problemImages: [...media.problemImages],
    stepImages: [...media.stepImages],
  };

  return (
    <FeatureAboutLayout
      breadcrumbs={[
        { href: "/", label: navT("home") },
        { href: "/group-buy", label: gbT("title") },
        { label: t("title") },
      ]}
      badge={t("badge")}
      brand={t.has("brand") ? t("brand") : undefined}
      eyebrow={t("eyebrow")}
      title={t("title")}
      lede={t("lede")}
      problemsTitle={t("problemsTitle")}
      problemLabel={t("problemLabel")}
      solutionLabel={t("solutionLabel")}
      problems={problems}
      whatTitle={t("whatTitle")}
      whatBody={whatBody}
      whyTitle={t("whyTitle")}
      whyBody={whyBody}
      howTitle={t("howTitle")}
      steps={steps}
      advantagesTitle={t("advantagesTitle")}
      advantages={advantages}
      exampleTitle={t("exampleTitle")}
      example={{
        lede: t("exampleLede"),
        beforeLabel: t.has("beforeLabel") ? t("beforeLabel") : t("soloLabel"),
        afterLabel: t.has("afterLabel") ? t("afterLabel") : t("groupLabel"),
        beforeValue: `${formatAmd(SOLO_PRICE, locale)} ֏`,
        afterValue: `${formatAmd(GROUP_PRICE, locale)} ֏`,
        unit: t.has("exampleUnit") ? t("exampleUnit") : t("perFarm"),
        saveNote: t("saveNote", { pct: SAVINGS_PCT }),
      }}
      whoTitle={t("whoTitle")}
      whoBody={whoBody}
      faqTitle={t("faqTitle")}
      faq={faq}
      ctaTitle={t("ctaTitle")}
      ctaLede={t("ctaLede")}
      ctas={[
        { href: "/group-buy", label: t("ctaOffers"), variant: "primary" },
        { href: "/group-buy", label: t("ctaJoin"), variant: "ghost" },
      ]}
      visual={visual}
    />
  );
}
