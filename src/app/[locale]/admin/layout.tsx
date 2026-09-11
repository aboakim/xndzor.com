import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminSidebar } from "@/components/AdminSidebar";
import { requireAdmin } from "@/lib/admin";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    path: "/admin",
    title: "Admin",
    description: "Xndzor admin",
    noIndex: true,
  });
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const t = await getTranslations("admin");

  return (
    <div className="section admin-shell">
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <header className="admin-page-header">
            <h1 className="admin-page-title">{t("panelTitle")}</h1>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
