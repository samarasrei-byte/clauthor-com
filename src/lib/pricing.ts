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
    plans: { starter: 1697, growth: 2997 },
    tokenPacks: { pack5m: 497, pack15m: 997, pack50m: 2497, pack100m: 4997 },
    comparison: { avgSalary: 4500, avgSalaryYear3: 272160, agentStarting: 497, agentYear3: 17892 },
    departments: { tecnologia: 12997, comercial: 9997, marketing: 7997, financeiro: 9997, criacao: 5997, suporte: 5997, rh: 2997 },
    departmentClt: cltCosts,
  },
  "pt-pt": {
    currency: "EUR", symbol: "€", locale: "pt-PT",
    plans: { starter: 299, growth: 599 },
    tokenPacks: { pack5m: 89, pack15m: 219, pack50m: 549, pack100m: 1099 },
    comparison: { avgSalary: 2200, avgSalaryYear3: 132000, agentStarting: 89, agentYear3: 3204 },
    departments: { tecnologia: 2399, comercial: 1899, marketing: 1599, financeiro: 1899, criacao: 1199, suporte: 1199, rh: 599 },
    departmentClt: cltCosts,
  },
  en: {
    currency: "USD", symbol: "$", locale: "en-US",
    plans: { starter: 339, growth: 599 },
    tokenPacks: { pack5m: 99, pack15m: 249, pack50m: 599, pack100m: 1199 },
    comparison: { avgSalary: 5500, avgSalaryYear3: 330000, agentStarting: 99, agentYear3: 3564 },
    departments: { tecnologia: 2499, comercial: 1999, marketing: 1699, financeiro: 1999, criacao: 1299, suporte: 1299, rh: 599 },
    departmentClt: cltCosts,
  },
  es: {
    currency: "USD", symbol: "$", locale: "es-MX",
    plans: { starter: 339, growth: 599 },
    tokenPacks: { pack5m: 99, pack15m: 249, pack50m: 599, pack100m: 1199 },
    comparison: { avgSalary: 2000, avgSalaryYear3: 120000, agentStarting: 99, agentYear3: 3564 },
    departments: { tecnologia: 2499, comercial: 1999, marketing: 1699, financeiro: 1999, criacao: 1299, suporte: 1299, rh: 599 },
    departmentClt: cltCosts,
  },
  fr: {
    currency: "EUR", symbol: "€", locale: "fr-FR",
    plans: { starter: 299, growth: 599 },
    tokenPacks: { pack5m: 89, pack15m: 219, pack50m: 549, pack100m: 1099 },
    comparison: { avgSalary: 3500, avgSalaryYear3: 210000, agentStarting: 89, agentYear3: 3204 },
    departments: { tecnologia: 2399, comercial: 1899, marketing: 1599, financeiro: 1899, criacao: 1199, suporte: 1199, rh: 599 },
    departmentClt: cltCosts,
  },
  de: {
    currency: "EUR", symbol: "€", locale: "de-DE",
    plans: { starter: 299, growth: 599 },
    tokenPacks: { pack5m: 89, pack15m: 219, pack50m: 549, pack100m: 1099 },
    comparison: { avgSalary: 4200, avgSalaryYear3: 252000, agentStarting: 89, agentYear3: 3204 },
    departments: { tecnologia: 2399, comercial: 1899, marketing: 1599, financeiro: 1899, criacao: 1199, suporte: 1199, rh: 599 },
    departmentClt: cltCosts,
  },
  it: {
    currency: "EUR", symbol: "€", locale: "it-IT",
    plans: { starter: 299, growth: 599 },
    tokenPacks: { pack5m: 89, pack15m: 219, pack50m: 549, pack100m: 1099 },
    comparison: { avgSalary: 2800, avgSalaryYear3: 168000, agentStarting: 89, agentYear3: 3204 },
    departments: { tecnologia: 2399, comercial: 1899, marketing: 1599, financeiro: 1899, criacao: 1199, suporte: 1199, rh: 599 },
    departmentClt: cltCosts,
  },
  ja: {
    currency: "JPY", symbol: "¥", locale: "ja-JP",
    plans: { starter: 49800, growth: 89800 },
    tokenPacks: { pack5m: 14800, pack15m: 34800, pack50m: 89800, pack100m: 179800 },
    comparison: { avgSalary: 400000, avgSalaryYear3: 24000000, agentStarting: 14800, agentYear3: 532800 },
    departments: { tecnologia: 369800, comercial: 299800, marketing: 249800, financeiro: 299800, criacao: 179800, suporte: 179800, rh: 89800 },
    departmentClt: cltCosts,
  },
  zh: {
    currency: "CNY", symbol: "¥", locale: "zh-CN",
    plans: { starter: 2399, growth: 4299 },
    tokenPacks: { pack5m: 699, pack15m: 1699, pack50m: 4299, pack100m: 8299 },
    comparison: { avgSalary: 15000, avgSalaryYear3: 900000, agentStarting: 699, agentYear3: 25164 },
    departments: { tecnologia: 17999, comercial: 14499, marketing: 11999, financeiro: 14499, criacao: 8999, suporte: 8999, rh: 4299 },
    departmentClt: cltCosts,
  },
  ar: {
    currency: "SAR", symbol: "﷼", locale: "ar-SA",
    plans: { starter: 1269, growth: 2249 },
    tokenPacks: { pack5m: 369, pack15m: 899, pack50m: 2249, pack100m: 4499 },
    comparison: { avgSalary: 12000, avgSalaryYear3: 720000, agentStarting: 369, agentYear3: 13284 },
    departments: { tecnologia: 9499, comercial: 7499, marketing: 6499, financeiro: 7499, criacao: 4999, suporte: 4999, rh: 2249 },
    departmentClt: cltCosts,
  },
  hi: {
    currency: "INR", symbol: "₹", locale: "hi-IN",
    plans: { starter: 28299, growth: 49999 },
    tokenPacks: { pack5m: 8299, pack15m: 19999, pack50m: 49999, pack100m: 99999 },
    comparison: { avgSalary: 60000, avgSalaryYear3: 3600000, agentStarting: 8299, agentYear3: 298764 },
    departments: { tecnologia: 209999, comercial: 169999, marketing: 139999, financeiro: 169999, criacao: 109999, suporte: 109999, rh: 49999 },
    departmentClt: cltCosts,
  },
  ru: {
    currency: "RUB", symbol: "₽", locale: "ru-RU",
    plans: { starter: 30999, growth: 54999 },
    tokenPacks: { pack5m: 8999, pack15m: 21999, pack50m: 54999, pack100m: 109999 },
    comparison: { avgSalary: 100000, avgSalaryYear3: 6000000, agentStarting: 8999, agentYear3: 323964 },
    departments: { tecnologia: 224999, comercial: 179999, marketing: 149999, financeiro: 179999, criacao: 119999, suporte: 119999, rh: 54999 },
    departmentClt: cltCosts,
  },
  ko: {
    currency: "KRW", symbol: "₩", locale: "ko-KR",
    plans: { starter: 452900, growth: 799900 },
    tokenPacks: { pack5m: 132900, pack15m: 329900, pack50m: 799900, pack100m: 1599900 },
    comparison: { avgSalary: 4000000, avgSalaryYear3: 240000000, agentStarting: 132900, agentYear3: 4784400 },
    departments: { tecnologia: 3329000, comercial: 2659000, marketing: 2259000, financeiro: 2659000, criacao: 1729000, suporte: 1729000, rh: 799900 },
    departmentClt: cltCosts,
  },
  tr: {
    currency: "TRY", symbol: "₺", locale: "tr-TR",
    plans: { starter: 10799, growth: 19499 },
    tokenPacks: { pack5m: 3199, pack15m: 7799, pack50m: 19499, pack100m: 38999 },
    comparison: { avgSalary: 30000, avgSalaryYear3: 1800000, agentStarting: 3199, agentYear3: 115164 },
    departments: { tecnologia: 79999, comercial: 64999, marketing: 54999, financeiro: 64999, criacao: 42999, suporte: 42999, rh: 19499 },
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
const brlTiers: Record<PriceTier, number> = { starter: 497, entry: 997, mid: 1697, high: 2497, premium: 4997 };
const usdTiers: Record<PriceTier, number> = { starter: 99, entry: 199, mid: 339, high: 499, premium: 999 };
const eurTiers: Record<PriceTier, number> = { starter: 89, entry: 179, mid: 299, high: 449, premium: 899 };
const jpyTiers: Record<PriceTier, number> = { starter: 14800, entry: 29800, mid: 49800, high: 74800, premium: 149800 };
const cnyTiers: Record<PriceTier, number> = { starter: 699, entry: 1399, mid: 2399, high: 3499, premium: 6999 };
const sarTiers: Record<PriceTier, number> = { starter: 369, entry: 749, mid: 1269, high: 1869, premium: 3749 };
const inrTiers: Record<PriceTier, number> = { starter: 8299, entry: 16599, mid: 28299, high: 41499, premium: 83499 };
const rubTiers: Record<PriceTier, number> = { starter: 8999, entry: 17999, mid: 30999, high: 44999, premium: 89999 };
const krwTiers: Record<PriceTier, number> = { starter: 132900, entry: 265900, mid: 452900, high: 665900, premium: 1329900 };
const tryTiers: Record<PriceTier, number> = { starter: 3199, entry: 6399, mid: 10799, high: 15999, premium: 31999 };

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
  const tiers = priceTierValues[lang] || priceTierValues.en;
  return tiers[priceTier];
}

export function getPriceDisplay(lang: string, priceTier: PriceTier): string {
  return formatPrice(getPrice(lang, priceTier), lang);
}
