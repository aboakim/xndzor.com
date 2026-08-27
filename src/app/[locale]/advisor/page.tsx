import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCropRankings } from "@/lib/exchange";
import { ProductIcon } from "@/components/AgIcons";

/** Thin rule-based tip stub — full AI advisor deferred. */
export default async function AdvisorStubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();

  const rankings = await getCropRankings();
  const under = rankings.filter((r) => r.signal === "UNDER").slice(0, 3);
  const over = rankings.filter((r) => r.signal === "OVER").slice(0, 3);

  const myCrops: { slug: string; nameKey: string }[] = [];
  if (session?.user?.id) {
    const plots = await prisma.plot.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      include: { cropProduct: true },
    });
    const seen = new Set<string>();
    for (const p of plots) {
      if (!seen.has(p.cropProduct.slug)) {
        seen.add(p.cropProduct.slug);
        myCrops.push({
          slug: p.cropProduct.slug,
          nameKey: p.cropProduct.nameKey,
        });
      }
    }
  }

  return (
    <div className="section detail-page">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { label: t("advisor.title") },
        ]}
      />
      <p className="eyebrow">{t("advisor.eyebrow")}</p>
      <h1>{t("advisor.title")}</h1>
      <p className="lede">{t("advisor.lede")}</p>
      <p className="muted">{t("advisor.soon")}</p>

      {under.length > 0 ? (
        <section className="match-section">
          <h2>{t("advisor.underTitle")}</h2>
          <ul className="match-list">
            {under.map((r) => (
              <li key={r.productId} className="match-row">
                <div>
                  <strong className="icon-label">
                    <ProductIcon slugOrKey={r.slug} size={16} />
                    {t(r.nameKey as "products.tomato")}
                  </strong>
                  <p>{t("advisor.underTip")}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {over.length > 0 ? (
        <section className="match-section">
          <h2>{t("advisor.overTitle")}</h2>
          <ul className="match-list">
            {over.map((r) => (
              <li key={r.productId} className="match-row">
                <div>
                  <strong className="icon-label">
                    <ProductIcon slugOrKey={r.slug} size={16} />
                    {t(r.nameKey as "products.tomato")}
                  </strong>
                  <p>{t("advisor.overTip")}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {myCrops.length > 0 ? (
        <section className="match-section">
          <h2>{t("advisor.yourCrops")}</h2>
          <p className="muted">{t("advisor.yourCropsHint")}</p>
          <ul className="crop-chip-list">
            {myCrops.map((c) => (
              <li key={c.slug} className="crop-chip">
                <ProductIcon slugOrKey={c.slug} size={16} />
                {t(c.nameKey as "products.tomato")}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Link href="/grow" className="btn primary">
        {t("nav.grow")}
      </Link>
    </div>
  );
}
