import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { CatalogForm } from "@/components/CatalogForm";
import { Link } from "@/i18n/navigation";
import { CATALOG_ROUTE, categoryFromRoute } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function NewCatalogPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category: slug } = await params;
  const category = categoryFromRoute(slug);
  if (!category) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  const route = CATALOG_ROUTE[category];
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/shop/${route}/new`);
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  return (
    <div className="section form-page">
      <h1>
        {t("postCatalog.title")} — {t(`catalogCategories.${category}` as "catalogCategories.FERTILIZER")}
      </h1>
      <p className="lede">{t(`catalogLedes.${category}` as "catalogLedes.FERTILIZER")}</p>
      <CatalogForm category={category} defaultMarzId={user?.marzId} defaultPhone={user?.phone} />
      <p className="muted">
        <Link href={`/shop/${route}`}>{t(`catalogCategories.${category}` as "catalogCategories.FERTILIZER")}</Link>
      </p>
    </div>
  );
}
