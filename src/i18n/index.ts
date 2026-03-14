import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Only load PT (default) synchronously — others loaded on demand
import pt from "./locales/pt.json";
import en from "./locales/en.json";

export const languages = [
  { code: "pt", name: "Português", flag: "br" },
  { code: "en", name: "English", flag: "us" },
  { code: "es", name: "Español", flag: "es" },
  { code: "fr", name: "Français", flag: "fr" },
  { code: "de", name: "Deutsch", flag: "de" },
  { code: "it", name: "Italiano", flag: "it" },
  { code: "ja", name: "日本語", flag: "jp" },
  { code: "zh", name: "中文", flag: "cn" },
  { code: "ar", name: "العربية", flag: "sa" },
  { code: "hi", name: "हिन्दी", flag: "in" },
  { code: "ru", name: "Русский", flag: "ru" },
  { code: "ko", name: "한국어", flag: "kr" },
  { code: "tr", name: "Türkçe", flag: "tr" },
];

const supportedLngs = ["pt", ...languages.map((l) => l.code).filter(c => c !== "pt")];

// Dynamic locale loaders — only fetched when needed
const localeLoaders: Record<string, () => Promise<{ default: Record<string, any> }>> = {
  "pt-pt": () => import("./locales/pt.json"),
  en: () => import("./locales/en.json"),
  es: () => import("./locales/es.json"),
  fr: () => import("./locales/fr.json"),
  de: () => import("./locales/de.json"),
  it: () => import("./locales/it.json"),
  ja: () => import("./locales/ja.json"),
  zh: () => import("./locales/zh.json"),
  ar: () => import("./locales/ar.json"),
  hi: () => import("./locales/hi.json"),
  ru: () => import("./locales/ru.json"),
  ko: () => import("./locales/ko.json"),
  tr: () => import("./locales/tr.json"),
};

// Load a locale dynamically and add it to i18n
async function loadLocale(lng: string) {
  if (lng === "en" || lng === "pt" || i18n.hasResourceBundle(lng, "translation")) return;
  const loader = localeLoaders[lng];
  if (!loader) return;
  try {
    const mod = await loader();
    i18n.addResourceBundle(lng, "translation", mod.default, true, true);
  } catch (e) {
    console.warn(`Failed to load locale: ${lng}`, e);
  }
}

// Pre-load a locale before switching — ensures translations are available immediately
export async function changeLanguageSafe(lng: string) {
  await loadLocale(lng);
  await i18n.changeLanguage(lng);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
    },
    fallbackLng: "en",
    supportedLngs,
    load: "languageOnly",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      convertDetectedLanguage: (lng: string) => {
        const lower = lng.toLowerCase();
        // Preserve pt-PT distinction
        if (lower === "pt-pt") return "pt-pt";
        return lng.split("-")[0];
      },
    },
  });

// Load detected language if not EN (already bundled)
if (i18n.language && i18n.language !== "en") {
  loadLocale(i18n.language);
}

// Load locale dynamically on language change
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
  loadLocale(lng);
});

// Set initial lang
if (i18n.language) {
  document.documentElement.lang = i18n.language;
  document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
}

export default i18n;
