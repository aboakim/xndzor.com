import { getTranslations, setRequestLocale } from "next-intl/server";
import { FarmPageShell } from "@/components/farm/FarmPageShell";
import { SellOrWaitCalculator } from "@/components/farm/SellOrWaitCalculator";

export default async function SellOrWaitPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("farm");
  const tn = await getTranslations("nav");

  return (
    <FarmPageShell
      title={t("tools.sellOrWait.title")}
      lede={t("tools.sellOrWait.desc")}
      breadcrumbs={[
        { href: "/", label: tn("home") },
        { href: "/farm", label: t("hub.title") },
        { label: t("tools.sellOrWait.title") },
      ]}
    >
      <SellOrWaitCalculator />
    </FarmPageShell>
  );
}
