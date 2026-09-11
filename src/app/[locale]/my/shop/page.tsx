import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import { CatalogListingActions } from "@/components/CatalogListingActions";
import { ActionIcon } from "@/components/AgIcons";
import { CATALOG_ROUTE, type CatalogCategory } from "@/lib/catalog";
import { tContent } from "@/lib/content-locale";
import { formatAmd, parseImageUrls } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyShopPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/my/shop`);
  }

  const listings = await prisma.catalogListing.findMany({
    where: { userId: session.user.id },
    include: { marz: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="section page-board">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { label: t("myCatalog.title") },
        ]}
      />
      <div className="section-head">
        <div>
          <h1>{t("myCatalog.title")}</h1>
          <p className="lede">{t("myCatalog.lede")}</p>
        </div>
        <Link href="/shop/fertilizers/new" className="btn primary">
          {t("common.add")}
        </Link>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          message={t("myCatalog.empty")}
          actionHref="/shop/fertilizers/new"
          actionLabel={t("common.add")}
        />
      ) : (
        <ul className="my-machinery-list">
          {listings.map((row) => {
            const cat = row.category as CatalogCategory;
            const route = CATALOG_ROUTE[cat];
            const thumb = parseImageUrls(row.imageUrls)[0];
            return (
              <li key={row.id} className="my-machinery-row">
                <Link href={`/shop/${route}/${row.id}`} className="my-machinery-main">
                  <span className="my-machinery-thumb" aria-hidden>
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" />
                    ) : (
                      <ActionIcon action={route} size={28} />
                    )}
                  </span>
                  <span>
                    <strong>{tContent(locale, row.title)}</strong>
                    <span className="muted">
                      {t(`catalogCategories.${cat}` as "catalogCategories.FERTILIZER")} ·{" "}
                      {t(`catalog.status.${row.status}` as "catalog.status.ACTIVE")}
                      {row.priceAmd != null ? ` · ${formatAmd(row.priceAmd, locale)} ֏` : ""}
                    </span>
                  </span>
                </Link>
                <CatalogListingActions
                  id={row.id}
                  status={row.status}
                  editHref={`/shop/${route}/${row.id}/edit`}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
