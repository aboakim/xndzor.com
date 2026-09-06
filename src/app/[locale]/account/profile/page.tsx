import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProfileForm } from "@/components/ProfileForm";
import { getSession } from "@/lib/session";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ welcome?: string; earlyBird?: string; remaining?: string; limit?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const { welcome } = sp;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/account/profile`);
  }

  return (
    <div className="section narrow profile-page">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { label: t("profile.title") },
        ]}
      />
      <div className="section-head">
        <div>
          <h1>{t("profile.title")}</h1>
          <p className="lede">{t("profile.lede")}</p>
        </div>
      </div>
      <ProfileForm
        welcome={welcome === "1"}
        earlyBird={sp.earlyBird === "1"}
        earlyBirdRemaining={
          sp.remaining ? Number.parseInt(sp.remaining, 10) : undefined
        }
        earlyBirdLimit={sp.limit ? Number.parseInt(sp.limit, 10) : undefined}
      />
    </div>
  );
}
