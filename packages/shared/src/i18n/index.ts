import { en } from "./en";
import { tr } from "./tr";
import type { Dictionary, SupportedLocale } from "./types";

export const DEFAULT_LOCALE: SupportedLocale = "tr";

const dictionaries: Record<SupportedLocale, Dictionary> = {
  tr,
  en,
};

export function getDictionary(locale: SupportedLocale = DEFAULT_LOCALE): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary, SupportedLocale };
