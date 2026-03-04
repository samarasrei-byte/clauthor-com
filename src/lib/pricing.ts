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

export const regionalPricing: Record<string, RegionalPricing> = {
  pt: {
    currency: "BRL", symbol: "R$", locale: "pt-BR",
    plans: { starter: 1, growth: 1 },
    tokenPacks: { pack5m: 1, pack15m: 1, pack50m: 1, pack100m: 1 },
    comparison: { avgSalary: 4500, avgSalaryYear3: 272160, agentStarting: 1, agentYear3: 12 },
    departments: { tecnologia: 1, comercial: 1, marketing: 1, financeiro: 1, criacao: 1, suporte: 1, rh: 1 },
    departmentClt: { tecnologia: 72000, comercial: 52000, marketing: 44000, financeiro: 48000, criacao: 36000, suporte: 32000, rh: 28000 },
  },
  en: {
    currency: "USD", symbol: "$", locale: "en-US",
    plans: { starter: 1, growth: 1 },
    tokenPacks: { pack5m: 1, pack15m: 1, pack50m: 1, pack100m: 1 },
    comparison: { avgSalary: 1500, avgSalaryYear3: 54000, agentStarting: 1, agentYear3: 12 },
    departments: { tecnologia: 1, comercial: 1, marketing: 1, financeiro: 1, criacao: 1, suporte: 1, rh: 1 },
    departmentClt: { tecnologia: 16000, comercial: 12000, marketing: 10000, financeiro: 11000, criacao: 8000, suporte: 7000, rh: 6000 },
  },
  es: {
    currency: "USD", symbol: "$", locale: "es-MX",
    plans: { starter: 1, growth: 1 },
    tokenPacks: { pack5m: 1, pack15m: 1, pack50m: 1, pack100m: 1 },
    comparison: { avgSalary: 1500, avgSalaryYear3: 54000, agentStarting: 1, agentYear3: 12 },
    departments: { tecnologia: 1, comercial: 1, marketing: 1, financeiro: 1, criacao: 1, suporte: 1, rh: 1 },
    departmentClt: { tecnologia: 16000, comercial: 12000, marketing: 10000, financeiro: 11000, criacao: 8000, suporte: 7000, rh: 6000 },
  },
  fr: {
    currency: "EUR", symbol: "€", locale: "fr-FR",
    plans: { starter: 1, growth: 1 },
    tokenPacks: { pack5m: 1, pack15m: 1, pack50m: 1, pack100m: 1 },
    comparison: { avgSalary: 1400, avgSalaryYear3: 50400, agentStarting: 1, agentYear3: 12 },
    departments: { tecnologia: 1, comercial: 1, marketing: 1, financeiro: 1, criacao: 1, suporte: 1, rh: 1 },
    departmentClt: { tecnologia: 15000, comercial: 11000, marketing: 9000, financeiro: 10000, criacao: 7500, suporte: 6500, rh: 5500 },
  },
  de: {
    currency: "EUR", symbol: "€", locale: "de-DE",
    plans: { starter: 1, growth: 1 },
    tokenPacks: { pack5m: 1, pack15m: 1, pack50m: 1, pack100m: 1 },
    comparison: { avgSalary: 1400, avgSalaryYear3: 50400, agentStarting: 1, agentYear3: 12 },
    departments: { tecnologia: 1, comercial: 1, marketing: 1, financeiro: 1, criacao: 1, suporte: 1, rh: 1 },
    departmentClt: { tecnologia: 15000, comercial: 11000, marketing: 9000, financeiro: 10000, criacao: 7500, suporte: 6500, rh: 5500 },
  },
  it: {
    currency: "EUR", symbol: "€", locale: "it-IT",
    plans: { starter: 1, growth: 1 },
    tokenPacks: { pack5m: 1, pack15m: 1, pack50m: 1, pack100m: 1 },
    comparison: { avgSalary: 1400, avgSalaryYear3: 50400, agentStarting: 1, agentYear3: 12 },
    departments: { tecnologia: 1, comercial: 1, marketing: 1, financeiro: 1, criacao: 1, suporte: 1, rh: 1 },
    departmentClt: { tecnologia: 15000, comercial: 11000, marketing: 9000, financeiro: 10000, criacao: 7500, suporte: 6500, rh: 5500 },
  },
  ja: {
    currency: "JPY", symbol: "¥", locale: "ja-JP",
    plans: { starter: 1, growth: 1 },
    tokenPacks: { pack5m: 1, pack15m: 1, pack50m: 1, pack100m: 1 },
    comparison: { avgSalary: 225000, avgSalaryYear3: 8100000, agentStarting: 1, agentYear3: 12 },
    departments: { tecnologia: 1, comercial: 1, marketing: 1, financeiro: 1, criacao: 1, suporte: 1, rh: 1 },
    departmentClt: { tecnologia: 2400000, comercial: 1800000, marketing: 1500000, financeiro: 1650000, criacao: 1200000, suporte: 1050000, rh: 900000 },
  },
  zh: {
    currency: "CNY", symbol: "¥", locale: "zh-CN",
    plans: { starter: 1, growth: 1 },
    tokenPacks: { pack5m: 1, pack15m: 1, pack50m: 1, pack100m: 1 },
    comparison: { avgSalary: 10800, avgSalaryYear3: 388800, agentStarting: 1, agentYear3: 12 },
    departments: { tecnologia: 1, comercial: 1, marketing: 1, financeiro: 1, criacao: 1, suporte: 1, rh: 1 },
    departmentClt: { tecnologia: 115000, comercial: 86000, marketing: 72000, financeiro: 79000, criacao: 58000, suporte: 50000, rh: 43000 },
  },
  ar: {
    currency: "SAR", symbol: "﷼", locale: "ar-SA",
    plans: { starter: 1, growth: 1 },
    tokenPacks: { pack5m: 1, pack15m: 1, pack50m: 1, pack100m: 1 },
    comparison: { avgSalary: 5600, avgSalaryYear3: 201600, agentStarting: 1, agentYear3: 12 },
    departments: { tecnologia: 1, comercial: 1, marketing: 1, financeiro: 1, criacao: 1, suporte: 1, rh: 1 },
    departmentClt: { tecnologia: 60000, comercial: 45000, marketing: 37000, financeiro: 41000, criacao: 30000, suporte: 26000, rh: 22000 },
  },
  hi: {
    currency: "INR", symbol: "₹", locale: "hi-IN",
    plans: { starter: 1, growth: 1 },
    tokenPacks: { pack5m: 1, pack15m: 1, pack50m: 1, pack100m: 1 },
    comparison: { avgSalary: 50000, avgSalaryYear3: 1800000, agentStarting: 1, agentYear3: 12 },
    departments: { tecnologia: 1, comercial: 1, marketing: 1, financeiro: 1, criacao: 1, suporte: 1, rh: 1 },
    departmentClt: { tecnologia: 530000, comercial: 400000, marketing: 330000, financeiro: 360000, criacao: 270000, suporte: 230000, rh: 200000 },
  },
  ru: {
    currency: "RUB", symbol: "₽", locale: "ru-RU",
    plans: { starter: 1, growth: 1 },
    tokenPacks: { pack5m: 1, pack15m: 1, pack50m: 1, pack100m: 1 },
    comparison: { avgSalary: 55000, avgSalaryYear3: 1980000, agentStarting: 1, agentYear3: 12 },
    departments: { tecnologia: 1, comercial: 1, marketing: 1, financeiro: 1, criacao: 1, suporte: 1, rh: 1 },
    departmentClt: { tecnologia: 580000, comercial: 430000, marketing: 360000, financeiro: 395000, criacao: 290000, suporte: 250000, rh: 215000 },
  },
  ko: {
    currency: "KRW", symbol: "₩", locale: "ko-KR",
    plans: { starter: 1, growth: 1 },
    tokenPacks: { pack5m: 1, pack15m: 1, pack50m: 1, pack100m: 1 },
    comparison: { avgSalary: 800000, avgSalaryYear3: 28800000, agentStarting: 1, agentYear3: 12 },
    departments: { tecnologia: 1, comercial: 1, marketing: 1, financeiro: 1, criacao: 1, suporte: 1, rh: 1 },
    departmentClt: { tecnologia: 8400000, comercial: 6300000, marketing: 5200000, financeiro: 5700000, criacao: 4200000, suporte: 3600000, rh: 3100000 },
  },
  tr: {
    currency: "TRY", symbol: "₺", locale: "tr-TR",
    plans: { starter: 1, growth: 1 },
    tokenPacks: { pack5m: 1, pack15m: 1, pack50m: 1, pack100m: 1 },
    comparison: { avgSalary: 19000, avgSalaryYear3: 684000, agentStarting: 1, agentYear3: 12 },
    departments: { tecnologia: 1, comercial: 1, marketing: 1, financeiro: 1, criacao: 1, suporte: 1, rh: 1 },
    departmentClt: { tecnologia: 200000, comercial: 150000, marketing: 125000, financeiro: 137000, criacao: 100000, suporte: 87000, rh: 75000 },
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

const priceTierValues: Record<string, Record<PriceTier, number>> = {
  pt: { starter: 1, entry: 1, mid: 1, high: 1, premium: 1 },
  en: { starter: 1, entry: 1, mid: 1, high: 1, premium: 1 },
  es: { starter: 1, entry: 1, mid: 1, high: 1, premium: 1 },
  fr: { starter: 1, entry: 1, mid: 1, high: 1, premium: 1 },
  de: { starter: 1, entry: 1, mid: 1, high: 1, premium: 1 },
  it: { starter: 1, entry: 1, mid: 1, high: 1, premium: 1 },
  ja: { starter: 1, entry: 1, mid: 1, high: 1, premium: 1 },
  zh: { starter: 1, entry: 1, mid: 1, high: 1, premium: 1 },
  ar: { starter: 1, entry: 1, mid: 1, high: 1, premium: 1 },
  hi: { starter: 1, entry: 1, mid: 1, high: 1, premium: 1 },
  ru: { starter: 1, entry: 1, mid: 1, high: 1, premium: 1 },
  ko: { starter: 1, entry: 1, mid: 1, high: 1, premium: 1 },
  tr: { starter: 1, entry: 1, mid: 1, high: 1, premium: 1 },
};

export function getPrice(lang: string, priceTier: PriceTier): number {
  const tiers = priceTierValues[lang] || priceTierValues.pt;
  return tiers[priceTier];
}

export function getPriceDisplay(lang: string, priceTier: PriceTier): string {
  return formatPrice(getPrice(lang, priceTier), lang);
}
