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
    plans: { starter: 199, growth: 399 },
    tokenPacks: { pack5m: 59, pack15m: 149, pack50m: 369, pack100m: 699 },
    comparison: { avgSalary: 2000, avgSalaryYear3: 120000, agentStarting: 59, agentYear3: 2124 },
    departments: { tecnologia: 1499, comercial: 1199, marketing: 1099, financeiro: 1199, criacao: 799, suporte: 799, rh: 399 },
    departmentClt: cltCosts,
  },
  fr: {
    currency: "EUR", symbol: "€", locale: "fr-FR",
    plans: { starter: 179, growth: 379 },
    tokenPacks: { pack5m: 54, pack15m: 139, pack50m: 349, pack100m: 679 },
    comparison: { avgSalary: 3500, avgSalaryYear3: 210000, agentStarting: 54, agentYear3: 1944 },
    departments: { tecnologia: 1399, comercial: 1149, marketing: 999, financeiro: 1149, criacao: 749, suporte: 749, rh: 379 },
    departmentClt: cltCosts,
  },
  de: {
    currency: "EUR", symbol: "€", locale: "de-DE",
    plans: { starter: 179, growth: 379 },
    tokenPacks: { pack5m: 54, pack15m: 139, pack50m: 349, pack100m: 679 },
    comparison: { avgSalary: 4200, avgSalaryYear3: 252000, agentStarting: 54, agentYear3: 1944 },
    departments: { tecnologia: 1399, comercial: 1149, marketing: 999, financeiro: 1149, criacao: 749, suporte: 749, rh: 379 },
    departmentClt: cltCosts,
  },
  it: {
    currency: "EUR", symbol: "€", locale: "it-IT",
    plans: { starter: 179, growth: 379 },
    tokenPacks: { pack5m: 54, pack15m: 139, pack50m: 349, pack100m: 679 },
    comparison: { avgSalary: 2800, avgSalaryYear3: 168000, agentStarting: 54, agentYear3: 1944 },
    departments: { tecnologia: 1399, comercial: 1149, marketing: 999, financeiro: 1149, criacao: 749, suporte: 749, rh: 379 },
    departmentClt: cltCosts,
  },
  ja: {
    currency: "JPY", symbol: "¥", locale: "ja-JP",
    plans: { starter: 29800, growth: 59800 },
    tokenPacks: { pack5m: 8800, pack15m: 21800, pack50m: 53800, pack100m: 104800 },
    comparison: { avgSalary: 400000, avgSalaryYear3: 24000000, agentStarting: 8800, agentYear3: 316800 },
    departments: { tecnologia: 219800, comercial: 179800, marketing: 159800, financeiro: 179800, criacao: 119800, suporte: 119800, rh: 59800 },
    departmentClt: cltCosts,
  },
  zh: {
    currency: "CNY", symbol: "¥", locale: "zh-CN",
    plans: { starter: 1399, growth: 2799 },
    tokenPacks: { pack5m: 419, pack15m: 999, pack50m: 2499, pack100m: 4899 },
    comparison: { avgSalary: 15000, avgSalaryYear3: 900000, agentStarting: 419, agentYear3: 15084 },
    departments: { tecnologia: 10499, comercial: 8599, marketing: 7599, financeiro: 8599, criacao: 5599, suporte: 5599, rh: 2799 },
    departmentClt: cltCosts,
  },
  ar: {
    currency: "SAR", symbol: "﷼", locale: "ar-SA",
    plans: { starter: 749, growth: 1499 },
    tokenPacks: { pack5m: 219, pack15m: 529, pack50m: 1349, pack100m: 2599 },
    comparison: { avgSalary: 12000, avgSalaryYear3: 720000, agentStarting: 219, agentYear3: 7884 },
    departments: { tecnologia: 5599, comercial: 4599, marketing: 3999, financeiro: 4599, criacao: 2999, suporte: 2999, rh: 1499 },
    departmentClt: cltCosts,
  },
  hi: {
    currency: "INR", symbol: "₹", locale: "hi-IN",
    plans: { starter: 16499, growth: 33999 },
    tokenPacks: { pack5m: 4999, pack15m: 11999, pack50m: 29999, pack100m: 57999 },
    comparison: { avgSalary: 60000, avgSalaryYear3: 3600000, agentStarting: 4999, agentYear3: 179964 },
    departments: { tecnologia: 124999, comercial: 99999, marketing: 89999, financeiro: 99999, criacao: 66999, suporte: 66999, rh: 33999 },
    departmentClt: cltCosts,
  },
  ru: {
    currency: "RUB", symbol: "₽", locale: "ru-RU",
    plans: { starter: 17900, growth: 37900 },
    tokenPacks: { pack5m: 5400, pack15m: 12900, pack50m: 32900, pack100m: 63900 },
    comparison: { avgSalary: 100000, avgSalaryYear3: 6000000, agentStarting: 5400, agentYear3: 194400 },
    departments: { tecnologia: 134900, comercial: 112900, marketing: 99900, financeiro: 112900, criacao: 74900, suporte: 74900, rh: 37900 },
    departmentClt: cltCosts,
  },
  ko: {
    currency: "KRW", symbol: "₩", locale: "ko-KR",
    plans: { starter: 269000, growth: 549000 },
    tokenPacks: { pack5m: 79900, pack15m: 199900, pack50m: 479900, pack100m: 939900 },
    comparison: { avgSalary: 4000000, avgSalaryYear3: 240000000, agentStarting: 79900, agentYear3: 2876400 },
    departments: { tecnologia: 1999000, comercial: 1649000, marketing: 1449000, financeiro: 1649000, criacao: 1099000, suporte: 1099000, rh: 549000 },
    departmentClt: cltCosts,
  },
  tr: {
    currency: "TRY", symbol: "₺", locale: "tr-TR",
    plans: { starter: 6499, growth: 12999 },
    tokenPacks: { pack5m: 1899, pack15m: 4599, pack50m: 11699, pack100m: 21999 },
    comparison: { avgSalary: 30000, avgSalaryYear3: 1800000, agentStarting: 1899, agentYear3: 68364 },
    departments: { tecnologia: 47999, comercial: 38999, marketing: 34999, financeiro: 38999, criacao: 25999, suporte: 25999, rh: 12999 },
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
