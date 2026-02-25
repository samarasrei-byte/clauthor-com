import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Locale } from "date-fns";
import { ptBR, enUS, es, fr, de, it, ja, zhCN, ar, hi, ru, ko, tr } from "date-fns/locale";

const localeMap: Record<string, Locale> = {
  pt: ptBR,
  en: enUS,
  es: es,
  fr: fr,
  de: de,
  it: it,
  ja: ja,
  zh: zhCN,
  ar: ar,
  hi: hi,
  ru: ru,
  ko: ko,
  tr: tr,
};

export function useDateLocale(): Locale {
  const { i18n } = useTranslation();
  return useMemo(() => {
    const lang = i18n.language?.split("-")[0] || "pt";
    return localeMap[lang] || ptBR;
  }, [i18n.language]);
}
