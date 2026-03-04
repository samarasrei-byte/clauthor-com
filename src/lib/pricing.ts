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
    plans: { starter: 697, growth: 1297 },
    tokenPacks: { pack5m: 49, pack15m: 129, pack50m: 349, pack100m: 599 },
    comparison: { avgSalary: 4500, avgSalaryYear3: 272160, agentStarting: 697, agentYear3: 25092 },
    departments: { tecnologia: 5997, comercial: 4497, marketing: 3997, financeiro: 3497, criacao: 3297, suporte: 2997, rh: 2497 },
    departmentClt: { tecnologia: 72000, comercial: 52000, marketing: 44000, financeiro: 48000, criacao: 36000, suporte: 32000, rh: 28000 },
  },
  en: {
    currency: "USD", symbol: "$", locale: "en-US",
    plans: { starter: 139, growth: 259 },
    tokenPacks: { pack5m: 9, pack15m: 25, pack50m: 69, pack100m: 119 },
    comparison: { avgSalary: 1500, avgSalaryYear3: 54000, agentStarting: 139, agentYear3: 5004 },
    departments: { tecnologia: 1199, comercial: 899, marketing: 799, financeiro: 699, criacao: 659, suporte: 599, rh: 499 },
    departmentClt: { tecnologia: 16000, comercial: 12000, marketing: 10000, financeiro: 11000, criacao: 8000, suporte: 7000, rh: 6000 },
  },
  es: {
    currency: "USD", symbol: "$", locale: "es-MX",
    plans: { starter: 139, growth: 259 },
    tokenPacks: { pack5m: 9, pack15m: 25, pack50m: 69, pack100m: 119 },
    comparison: { avgSalary: 1500, avgSalaryYear3: 54000, agentStarting: 139, agentYear3: 5004 },
    departments: { tecnologia: 1199, comercial: 899, marketing: 799, financeiro: 699, criacao: 659, suporte: 599, rh: 499 },
    departmentClt: { tecnologia: 16000, comercial: 12000, marketing: 10000, financeiro: 11000, criacao: 8000, suporte: 7000, rh: 6000 },
  },
  fr: {
    currency: "EUR", symbol: "€", locale: "fr-FR",
    plans: { starter: 129, growth: 239 },
    tokenPacks: { pack5m: 9, pack15m: 23, pack50m: 64, pack100m: 109 },
    comparison: { avgSalary: 1400, avgSalaryYear3: 50400, agentStarting: 129, agentYear3: 4644 },
    departments: { tecnologia: 1099, comercial: 829, marketing: 739, financeiro: 649, criacao: 609, suporte: 549, rh: 459 },
    departmentClt: { tecnologia: 15000, comercial: 11000, marketing: 9000, financeiro: 10000, criacao: 7500, suporte: 6500, rh: 5500 },
  },
  de: {
    currency: "EUR", symbol: "€", locale: "de-DE",
    plans: { starter: 129, growth: 239 },
    tokenPacks: { pack5m: 9, pack15m: 23, pack50m: 64, pack100m: 109 },
    comparison: { avgSalary: 1400, avgSalaryYear3: 50400, agentStarting: 129, agentYear3: 4644 },
    departments: { tecnologia: 1099, comercial: 829, marketing: 739, financeiro: 649, criacao: 609, suporte: 549, rh: 459 },
    departmentClt: { tecnologia: 15000, comercial: 11000, marketing: 9000, financeiro: 10000, criacao: 7500, suporte: 6500, rh: 5500 },
  },
  it: {
    currency: "EUR", symbol: "€", locale: "it-IT",
    plans: { starter: 129, growth: 239 },
    tokenPacks: { pack5m: 9, pack15m: 23, pack50m: 64, pack100m: 109 },
    comparison: { avgSalary: 1400, avgSalaryYear3: 50400, agentStarting: 129, agentYear3: 4644 },
    departments: { tecnologia: 1099, comercial: 829, marketing: 739, financeiro: 649, criacao: 609, suporte: 549, rh: 459 },
    departmentClt: { tecnologia: 15000, comercial: 11000, marketing: 9000, financeiro: 10000, criacao: 7500, suporte: 6500, rh: 5500 },
  },
  ja: {
    currency: "JPY", symbol: "¥", locale: "ja-JP",
    plans: { starter: 20900, growth: 38900 },
    tokenPacks: { pack5m: 1400, pack15m: 3800, pack50m: 10400, pack100m: 17900 },
    comparison: { avgSalary: 225000, avgSalaryYear3: 8100000, agentStarting: 20900, agentYear3: 752400 },
    departments: { tecnologia: 179900, comercial: 134900, marketing: 119900, financeiro: 104900, criacao: 98900, suporte: 89900, rh: 74900 },
    departmentClt: { tecnologia: 2400000, comercial: 1800000, marketing: 1500000, financeiro: 1650000, criacao: 1200000, suporte: 1050000, rh: 900000 },
  },
  zh: {
    currency: "CNY", symbol: "¥", locale: "zh-CN",
    plans: { starter: 999, growth: 1859 },
    tokenPacks: { pack5m: 65, pack15m: 179, pack50m: 489, pack100m: 839 },
    comparison: { avgSalary: 10800, avgSalaryYear3: 388800, agentStarting: 999, agentYear3: 35964 },
    departments: { tecnologia: 8599, comercial: 6449, marketing: 5749, financeiro: 4999, criacao: 4749, suporte: 4299, rh: 3599 },
    departmentClt: { tecnologia: 115000, comercial: 86000, marketing: 72000, financeiro: 79000, criacao: 58000, suporte: 50000, rh: 43000 },
  },
  ar: {
    currency: "SAR", symbol: "﷼", locale: "ar-SA",
    plans: { starter: 519, growth: 969 },
    tokenPacks: { pack5m: 34, pack15m: 94, pack50m: 259, pack100m: 449 },
    comparison: { avgSalary: 5600, avgSalaryYear3: 201600, agentStarting: 519, agentYear3: 18684 },
    departments: { tecnologia: 4499, comercial: 3369, marketing: 2999, financeiro: 2619, criacao: 2469, suporte: 2249, rh: 1869 },
    departmentClt: { tecnologia: 60000, comercial: 45000, marketing: 37000, financeiro: 41000, criacao: 30000, suporte: 26000, rh: 22000 },
  },
  hi: {
    currency: "INR", symbol: "₹", locale: "hi-IN",
    plans: { starter: 11599, growth: 21599 },
    tokenPacks: { pack5m: 749, pack15m: 2099, pack50m: 5799, pack100m: 9999 },
    comparison: { avgSalary: 50000, avgSalaryYear3: 1800000, agentStarting: 11599, agentYear3: 417564 },
    departments: { tecnologia: 99900, comercial: 74900, marketing: 66900, financeiro: 58400, criacao: 54900, suporte: 49900, rh: 41600 },
    departmentClt: { tecnologia: 530000, comercial: 400000, marketing: 330000, financeiro: 360000, criacao: 270000, suporte: 230000, rh: 200000 },
  },
  ru: {
    currency: "RUB", symbol: "₽", locale: "ru-RU",
    plans: { starter: 12900, growth: 23900 },
    tokenPacks: { pack5m: 829, pack15m: 2299, pack50m: 6399, pack100m: 10999 },
    comparison: { avgSalary: 55000, avgSalaryYear3: 1980000, agentStarting: 12900, agentYear3: 464400 },
    departments: { tecnologia: 109900, comercial: 82400, marketing: 73400, financeiro: 64100, criacao: 60500, suporte: 54900, rh: 45800 },
    departmentClt: { tecnologia: 580000, comercial: 430000, marketing: 360000, financeiro: 395000, criacao: 290000, suporte: 250000, rh: 215000 },
  },
  ko: {
    currency: "KRW", symbol: "₩", locale: "ko-KR",
    plans: { starter: 189000, growth: 349000 },
    tokenPacks: { pack5m: 12900, pack15m: 34900, pack50m: 94900, pack100m: 162900 },
    comparison: { avgSalary: 800000, avgSalaryYear3: 28800000, agentStarting: 189000, agentYear3: 6804000 },
    departments: { tecnologia: 1599000, comercial: 1199000, marketing: 1069000, financeiro: 929000, criacao: 879000, suporte: 799000, rh: 669000 },
    departmentClt: { tecnologia: 8400000, comercial: 6300000, marketing: 5200000, financeiro: 5700000, criacao: 4200000, suporte: 3600000, rh: 3100000 },
  },
  tr: {
    currency: "TRY", symbol: "₺", locale: "tr-TR",
    plans: { starter: 4490, growth: 8390 },
    tokenPacks: { pack5m: 290, pack15m: 790, pack50m: 2190, pack100m: 3790 },
    comparison: { avgSalary: 19000, avgSalaryYear3: 684000, agentStarting: 4490, agentYear3: 161640 },
    departments: { tecnologia: 38900, comercial: 29200, marketing: 25900, financeiro: 22700, criacao: 21400, suporte: 19400, rh: 16200 },
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
  pt: { starter: 697, entry: 897, mid: 1297, high: 1797, premium: 2197 },
  en: { starter: 139, entry: 179, mid: 259, high: 359, premium: 439 },
  es: { starter: 139, entry: 179, mid: 259, high: 359, premium: 439 },
  fr: { starter: 129, entry: 165, mid: 239, high: 329, premium: 399 },
  de: { starter: 129, entry: 165, mid: 239, high: 329, premium: 399 },
  it: { starter: 129, entry: 165, mid: 239, high: 329, premium: 399 },
  ja: { starter: 20900, entry: 26900, mid: 38900, high: 53900, premium: 65900 },
  zh: { starter: 999, entry: 1279, mid: 1859, high: 2569, premium: 3139 },
  ar: { starter: 519, entry: 669, mid: 969, high: 1339, premium: 1639 },
  hi: { starter: 11599, entry: 14899, mid: 21599, high: 29899, premium: 36599 },
  ru: { starter: 12900, entry: 16500, mid: 23900, high: 33100, premium: 40500 },
  ko: { starter: 189000, entry: 243000, mid: 349000, high: 486000, premium: 594000 },
  tr: { starter: 4490, entry: 5790, mid: 8390, high: 11590, premium: 14190 },
};

export function getPrice(lang: string, priceTier: PriceTier): number {
  const tiers = priceTierValues[lang] || priceTierValues.pt;
  return tiers[priceTier];
}

export function getPriceDisplay(lang: string, priceTier: PriceTier): string {
  return formatPrice(getPrice(lang, priceTier), lang);
}
