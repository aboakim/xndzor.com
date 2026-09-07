import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  FeatureAboutLayout,
  type FeatureAboutAdvantage,
  type FeatureAboutCta,
  type FeatureAboutFaq,
  type FeatureAboutProblem,
  type FeatureAboutStep,
} from "@/components/xndzor/FeatureAboutLayout";
import { formatAmd } from "@/lib/utils";
import {
  FEATURE_ABOUT_EXAMPLE,
  FEATURE_ABOUT_SLUGS,
  FEATURE_ABOUT_VISUALS,
  FEATURE_PRIMARY_HREF,
  isFeatureAboutSlug,
  type FeatureAboutSlug,
} from "@/lib/featureAbout";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return FEATURE_ABOUT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isFeatureAboutSlug(slug)) return {};
  const t = await getTranslations({ locale, namespace: `features.about.${slug}` });
  return {
    title: t("title"),
    description: t("lede"),
  };
}

function exampleValues(
  slug: FeatureAboutSlug,
  locale: string,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  const nums = FEATURE_ABOUT_EXAMPLE[slug];

  if (slug === "grow") {
    return {
      beforeValue: `−${formatAmd(nums.before, locale)} ֏`,
      afterValue: t("exampleAfterValue"),
      unit: undefined as string | undefined,
      saveNote: t("saveNote"),
    };
  }

  if (slug === "passport") {
    return {
      beforeValue: `${formatAmd(nums.before, locale)} ֏`,
      afterValue: `${formatAmd(nums.after, locale)} ֏`,
      unit: t("exampleUnit"),
      saveNote: t("saveNote", {
        before: formatAmd(nums.before, locale),
        after: formatAmd(nums.after, locale),
      }),
    };
  }

  const pct = Math.round((1 - nums.after / nums.before) * 100);
  return {
    beforeValue: `${formatAmd(nums.before, locale)} ֏`,
    afterValue: `${formatAmd(nums.after, locale)} ֏`,
    unit: t("exampleUnit"),
    saveNote: t("saveNote", { pct }),
  };
}

export default async function FeatureAboutPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isFeatureAboutSlug(slug)) notFound();

  setRequestLocale(locale);
  const t = await getTranslations(`features.about.${slug}`);
  const shared = await getTranslations("features.about");
  const navT = await getTranslations("nav");

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
  const example = exampleValues(slug, locale, t);
  const hasProblems = problems.length > 0 && t.has("problemsTitle");

  const primaryHref =
    slug === "solve"
      ? `/${locale}#xndzor-hero`
      : slug === "route"
        ? `/${locale}#xndzor-route`
        : FEATURE_PRIMARY_HREF[slug];

  const ctas: FeatureAboutCta[] = [
    { href: primaryHref, label: t("ctaPrimary"), variant: "primary" },
  ];
  for (const cta of [
    { href: "/grow", label: shared("ctaGrow"), variant: "ghost" as const },
    { href: "/farms/me", label: shared("ctaPassport"), variant: "ghost" as const },
    { href: "/group-buy", label: shared("ctaGroupBuy"), variant: "ghost" as const },
  ]) {
    if (cta.href !== primaryHref) ctas.push(cta);
  }

  const media = FEATURE_ABOUT_VISUALS[slug];
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
        { label: t("title") },
      ]}
      badge={shared("badge")}
      brand={t.has("brand") ? t("brand") : undefined}
      eyebrow={t("eyebrow")}
      title={t("title")}
      lede={t("lede")}
      problemsTitle={hasProblems ? t("problemsTitle") : undefined}
      problemLabel={hasProblems && t.has("problemLabel") ? t("problemLabel") : undefined}
      solutionLabel={hasProblems && t.has("solutionLabel") ? t("solutionLabel") : undefined}
      problems={hasProblems ? problems : undefined}
      whatTitle={shared("whatTitle")}
      whatBody={whatBody}
      whyTitle={shared("whyTitle")}
      whyBody={whyBody}
      howTitle={shared("howTitle")}
      steps={steps}
      advantagesTitle={shared("advantagesTitle")}
      advantages={advantages}
      exampleTitle={shared("exampleTitle")}
      example={{
        lede: t("exampleLede"),
        beforeLabel: t("beforeLabel"),
        afterLabel: t("afterLabel"),
        beforeValue: example.beforeValue,
        afterValue: example.afterValue,
        unit: example.unit,
        saveNote: example.saveNote,
      }}
      whoTitle={shared("whoTitle")}
      whoBody={whoBody}
      faqTitle={shared("faqTitle")}
      faq={faq}
      ctaTitle={t("ctaTitle")}
      ctaLede={t("ctaLede")}
      ctas={ctas}
      visual={visual}
    />
  );
}
