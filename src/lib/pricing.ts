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
    plans: { starter: 239, growth: 479 },
    tokenPacks: { pack5m: 69, pack15m: 169, pack50m: 429, pack100m: 829 },
    comparison: { avgSalary: 2000, avgSalaryYear3: 120000, agentStarting: 69, agentYear3: 2484 },
    departments: { tecnologia: 1799, comercial: 1449, marketing: 1299, financeiro: 1449, criacao: 959, suporte: 959, rh: 479 },
    departmentClt: cltCosts,
  },
  fr: {
    currency: "EUR", symbol: "€", locale: "fr-FR",
    plans: { starter: 219, growth: 449 },
    tokenPacks: { pack5m: 64, pack15m: 159, pack50m: 399, pack100m: 799 },
    comparison: { avgSalary: 3500, avgSalaryYear3: 210000, agentStarting: 64, agentYear3: 2304 },
    departments: { tecnologia: 1699, comercial: 1399, marketing: 1199, financeiro: 1399, criacao: 899, suporte: 899, rh: 449 },
    departmentClt: cltCosts,
  },
  de: {
    currency: "EUR", symbol: "€", locale: "de-DE",
    plans: { starter: 219, growth: 449 },
    tokenPacks: { pack5m: 64, pack15m: 159, pack50m: 399, pack100m: 799 },
    comparison: { avgSalary: 4200, avgSalaryYear3: 252000, agentStarting: 64, agentYear3: 2304 },
    departments: { tecnologia: 1699, comercial: 1399, marketing: 1199, financeiro: 1399, criacao: 899, suporte: 899, rh: 449 },
    departmentClt: cltCosts,
  },
  it: {
    currency: "EUR", symbol: "€", locale: "it-IT",
    plans: { starter: 219, growth: 449 },
    tokenPacks: { pack5m: 64, pack15m: 159, pack50m: 399, pack100m: 799 },
    comparison: { avgSalary: 2800, avgSalaryYear3: 168000, agentStarting: 64, agentYear3: 2304 },
    departments: { tecnologia: 1699, comercial: 1399, marketing: 1199, financeiro: 1399, criacao: 899, suporte: 899, rh: 449 },
    departmentClt: cltCosts,
  },
  ja: {
    currency: "JPY", symbol: "¥", locale: "ja-JP",
    plans: { starter: 35800, growth: 69800 },
    tokenPacks: { pack5m: 9800, pack15m: 24800, pack50m: 63800, pack100m: 124800 },
    comparison: { avgSalary: 400000, avgSalaryYear3: 24000000, agentStarting: 9800, agentYear3: 352800 },
    departments: { tecnologia: 259800, comercial: 209800, marketing: 189800, financeiro: 209800, criacao: 139800, suporte: 139800, rh: 69800 },
    departmentClt: cltCosts,
  },
  zh: {
    currency: "CNY", symbol: "¥", locale: "zh-CN",
    plans: { starter: 1699, growth: 3399 },
    tokenPacks: { pack5m: 489, pack15m: 1199, pack50m: 2999, pack100m: 5799 },
    comparison: { avgSalary: 15000, avgSalaryYear3: 900000, agentStarting: 489, agentYear3: 17604 },
    departments: { tecnologia: 12499, comercial: 10299, marketing: 8999, financeiro: 10299, criacao: 6699, suporte: 6699, rh: 3399 },
    departmentClt: cltCosts,
  },
  ar: {
    currency: "SAR", symbol: "﷼", locale: "ar-SA",
    plans: { starter: 899, growth: 1799 },
    tokenPacks: { pack5m: 259, pack15m: 629, pack50m: 1599, pack100m: 3099 },
    comparison: { avgSalary: 12000, avgSalaryYear3: 720000, agentStarting: 259, agentYear3: 9324 },
    departments: { tecnologia: 6699, comercial: 5499, marketing: 4799, financeiro: 5499, criacao: 3599, suporte: 3599, rh: 1799 },
    departmentClt: cltCosts,
  },
  hi: {
    currency: "INR", symbol: "₹", locale: "hi-IN",
    plans: { starter: 19999, growth: 39999 },
    tokenPacks: { pack5m: 5799, pack15m: 13999, pack50m: 35999, pack100m: 68999 },
    comparison: { avgSalary: 60000, avgSalaryYear3: 3600000, agentStarting: 5799, agentYear3: 208764 },
    departments: { tecnologia: 149999, comercial: 119999, marketing: 107999, financeiro: 119999, criacao: 79999, suporte: 79999, rh: 39999 },
    departmentClt: cltCosts,
  },
  ru: {
    currency: "RUB", symbol: "₽", locale: "ru-RU",
    plans: { starter: 21900, growth: 44900 },
    tokenPacks: { pack5m: 6299, pack15m: 14900, pack50m: 38900, pack100m: 74900 },
    comparison: { avgSalary: 100000, avgSalaryYear3: 6000000, agentStarting: 6299, agentYear3: 226764 },
    departments: { tecnologia: 159900, comercial: 134900, marketing: 119900, financeiro: 134900, criacao: 89900, suporte: 89900, rh: 44900 },
    departmentClt: cltCosts,
  },
  ko: {
    currency: "KRW", symbol: "₩", locale: "ko-KR",
    plans: { starter: 319000, growth: 649000 },
    tokenPacks: { pack5m: 92900, pack15m: 229900, pack50m: 569900, pack100m: 1099900 },
    comparison: { avgSalary: 4000000, avgSalaryYear3: 240000000, agentStarting: 92900, agentYear3: 3344400 },
    departments: { tecnologia: 2399000, comercial: 1979000, marketing: 1739000, financeiro: 1979000, criacao: 1299000, suporte: 1299000, rh: 649000 },
    departmentClt: cltCosts,
  },
  tr: {
    currency: "TRY", symbol: "₺", locale: "tr-TR",
    plans: { starter: 7799, growth: 15499 },
    tokenPacks: { pack5m: 2199, pack15m: 5399, pack50m: 13999, pack100m: 26499 },
    comparison: { avgSalary: 30000, avgSalaryYear3: 1800000, agentStarting: 2199, agentYear3: 79164 },
    departments: { tecnologia: 57499, comercial: 46499, marketing: 41999, financeiro: 46499, criacao: 30999, suporte: 30999, rh: 15499 },
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
