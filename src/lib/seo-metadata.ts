import { getTranslations } from "next-intl/server";
import { buildPageMetadata, type BuildPageMetadataInput } from "@/lib/seo";

/** Locale board/static page metadata from `seo.*` message keys. */
export async function seoMessagesMetadata(
  locale: string,
  path: string,
  messageKey: string,
  extras?: Partial<BuildPageMetadataInput>,
) {
  const t = await getTranslations({ locale, namespace: "seo" });
  return buildPageMetadata({
    locale,
    path,
    title: t(`${messageKey}.title`),
    description: t(`${messageKey}.description`),
    ...extras,
  });
}
