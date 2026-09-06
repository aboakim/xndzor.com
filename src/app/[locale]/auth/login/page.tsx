import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { resolveAuthRedirectUrl } from "@/lib/auth-redirect";
import LoginForm from "./LoginForm";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  const [{ locale }, { callbackUrl }] = await Promise.all([params, searchParams]);
  const session = await getSession();

  if (session) {
    redirect(resolveAuthRedirectUrl(callbackUrl, locale));
  }

  return <LoginForm callbackUrl={callbackUrl} />;
}
