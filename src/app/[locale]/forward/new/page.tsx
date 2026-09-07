import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getProducts } from "@/lib/products";
import { ForwardCropForm } from "@/components/ForwardCropForm";

export const dynamic = "force-dynamic";

export default async function NewForwardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/forward/new`);
  }
  const [products, user] = await Promise.all([
    getProducts(),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);
  return (
    <div className="section form-page">
      <h1>{t("forwardForm.pageTitle")}</h1>
      <p className="lede">{t("forwardForm.lede")}</p>
      <ForwardCropForm
        products={products}
        defaultMarzId={user?.marzId}
        defaultPhone={user?.phone}
      />
    </div>
  );
}
