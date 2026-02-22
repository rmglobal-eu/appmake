export const locales = ["da", "sv", "en", "es", "zh", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "da";

export const localeNames: Record<Locale, string> = {
  da: "Dansk",
  sv: "Svenska",
  en: "English",
  es: "Español",
  zh: "中文",
  ar: "العربية",
};
