import { redirect } from "next/navigation";

/** Alias: /exchange → /grow («Ի՞նչ աճեցնել» / Բորսա) */
export default async function ExchangeAliasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/grow`);
}
