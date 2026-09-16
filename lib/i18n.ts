import { cookies } from "next/headers";

export type Locale = "en" | "lv" | "ru";
export const LOCALES: Locale[] = ["en", "lv", "ru"];
export const DEFAULT_LOCALE: Locale = "en";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get("locale")?.value;
  return (LOCALES as string[]).includes(value || "") ? (value as Locale) : DEFAULT_LOCALE;
}