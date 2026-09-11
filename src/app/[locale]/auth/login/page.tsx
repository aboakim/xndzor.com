import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { resolveAuthRedirectUrl } from "@/lib/auth-redirect";
import { buildPageMetadata } from "@/lib/seo";
import { getTranslations } from "next-intl/server";
import LoginForm from "./LoginForm";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return buildPageMetadata({
    locale,
    path: "/auth/login",
    title: t("auth.loginTitle"),
    description: t("auth.loginDescription"),
    noIndex: true,
  });
}

export default async function LoginPage({ params, searchParams }: Props) {
  const [{ locale }, { callbackUrl }] = await Promise.all([params, searchParams]);
  const session = await getSession();

  if (session) {
    redirect(resolveAuthRedirectUrl(callbackUrl, locale));
  }

  return <LoginForm callbackUrl={callbackUrl} />;
}
