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
  // Comparison section values
  comparison: {
    avgSalary: number;
    avgSalaryYear3: number;  // Cost of 3 employees/year
    agentStarting: number;
    agentYear3: number;      // Agent cost for 3 agents/year
  };
  // Department/squad prices (BRL base)
  departments: {
    tecnologia: number;
    comercial: number;
    marketing: number;
    financeiro: number;
    criacao: number;
    suporte: number;
    rh: number;
  };
  // CLT equivalent costs per department
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

// TEST MODE: All prices set to $0.25 USD equivalent for testing
const TEST_PRICE = 0.25;
const testDepts = { tecnologia: TEST_PRICE, comercial: TEST_PRICE, marketing: TEST_PRICE, financeiro: TEST_PRICE, criacao: TEST_PRICE, suporte: TEST_PRICE, rh: TEST_PRICE };
const testDeptsClt = { tecnologia: 72000, comercial: 52000, marketing: 44000, financeiro: 48000, criacao: 36000, suporte: 32000, rh: 28000 };
const testPlans = { starter: TEST_PRICE, growth: TEST_PRICE };
const testTokenPacks = { pack5m: TEST_PRICE, pack15m: TEST_PRICE, pack50m: TEST_PRICE, pack100m: TEST_PRICE };
const testComparison = { avgSalary: 4500, avgSalaryYear3: 272160, agentStarting: TEST_PRICE, agentYear3: 9 };

export const regionalPricing: Record<string, RegionalPricing> = {
  pt: {
    currency: "BRL", symbol: "R$", locale: "pt-BR",
    plans: testPlans, tokenPacks: testTokenPacks, comparison: testComparison,
    departments: testDepts, departmentClt: testDeptsClt,
  },
  "pt-pt": {
    currency: "EUR", symbol: "€", locale: "pt-PT",
    plans: testPlans, tokenPacks: testTokenPacks, comparison: testComparison,
    departments: testDepts, departmentClt: testDeptsClt,
  },
  en: {
    currency: "USD", symbol: "$", locale: "en-US",
    plans: testPlans, tokenPacks: testTokenPacks, comparison: testComparison,
    departments: testDepts, departmentClt: testDeptsClt,
  },
  es: {
    currency: "USD", symbol: "$", locale: "es-MX",
    plans: testPlans, tokenPacks: testTokenPacks, comparison: testComparison,
    departments: testDepts, departmentClt: testDeptsClt,
  },
  fr: {
    currency: "EUR", symbol: "€", locale: "fr-FR",
    plans: testPlans, tokenPacks: testTokenPacks, comparison: testComparison,
    departments: testDepts, departmentClt: testDeptsClt,
  },
  de: {
    currency: "EUR", symbol: "€", locale: "de-DE",
    plans: testPlans, tokenPacks: testTokenPacks, comparison: testComparison,
    departments: testDepts, departmentClt: testDeptsClt,
  },
  it: {
    currency: "EUR", symbol: "€", locale: "it-IT",
    plans: testPlans, tokenPacks: testTokenPacks, comparison: testComparison,
    departments: testDepts, departmentClt: testDeptsClt,
  },
  ja: {
    currency: "JPY", symbol: "¥", locale: "ja-JP",
    plans: testPlans, tokenPacks: testTokenPacks, comparison: testComparison,
    departments: testDepts, departmentClt: testDeptsClt,
  },
  zh: {
    currency: "CNY", symbol: "¥", locale: "zh-CN",
    plans: testPlans, tokenPacks: testTokenPacks, comparison: testComparison,
    departments: testDepts, departmentClt: testDeptsClt,
  },
  ar: {
    currency: "SAR", symbol: "﷼", locale: "ar-SA",
    plans: testPlans, tokenPacks: testTokenPacks, comparison: testComparison,
    departments: testDepts, departmentClt: testDeptsClt,
  },
  hi: {
    currency: "INR", symbol: "₹", locale: "hi-IN",
    plans: testPlans, tokenPacks: testTokenPacks, comparison: testComparison,
    departments: testDepts, departmentClt: testDeptsClt,
  },
  ru: {
    currency: "RUB", symbol: "₽", locale: "ru-RU",
    plans: testPlans, tokenPacks: testTokenPacks, comparison: testComparison,
    departments: testDepts, departmentClt: testDeptsClt,
  },
  ko: {
    currency: "KRW", symbol: "₩", locale: "ko-KR",
    plans: testPlans, tokenPacks: testTokenPacks, comparison: testComparison,
    departments: testDepts, departmentClt: testDeptsClt,
  },
  tr: {
    currency: "TRY", symbol: "₺", locale: "tr-TR",
    plans: testPlans, tokenPacks: testTokenPacks, comparison: testComparison,
    departments: testDepts, departmentClt: testDeptsClt,
  },
};

export function getRegion(lang: string): RegionalPricing {
  return regionalPricing[lang] || regionalPricing.pt;
}

export function formatPrice(amount: number, lang: string): string {
  const region = getRegion(lang);
  return new Intl.NumberFormat(region.locale, {
    style: "currency",
    currency: region.currency,
    minimumFractionDigits: amount < 1 ? 2 : 0,
    maximumFractionDigits: amount < 1 ? 2 : 0,
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

// TEST MODE: All tier prices set to $0.25
const testTier: Record<PriceTier, number> = { starter: 0.25, entry: 0.25, mid: 0.25, high: 0.25, premium: 0.25 };
const priceTierValues: Record<string, Record<PriceTier, number>> = {
  pt: testTier, "pt-pt": testTier, en: testTier, es: testTier, fr: testTier,
  de: testTier, it: testTier, ja: testTier, zh: testTier, ar: testTier,
  hi: testTier, ru: testTier, ko: testTier, tr: testTier,
};

export function getPrice(lang: string, priceTier: PriceTier): number {
  const tiers = priceTierValues[lang] || priceTierValues.pt;
  return tiers[priceTier];
}

export function getPriceDisplay(lang: string, priceTier: PriceTier): string {
  return formatPrice(getPrice(lang, priceTier), lang);
}
