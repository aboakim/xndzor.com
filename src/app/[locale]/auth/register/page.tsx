import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { resolveAuthRedirectUrl } from "@/lib/auth-redirect";
import RegisterForm from "./RegisterForm";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function RegisterPage({ params, searchParams }: Props) {
  const [{ locale }, { callbackUrl }] = await Promise.all([params, searchParams]);
  const session = await getSession();

  if (session) {
    redirect(resolveAuthRedirectUrl(callbackUrl, locale));
  }

  return <RegisterForm callbackUrl={callbackUrl} />;
}
