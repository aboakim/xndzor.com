import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { FarmPageShell } from "@/components/farm/FarmPageShell";
import { ReturnForm } from "@/components/farm/ReturnForm";

export default async function NewReturnPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("farm");
  const tn = await getTranslations("nav");
  const root = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/farm/returns/new`);
  }

  const marzes = await prisma.marz.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <FarmPageShell
      title={t("returns.add")}
      lede={t("tools.returns.desc")}
      breadcrumbs={[
        { href: "/", label: tn("home") },
        { href: "/farm", label: t("hub.title") },
        { href: "/farm/returns", label: t("tools.returns.title") },
        { label: t("returns.add") },
      ]}
    >
      <ReturnForm
        marzes={marzes.map((m) => ({
          id: m.id,
          slug: m.slug,
          name: root(`marzes.${m.slug}` as "marzes.Yerevan"),
        }))}
      />
    </FarmPageShell>
  );
}
