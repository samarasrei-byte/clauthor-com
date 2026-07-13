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

// Pricing calibrated for Claude Sonnet 4 costs ($3/1M input, $15/1M output)
// Target margins: 80-90% - competitive yet profitable
export const regionalPricing: Record<string, RegionalPricing> = {
  pt: {
    currency: "BRL", symbol: "R$", locale: "pt-BR",
    // Starter alinhado ao canonical (src/lib/canonical-copy.ts). Growth = ~3x.
    plans: { starter: 1497, growth: 3997 },
    tokenPacks: { pack5m: 297, pack15m: 697, pack50m: 1497, pack100m: 2797 },
    // comparison.avgSalary alinhado ao CLT canônico (R$ 8.500) — evita divergência
    // entre ROIBenchmark, landing e pricing.
    comparison: { avgSalary: 8500, avgSalaryYear3: 306000, agentStarting: 1497, agentYear3: 53892 },
    departments: { tecnologia: 1650, comercial: 1878, marketing: 1797, financeiro: 1697, criacao: 1297, suporte: 1547, rh: 1477 },
    departmentClt: cltCosts,
  },
  "pt-pt": {
    currency: "EUR", symbol: "€", locale: "pt-PT",
    // Starter alinhado ao tier "high" (≡ agente canônico). Growth ≈ 2,67× starter.
    plans: { starter: 269, growth: 719 },
    tokenPacks: { pack5m: 49, pack15m: 119, pack50m: 279, pack100m: 499 },
    comparison: { avgSalary: 2200, avgSalaryYear3: 132000, agentStarting: 269, agentYear3: 9684 },
    departments: { tecnologia: 449, comercial: 299, marketing: 269, financeiro: 299, criacao: 179, suporte: 109, rh: 179 },
    departmentClt: cltCosts,
  },
  en: {
    currency: "USD", symbol: "$", locale: "en-US",
    // Starter/comparison alinhados ao canonical (USD): agent $297, CLT $5,500.
    plans: { starter: 297, growth: 797 },
    tokenPacks: { pack5m: 59, pack15m: 139, pack50m: 299, pack100m: 549 },
    comparison: { avgSalary: 5500, avgSalaryYear3: 198000, agentStarting: 297, agentYear3: 10692 },
    departments: { tecnologia: 597, comercial: 497, marketing: 397, financeiro: 497, criacao: 397, suporte: 297, rh: 397 },
    departmentClt: cltCosts,
  },
  es: {
    currency: "USD", symbol: "$", locale: "es-MX",
    plans: { starter: 297, growth: 797 },
    tokenPacks: { pack5m: 59, pack15m: 139, pack50m: 299, pack100m: 549 },
    comparison: { avgSalary: 5500, avgSalaryYear3: 198000, agentStarting: 297, agentYear3: 10692 },
    departments: { tecnologia: 597, comercial: 497, marketing: 397, financeiro: 497, criacao: 397, suporte: 297, rh: 397 },
    departmentClt: cltCosts,
  },
  fr: {
    currency: "EUR", symbol: "€", locale: "fr-FR",
    plans: { starter: 269, growth: 719 },
    tokenPacks: { pack5m: 49, pack15m: 119, pack50m: 279, pack100m: 499 },
    comparison: { avgSalary: 3500, avgSalaryYear3: 210000, agentStarting: 269, agentYear3: 9684 },
    departments: { tecnologia: 449, comercial: 299, marketing: 269, financeiro: 299, criacao: 179, suporte: 109, rh: 179 },
    departmentClt: cltCosts,
  },
  de: {
    currency: "EUR", symbol: "€", locale: "de-DE",
    plans: { starter: 269, growth: 719 },
    tokenPacks: { pack5m: 49, pack15m: 119, pack50m: 279, pack100m: 499 },
    comparison: { avgSalary: 4200, avgSalaryYear3: 252000, agentStarting: 269, agentYear3: 9684 },
    departments: { tecnologia: 449, comercial: 299, marketing: 269, financeiro: 299, criacao: 179, suporte: 109, rh: 179 },
    departmentClt: cltCosts,
  },
  it: {
    currency: "EUR", symbol: "€", locale: "it-IT",
    plans: { starter: 269, growth: 719 },
    tokenPacks: { pack5m: 49, pack15m: 119, pack50m: 279, pack100m: 499 },
    comparison: { avgSalary: 2800, avgSalaryYear3: 168000, agentStarting: 269, agentYear3: 9684 },
    departments: { tecnologia: 449, comercial: 299, marketing: 269, financeiro: 299, criacao: 179, suporte: 109, rh: 179 },
    departmentClt: cltCosts,
  },
  ja: {
    currency: "JPY", symbol: "¥", locale: "ja-JP",
    plans: { starter: 44800, growth: 119800 },
    tokenPacks: { pack5m: 8800, pack15m: 19800, pack50m: 44800, pack100m: 82800 },
    comparison: { avgSalary: 400000, avgSalaryYear3: 24000000, agentStarting: 44800, agentYear3: 1612800 },
    departments: { tecnologia: 74800, comercial: 52800, marketing: 44800, financeiro: 52800, criacao: 29800, suporte: 19800, rh: 29800 },
    departmentClt: cltCosts,
  },
  zh: {
    currency: "CNY", symbol: "¥", locale: "zh-CN",
    plans: { starter: 2099, growth: 5599 },
    tokenPacks: { pack5m: 399, pack15m: 999, pack50m: 2099, pack100m: 3899 },
    comparison: { avgSalary: 15000, avgSalaryYear3: 900000, agentStarting: 2099, agentYear3: 75564 },
    departments: { tecnologia: 3499, comercial: 2499, marketing: 2099, financeiro: 2499, criacao: 1399, suporte: 899, rh: 1399 },
    departmentClt: cltCosts,
  },
  ar: {
    currency: "SAR", symbol: "﷼", locale: "ar-SA",
    plans: { starter: 1099, growth: 2899 },
    tokenPacks: { pack5m: 219, pack15m: 519, pack50m: 1099, pack100m: 2049 },
    comparison: { avgSalary: 12000, avgSalaryYear3: 720000, agentStarting: 1099, agentYear3: 39564 },
    departments: { tecnologia: 1869, comercial: 1299, marketing: 1099, financeiro: 1299, criacao: 749, suporte: 469, rh: 749 },
    departmentClt: cltCosts,
  },
  hi: {
    currency: "INR", symbol: "₹", locale: "hi-IN",
    plans: { starter: 24999, growth: 66999 },
    tokenPacks: { pack5m: 4899, pack15m: 11499, pack50m: 24999, pack100m: 45999 },
    comparison: { avgSalary: 60000, avgSalaryYear3: 3600000, agentStarting: 24999, agentYear3: 899964 },
    departments: { tecnologia: 41499, comercial: 28999, marketing: 24999, financeiro: 28999, criacao: 16499, suporte: 10499, rh: 16499 },
    departmentClt: cltCosts,
  },
  ru: {
    currency: "RUB", symbol: "₽", locale: "ru-RU",
    plans: { starter: 27999, growth: 74999 },
    tokenPacks: { pack5m: 5299, pack15m: 12999, pack50m: 27999, pack100m: 49999 },
    comparison: { avgSalary: 100000, avgSalaryYear3: 6000000, agentStarting: 27999, agentYear3: 1007964 },
    departments: { tecnologia: 44999, comercial: 31999, marketing: 27999, financeiro: 31999, criacao: 17999, suporte: 11499, rh: 17999 },
    departmentClt: cltCosts,
  },
  ko: {
    currency: "KRW", symbol: "₩", locale: "ko-KR",
    plans: { starter: 399900, growth: 1069900 },
    tokenPacks: { pack5m: 79900, pack15m: 189900, pack50m: 399900, pack100m: 729900 },
    comparison: { avgSalary: 4000000, avgSalaryYear3: 240000000, agentStarting: 399900, agentYear3: 14396400 },
    departments: { tecnologia: 669900, comercial: 469900, marketing: 399900, financeiro: 469900, criacao: 269900, suporte: 169900, rh: 269900 },
    departmentClt: cltCosts,
  },
  tr: {
    currency: "TRY", symbol: "₺", locale: "tr-TR",
    plans: { starter: 9699, growth: 25999 },
    tokenPacks: { pack5m: 1899, pack15m: 4499, pack50m: 9699, pack100m: 17999 },
    comparison: { avgSalary: 30000, avgSalaryYear3: 1800000, agentStarting: 9699, agentYear3: 349164 },
    departments: { tecnologia: 15999, comercial: 11299, marketing: 9699, financeiro: 11299, criacao: 6399, suporte: 3999, rh: 6399 },
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
export type PriceTier = "starter" | "entry" | "mid" | "high" | "hunter" | "premium";

// Per-agent tier prices calibrated for Claude Sonnet 4 (80-90% margin)
// "hunter" tier covers agents with fixed external-API costs (PhantomBuster, Unipile, LinkedIn)
const brlTiers: Record<PriceTier, number> = { starter: 345, entry: 697, mid: 997, high: 1297, hunter: 1997, premium: 2497 };
const usdTiers: Record<PriceTier, number> = { starter: 59, entry: 139, mid: 197, high: 297, hunter: 397, premium: 497 };
const eurTiers: Record<PriceTier, number> = { starter: 49, entry: 119, mid: 179, high: 269, hunter: 359, premium: 449 };
const jpyTiers: Record<PriceTier, number> = { starter: 8800, entry: 19800, mid: 29800, high: 44800, hunter: 59800, premium: 74800 };
const cnyTiers: Record<PriceTier, number> = { starter: 399, entry: 999, mid: 1399, high: 2099, hunter: 2799, premium: 3499 };
const sarTiers: Record<PriceTier, number> = { starter: 219, entry: 519, mid: 749, high: 1099, hunter: 1499, premium: 1869 };
const inrTiers: Record<PriceTier, number> = { starter: 4899, entry: 11499, mid: 16499, high: 24999, hunter: 32999, premium: 41499 };
const rubTiers: Record<PriceTier, number> = { starter: 5299, entry: 12999, mid: 17999, high: 27999, hunter: 35999, premium: 44999 };
const krwTiers: Record<PriceTier, number> = { starter: 79900, entry: 189900, mid: 269900, high: 399900, hunter: 529900, premium: 669900 };
const tryTiers: Record<PriceTier, number> = { starter: 1899, entry: 4499, mid: 6399, high: 9699, hunter: 12799, premium: 15999 };

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
