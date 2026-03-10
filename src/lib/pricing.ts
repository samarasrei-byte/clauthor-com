// Regional pricing configuration with fixed prices per market
// All prices are defined per region/currency to avoid floating point conversion issues

export interface RegionalPricing {
  currency: string;
  symbol: string;
  locale: string;
  plans: {
    starter: number;
    growth: number;
  };
  tokenPacks: {
    pack5m: number;
    pack15m: number;
    pack50m: number;
    pack100m: number;
  };
  comparison: {
    avgSalary: number;
    avgSalaryYear3: number;
    agentStarting: number;
    agentYear3: number;
  };
  departments: {
    tecnologia: number;
    comercial: number;
    marketing: number;
    financeiro: number;
    criacao: number;
    suporte: number;
    rh: number;
  };
  departmentClt: {
    tecnologia: number;
    comercial: number;
    marketing: number;
    financeiro: number;
    criacao: number;
    suporte: number;
    rh: number;
  };
}

// CLT comparison costs (same across regions for reference)
const cltCosts = { tecnologia: 72000, comercial: 52000, marketing: 44000, financeiro: 48000, criacao: 36000, suporte: 32000, rh: 28000 };

export const regionalPricing: Record<string, RegionalPricing> = {
  pt: {
    currency: "BRL", symbol: "R$", locale: "pt-BR",
    plans: { starter: 697, growth: 1497 },
    tokenPacks: { pack5m: 197, pack15m: 497, pack50m: 1297, pack100m: 2497 },
    comparison: { avgSalary: 4500, avgSalaryYear3: 272160, agentStarting: 197, agentYear3: 7092 },
    departments: { tecnologia: 5497, comercial: 4497, marketing: 3997, financeiro: 4497, criacao: 2997, suporte: 2997, rh: 1497 },
    departmentClt: cltCosts,
  },
  "pt-pt": {
    currency: "EUR", symbol: "€", locale: "pt-PT",
    plans: { starter: 129, growth: 279 },
    tokenPacks: { pack5m: 39, pack15m: 99, pack50m: 249, pack100m: 479 },
    comparison: { avgSalary: 2200, avgSalaryYear3: 132000, agentStarting: 39, agentYear3: 1404 },
    departments: { tecnologia: 999, comercial: 849, marketing: 749, financeiro: 849, criacao: 549, suporte: 549, rh: 279 },
    departmentClt: cltCosts,
  },
  en: {
    currency: "USD", symbol: "$", locale: "en-US",
    plans: { starter: 139, growth: 299 },
    tokenPacks: { pack5m: 39, pack15m: 99, pack50m: 259, pack100m: 499 },
    comparison: { avgSalary: 5500, avgSalaryYear3: 330000, agentStarting: 39, agentYear3: 1404 },
    departments: { tecnologia: 1099, comercial: 899, marketing: 799, financeiro: 899, criacao: 599, suporte: 599, rh: 299 },
    departmentClt: cltCosts,
  },
  es: {
    currency: "USD", symbol: "$", locale: "es-MX",
    plans: { starter: 139, growth: 299 },
    tokenPacks: { pack5m: 39, pack15m: 99, pack50m: 259, pack100m: 499 },
    comparison: { avgSalary: 2000, avgSalaryYear3: 120000, agentStarting: 39, agentYear3: 1404 },
    departments: { tecnologia: 1099, comercial: 899, marketing: 799, financeiro: 899, criacao: 599, suporte: 599, rh: 299 },
    departmentClt: cltCosts,
  },
  fr: {
    currency: "EUR", symbol: "€", locale: "fr-FR",
    plans: { starter: 129, growth: 279 },
    tokenPacks: { pack5m: 39, pack15m: 99, pack50m: 249, pack100m: 479 },
    comparison: { avgSalary: 3500, avgSalaryYear3: 210000, agentStarting: 39, agentYear3: 1404 },
    departments: { tecnologia: 999, comercial: 849, marketing: 749, financeiro: 849, criacao: 549, suporte: 549, rh: 279 },
    departmentClt: cltCosts,
  },
  de: {
    currency: "EUR", symbol: "€", locale: "de-DE",
    plans: { starter: 129, growth: 279 },
    tokenPacks: { pack5m: 39, pack15m: 99, pack50m: 249, pack100m: 479 },
    comparison: { avgSalary: 4200, avgSalaryYear3: 252000, agentStarting: 39, agentYear3: 1404 },
    departments: { tecnologia: 999, comercial: 849, marketing: 749, financeiro: 849, criacao: 549, suporte: 549, rh: 279 },
    departmentClt: cltCosts,
  },
  it: {
    currency: "EUR", symbol: "€", locale: "it-IT",
    plans: { starter: 129, growth: 279 },
    tokenPacks: { pack5m: 39, pack15m: 99, pack50m: 249, pack100m: 479 },
    comparison: { avgSalary: 2800, avgSalaryYear3: 168000, agentStarting: 39, agentYear3: 1404 },
    departments: { tecnologia: 999, comercial: 849, marketing: 749, financeiro: 849, criacao: 549, suporte: 549, rh: 279 },
    departmentClt: cltCosts,
  },
  ja: {
    currency: "JPY", symbol: "¥", locale: "ja-JP",
    plans: { starter: 19800, growth: 42800 },
    tokenPacks: { pack5m: 5800, pack15m: 14800, pack50m: 38800, pack100m: 74800 },
    comparison: { avgSalary: 400000, avgSalaryYear3: 24000000, agentStarting: 5800, agentYear3: 208800 },
    departments: { tecnologia: 159800, comercial: 129800, marketing: 114800, financeiro: 129800, criacao: 84800, suporte: 84800, rh: 42800 },
    departmentClt: cltCosts,
  },
  zh: {
    currency: "CNY", symbol: "¥", locale: "zh-CN",
    plans: { starter: 999, growth: 2099 },
    tokenPacks: { pack5m: 279, pack15m: 699, pack50m: 1799, pack100m: 3499 },
    comparison: { avgSalary: 15000, avgSalaryYear3: 900000, agentStarting: 279, agentYear3: 10044 },
    departments: { tecnologia: 7699, comercial: 6299, marketing: 5599, financeiro: 6299, criacao: 3999, suporte: 3999, rh: 2099 },
    departmentClt: cltCosts,
  },
  ar: {
    currency: "SAR", symbol: "﷼", locale: "ar-SA",
    plans: { starter: 519, growth: 1119 },
    tokenPacks: { pack5m: 149, pack15m: 369, pack50m: 969, pack100m: 1869 },
    comparison: { avgSalary: 12000, avgSalaryYear3: 720000, agentStarting: 149, agentYear3: 5364 },
    departments: { tecnologia: 4119, comercial: 3369, marketing: 2999, financeiro: 3369, criacao: 2249, suporte: 2249, rh: 1119 },
    departmentClt: cltCosts,
  },
  hi: {
    currency: "INR", symbol: "₹", locale: "hi-IN",
    plans: { starter: 11499, growth: 24999 },
    tokenPacks: { pack5m: 3299, pack15m: 8299, pack50m: 21499, pack100m: 41499 },
    comparison: { avgSalary: 60000, avgSalaryYear3: 3600000, agentStarting: 3299, agentYear3: 118764 },
    departments: { tecnologia: 91499, comercial: 74999, marketing: 66499, financeiro: 74999, criacao: 49999, suporte: 49999, rh: 24999 },
    departmentClt: cltCosts,
  },
  ru: {
    currency: "RUB", symbol: "₽", locale: "ru-RU",
    plans: { starter: 12900, growth: 27900 },
    tokenPacks: { pack5m: 3600, pack15m: 9200, pack50m: 23900, pack100m: 45900 },
    comparison: { avgSalary: 100000, avgSalaryYear3: 6000000, agentStarting: 3600, agentYear3: 129600 },
    departments: { tecnologia: 99900, comercial: 82900, marketing: 72900, financeiro: 82900, criacao: 54900, suporte: 54900, rh: 27900 },
    departmentClt: cltCosts,
  },
  ko: {
    currency: "KRW", symbol: "₩", locale: "ko-KR",
    plans: { starter: 189000, growth: 399000 },
    tokenPacks: { pack5m: 52900, pack15m: 134900, pack50m: 349900, pack100m: 674900 },
    comparison: { avgSalary: 4000000, avgSalaryYear3: 240000000, agentStarting: 52900, agentYear3: 1904400 },
    departments: { tecnologia: 1489000, comercial: 1219000, marketing: 1079000, financeiro: 1219000, criacao: 809000, suporte: 809000, rh: 399000 },
    departmentClt: cltCosts,
  },
  tr: {
    currency: "TRY", symbol: "₺", locale: "tr-TR",
    plans: { starter: 4499, growth: 9699 },
    tokenPacks: { pack5m: 1299, pack15m: 3199, pack50m: 8399, pack100m: 15999 },
    comparison: { avgSalary: 30000, avgSalaryYear3: 1800000, agentStarting: 1299, agentYear3: 46764 },
    departments: { tecnologia: 34999, comercial: 28999, marketing: 25499, financeiro: 28999, criacao: 18999, suporte: 18999, rh: 9699 },
    departmentClt: cltCosts,
  },
};

export function getRegion(lang: string): RegionalPricing {
  return regionalPricing[lang] || regionalPricing.en;
}

export function formatPrice(amount: number, lang: string): string {
  const region = getRegion(lang);
  return new Intl.NumberFormat(region.locale, {
    style: "currency",
    currency: region.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPriceShort(amount: number, lang: string): string {
  const region = getRegion(lang);
  return `${region.symbol} ${new Intl.NumberFormat(region.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

// Backward-compatible exports for Library.tsx and AgentLanding
export type PriceTier = "starter" | "entry" | "mid" | "high" | "premium";

// Real tier prices per region (monthly, per agent)
const brlTiers: Record<PriceTier, number> = { starter: 197, entry: 397, mid: 697, high: 1297, premium: 2197 };
const usdTiers: Record<PriceTier, number> = { starter: 39, entry: 79, mid: 139, high: 259, premium: 439 };
const eurTiers: Record<PriceTier, number> = { starter: 36, entry: 72, mid: 129, high: 239, premium: 399 };
const jpyTiers: Record<PriceTier, number> = { starter: 5800, entry: 11800, mid: 19800, high: 38800, premium: 64800 };
const cnyTiers: Record<PriceTier, number> = { starter: 279, entry: 559, mid: 999, high: 1799, premium: 3099 };
const sarTiers: Record<PriceTier, number> = { starter: 149, entry: 299, mid: 519, high: 969, premium: 1649 };
const inrTiers: Record<PriceTier, number> = { starter: 3299, entry: 6599, mid: 11499, high: 21499, premium: 36499 };
const rubTiers: Record<PriceTier, number> = { starter: 3600, entry: 7200, mid: 12900, high: 23900, premium: 40900 };
const krwTiers: Record<PriceTier, number> = { starter: 52900, entry: 106900, mid: 189000, high: 349900, premium: 594900 };
const tryTiers: Record<PriceTier, number> = { starter: 1299, entry: 2599, mid: 4499, high: 8399, premium: 14299 };

const priceTierValues: Record<string, Record<PriceTier, number>> = {
  pt: brlTiers,
  "pt-pt": eurTiers,
  en: usdTiers,
  es: usdTiers,
  fr: eurTiers,
  de: eurTiers,
  it: eurTiers,
  ja: jpyTiers,
  zh: cnyTiers,
  ar: sarTiers,
  hi: inrTiers,
  ru: rubTiers,
  ko: krwTiers,
  tr: tryTiers,
};

export function getPrice(lang: string, priceTier: PriceTier): number {
  const tiers = priceTierValues[lang] || priceTierValues.pt;
  return tiers[priceTier];
}

export function getPriceDisplay(lang: string, priceTier: PriceTier): string {
  return formatPrice(getPrice(lang, priceTier), lang);
}
