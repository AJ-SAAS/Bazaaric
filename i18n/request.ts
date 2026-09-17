import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import enMessages from "../messages/en.json";
import lvMessages from "../messages/lv.json";
import ruMessages from "../messages/ru.json";

const messagesByLocale = {
  en: enMessages,
  lv: lvMessages,
  ru: ruMessages,
} as const;

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value;
  const locale =
    cookieLocale && cookieLocale in messagesByLocale
      ? (cookieLocale as keyof typeof messagesByLocale)
      : "en";

  return {
    locale,
    messages: messagesByLocale[locale],
  };
});