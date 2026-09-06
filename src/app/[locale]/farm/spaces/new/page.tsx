import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { FarmPageShell } from "@/components/farm/FarmPageShell";
import { SpaceForm } from "@/components/farm/SpaceForm";

export default async function NewSpacePage({
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
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/farm/spaces/new`);
  }

  const [user, marzes] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.marz.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <FarmPageShell
      title={t("spaces.add")}
      lede={t("tools.spaces.desc")}
      breadcrumbs={[
        { href: "/", label: tn("home") },
        { href: "/farm", label: t("hub.title") },
        { href: "/farm/spaces", label: t("tools.spaces.title") },
        { label: t("spaces.add") },
      ]}
    >
      <SpaceForm
        defaultMarzId={user?.marzId}
        marzes={marzes.map((m) => ({
          id: m.id,
          slug: m.slug,
          name: root(`marzes.${m.slug}` as "marzes.Yerevan"),
        }))}
      />
    </FarmPageShell>
  );
}
