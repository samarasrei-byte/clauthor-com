// Regional pricing configuration with fixed prices per market
// Tiered: entrada acessível + upsell para enterprise

export interface RegionalPricing {
  currency: string;
  symbol: string;
  locale: string;
  // Price multiplier relative to BRL base (1.0 = BRL)
  prices: {
    starter: number;    // Starter (baixo consumo)
    entry: number;      // Intermediário
    mid: number;        // Avançado  
    high: number;       // Enterprise
    premium: number;    // Enterprise top
  };
}

export const regionalPricing: Record<string, RegionalPricing> = {
  pt: {
    currency: "BRL",
    symbol: "R$",
    locale: "pt-BR",
    prices: { starter: 397, entry: 797, mid: 1697, high: 3497, premium: 4997 },
  },
  en: {
    currency: "USD",
    symbol: "$",
    locale: "en-US",
    prices: { starter: 97, entry: 197, mid: 397, high: 797, premium: 1197 },
  },
  es: {
    currency: "USD",
    symbol: "$",
    locale: "es-MX",
    prices: { starter: 97, entry: 197, mid: 397, high: 797, premium: 1197 },
  },
  fr: {
    currency: "EUR",
    symbol: "€",
    locale: "fr-FR",
    prices: { starter: 89, entry: 179, mid: 359, high: 719, premium: 1079 },
  },
  de: {
    currency: "EUR",
    symbol: "€",
    locale: "de-DE",
    prices: { starter: 89, entry: 179, mid: 359, high: 719, premium: 1079 },
  },
  it: {
    currency: "EUR",
    symbol: "€",
    locale: "it-IT",
    prices: { starter: 89, entry: 179, mid: 359, high: 719, premium: 1079 },
  },
  ja: {
    currency: "JPY",
    symbol: "¥",
    locale: "ja-JP",
    prices: { starter: 14800, entry: 29800, mid: 59800, high: 119800, premium: 179800 },
  },
  zh: {
    currency: "CNY",
    symbol: "¥",
    locale: "zh-CN",
    prices: { starter: 680, entry: 1380, mid: 2780, high: 5580, premium: 8380 },
  },
  ar: {
    currency: "SAR",
    symbol: "﷼",
    locale: "ar-SA",
    prices: { starter: 370, entry: 740, mid: 1490, high: 2990, premium: 4490 },
  },
  hi: {
    currency: "INR",
    symbol: "₹",
    locale: "hi-IN",
    prices: { starter: 8200, entry: 16500, mid: 33000, high: 66000, premium: 99000 },
  },
  ru: {
    currency: "RUB",
    symbol: "₽",
    locale: "ru-RU",
    prices: { starter: 8900, entry: 17900, mid: 35900, high: 71900, premium: 107900 },
  },
  ko: {
    currency: "KRW",
    symbol: "₩",
    locale: "ko-KR",
    prices: { starter: 129000, entry: 259000, mid: 519000, high: 1039000, premium: 1559000 },
  },
  tr: {
    currency: "TRY",
    symbol: "₺",
    locale: "tr-TR",
    prices: { starter: 3190, entry: 6390, mid: 12790, high: 25590, premium: 38390 },
  },
};

// Map agent tier to price tier
export type PriceTier = "starter" | "entry" | "mid" | "high" | "premium";

export const tierToPriceTier: Record<string, PriceTier> = {
  basic: "starter",
  intermediate: "entry",
  advanced: "mid",
  enterprise: "high",
};

// Some enterprise agents cost more
export function getAgentPriceTier(tier: string, priceLevel?: "premium"): PriceTier {
  if (priceLevel === "premium") return "premium";
  return tierToPriceTier[tier] || "entry";
}

export function formatPrice(amount: number, locale: string): string {
  const region = regionalPricing[locale] || regionalPricing.pt;
  return new Intl.NumberFormat(region.locale, {
    style: "currency",
    currency: region.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getPrice(lang: string, priceTier: PriceTier): number {
  const region = regionalPricing[lang] || regionalPricing.pt;
  return region.prices[priceTier];
}

export function getPriceDisplay(lang: string, priceTier: PriceTier): string {
  const region = regionalPricing[lang] || regionalPricing.pt;
  const amount = region.prices[priceTier];
  return formatPrice(amount, lang);
}
