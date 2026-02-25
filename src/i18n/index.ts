import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Only load PT (default) synchronously — others loaded on demand
import pt from "./locales/pt.json";

export const languages = [
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
];

const supportedLngs = languages.map((l) => l.code);

// Dynamic locale loaders — only fetched when needed
const localeLoaders: Record<string, () => Promise<{ default: Record<string, any> }>> = {
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
  if (lng === "pt" || i18n.hasResourceBundle(lng, "translation")) return;
  const loader = localeLoaders[lng];
  if (!loader) return;
  try {
    const mod = await loader();
    i18n.addResourceBundle(lng, "translation", mod.default, true, true);
  } catch (e) {
    console.warn(`Failed to load locale: ${lng}`, e);
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
    },
    fallbackLng: "pt",
    supportedLngs,
    load: "languageOnly",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      convertDetectedLanguage: (lng: string) => lng.split("-")[0],
    },
  });

// Load detected language if not PT
if (i18n.language && i18n.language !== "pt") {
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
