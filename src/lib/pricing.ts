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
    plans: { starter: 1197, growth: 2397 },
    tokenPacks: { pack5m: 347, pack15m: 797, pack50m: 1997, pack100m: 3997 },
    comparison: { avgSalary: 4500, avgSalaryYear3: 272160, agentStarting: 347, agentYear3: 12492 },
    departments: { tecnologia: 8997, comercial: 6997, marketing: 5997, financeiro: 6997, criacao: 4797, suporte: 4797, rh: 2397 },
    departmentClt: cltCosts,
  },
  "pt-pt": {
    currency: "EUR", symbol: "€", locale: "pt-PT",
    plans: { starter: 219, growth: 449 },
    tokenPacks: { pack5m: 64, pack15m: 159, pack50m: 399, pack100m: 799 },
    comparison: { avgSalary: 2200, avgSalaryYear3: 132000, agentStarting: 64, agentYear3: 2304 },
    departments: { tecnologia: 1699, comercial: 1399, marketing: 1199, financeiro: 1399, criacao: 899, suporte: 899, rh: 449 },
    departmentClt: cltCosts,
  },
  en: {
    currency: "USD", symbol: "$", locale: "en-US",
    plans: { starter: 239, growth: 479 },
    tokenPacks: { pack5m: 69, pack15m: 169, pack50m: 429, pack100m: 829 },
    comparison: { avgSalary: 5500, avgSalaryYear3: 330000, agentStarting: 69, agentYear3: 2484 },
    departments: { tecnologia: 1799, comercial: 1449, marketing: 1299, financeiro: 1449, criacao: 959, suporte: 959, rh: 479 },
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
const brlTiers: Record<PriceTier, number> = { starter: 347, entry: 697, mid: 1197, high: 1997, premium: 3497 };
const usdTiers: Record<PriceTier, number> = { starter: 69, entry: 139, mid: 239, high: 399, premium: 699 };
const eurTiers: Record<PriceTier, number> = { starter: 64, entry: 129, mid: 219, high: 369, premium: 649 };
const jpyTiers: Record<PriceTier, number> = { starter: 9800, entry: 19800, mid: 34800, high: 59800, premium: 99800 };
const cnyTiers: Record<PriceTier, number> = { starter: 489, entry: 979, mid: 1699, high: 2799, premium: 4899 };
const sarTiers: Record<PriceTier, number> = { starter: 259, entry: 519, mid: 899, high: 1499, premium: 2599 };
const inrTiers: Record<PriceTier, number> = { starter: 5799, entry: 11599, mid: 19999, high: 33499, premium: 58499 };
const rubTiers: Record<PriceTier, number> = { starter: 6299, entry: 12599, mid: 21900, high: 36900, premium: 63900 };
const krwTiers: Record<PriceTier, number> = { starter: 92900, entry: 185900, mid: 319000, high: 529900, premium: 929900 };
const tryTiers: Record<PriceTier, number> = { starter: 2199, entry: 4399, mid: 7499, high: 12999, premium: 22499 };

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
