import { DEFAULT_LOCALE, getDictionary, type Dictionary, type SupportedLocale } from "@gibtu/shared";

export function useDictionary(locale: SupportedLocale = DEFAULT_LOCALE): Dictionary {
  return getDictionary(locale);
}
