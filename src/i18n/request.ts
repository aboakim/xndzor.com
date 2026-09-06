import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/** Explicit map so webpack does not context-import every file under messages/. */
const messageLoaders = {
  hy: () => import("../../messages/hy.json"),
  en: () => import("../../messages/en.json"),
  ru: () => import("../../messages/ru.json"),
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "hy" | "ru" | "en")) {
    locale = routing.defaultLocale;
  }
  const load =
    messageLoaders[locale as keyof typeof messageLoaders] ?? messageLoaders.hy;
  return {
    locale,
    messages: (await load()).default,
  };
});
