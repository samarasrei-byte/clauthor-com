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
    plans: { starter: 900, growth: 1997 },
    tokenPacks: { pack5m: 1997, pack15m: 4997, pack50m: 14997, pack100m: 27997 },
    comparison: { avgSalary: 4500, avgSalaryYear3: 272160, agentStarting: 900, agentYear3: 47964 },
    departments: { tecnologia: 5997, comercial: 4997, marketing: 3997, financeiro: 3497, criacao: 2997, suporte: 2997, rh: 2497 },
    departmentClt: { tecnologia: 72000, comercial: 52000, marketing: 44000, financeiro: 48000, criacao: 36000, suporte: 32000, rh: 28000 },
  },
  en: {
    currency: "USD", symbol: "$", locale: "en-US",
    plans: { starter: 797, growth: 1997 },
    tokenPacks: { pack5m: 397, pack15m: 997, pack50m: 2997, pack100m: 5597 },
    comparison: { avgSalary: 1500, avgSalaryYear3: 54000, agentStarting: 797, agentYear3: 9564 },
    departments: { tecnologia: 1297, comercial: 1097, marketing: 897, financeiro: 797, criacao: 697, suporte: 697, rh: 547 },
    departmentClt: { tecnologia: 16000, comercial: 12000, marketing: 10000, financeiro: 11000, criacao: 8000, suporte: 7000, rh: 6000 },
  },
  es: {
    currency: "USD", symbol: "$", locale: "es-MX",
    plans: { starter: 797, growth: 1997 },
    tokenPacks: { pack5m: 397, pack15m: 997, pack50m: 2997, pack100m: 5597 },
    comparison: { avgSalary: 1500, avgSalaryYear3: 54000, agentStarting: 797, agentYear3: 9564 },
    departments: { tecnologia: 1297, comercial: 1097, marketing: 897, financeiro: 797, criacao: 697, suporte: 697, rh: 547 },
    departmentClt: { tecnologia: 16000, comercial: 12000, marketing: 10000, financeiro: 11000, criacao: 8000, suporte: 7000, rh: 6000 },
  },
  fr: {
    currency: "EUR", symbol: "€", locale: "fr-FR",
    plans: { starter: 729, growth: 1829 },
    tokenPacks: { pack5m: 369, pack15m: 929, pack50m: 2799, pack100m: 5199 },
    comparison: { avgSalary: 1400, avgSalaryYear3: 50400, agentStarting: 729, agentYear3: 8748 },
    departments: { tecnologia: 1199, comercial: 999, marketing: 829, financeiro: 729, criacao: 639, suporte: 639, rh: 499 },
    departmentClt: { tecnologia: 15000, comercial: 11000, marketing: 9000, financeiro: 10000, criacao: 7500, suporte: 6500, rh: 5500 },
  },
  de: {
    currency: "EUR", symbol: "€", locale: "de-DE",
    plans: { starter: 729, growth: 1829 },
    tokenPacks: { pack5m: 369, pack15m: 929, pack50m: 2799, pack100m: 5199 },
    comparison: { avgSalary: 1400, avgSalaryYear3: 50400, agentStarting: 729, agentYear3: 8748 },
    departments: { tecnologia: 1199, comercial: 999, marketing: 829, financeiro: 729, criacao: 639, suporte: 639, rh: 499 },
    departmentClt: { tecnologia: 15000, comercial: 11000, marketing: 9000, financeiro: 10000, criacao: 7500, suporte: 6500, rh: 5500 },
  },
  it: {
    currency: "EUR", symbol: "€", locale: "it-IT",
    plans: { starter: 729, growth: 1829 },
    tokenPacks: { pack5m: 369, pack15m: 929, pack50m: 2799, pack100m: 5199 },
    comparison: { avgSalary: 1400, avgSalaryYear3: 50400, agentStarting: 729, agentYear3: 8748 },
    departments: { tecnologia: 1199, comercial: 999, marketing: 829, financeiro: 729, criacao: 639, suporte: 639, rh: 499 },
    departmentClt: { tecnologia: 15000, comercial: 11000, marketing: 9000, financeiro: 10000, criacao: 7500, suporte: 6500, rh: 5500 },
  },
  ja: {
    currency: "JPY", symbol: "¥", locale: "ja-JP",
    plans: { starter: 119800, growth: 299800 },
    tokenPacks: { pack5m: 59800, pack15m: 149800, pack50m: 449800, pack100m: 839800 },
    comparison: { avgSalary: 225000, avgSalaryYear3: 8100000, agentStarting: 119800, agentYear3: 1437600 },
    departments: { tecnologia: 199800, comercial: 169800, marketing: 139800, financeiro: 119800, criacao: 99800, suporte: 99800, rh: 79800 },
    departmentClt: { tecnologia: 2400000, comercial: 1800000, marketing: 1500000, financeiro: 1650000, criacao: 1200000, suporte: 1050000, rh: 900000 },
  },
  zh: {
    currency: "CNY", symbol: "¥", locale: "zh-CN",
    plans: { starter: 5800, growth: 14500 },
    tokenPacks: { pack5m: 2900, pack15m: 7250, pack50m: 21800, pack100m: 40600 },
    comparison: { avgSalary: 10800, avgSalaryYear3: 388800, agentStarting: 5800, agentYear3: 69600 },
    departments: { tecnologia: 9680, comercial: 8080, marketing: 6680, financeiro: 5880, criacao: 4980, suporte: 4980, rh: 3880 },
    departmentClt: { tecnologia: 115000, comercial: 86000, marketing: 72000, financeiro: 79000, criacao: 58000, suporte: 50000, rh: 43000 },
  },
  ar: {
    currency: "SAR", symbol: "﷼", locale: "ar-SA",
    plans: { starter: 2990, growth: 7490 },
    tokenPacks: { pack5m: 1490, pack15m: 3740, pack50m: 11240, pack100m: 20990 },
    comparison: { avgSalary: 5600, avgSalaryYear3: 201600, agentStarting: 2990, agentYear3: 35880 },
    departments: { tecnologia: 4990, comercial: 4190, marketing: 3490, financeiro: 2990, criacao: 2590, suporte: 2590, rh: 1990 },
    departmentClt: { tecnologia: 60000, comercial: 45000, marketing: 37000, financeiro: 41000, criacao: 30000, suporte: 26000, rh: 22000 },
  },
  hi: {
    currency: "INR", symbol: "₹", locale: "hi-IN",
    plans: { starter: 66000, growth: 165000 },
    tokenPacks: { pack5m: 33000, pack15m: 82500, pack50m: 247500, pack100m: 462000 },
    comparison: { avgSalary: 50000, avgSalaryYear3: 1800000, agentStarting: 66000, agentYear3: 792000 },
    departments: { tecnologia: 110000, comercial: 93500, marketing: 77000, financeiro: 66000, criacao: 55000, suporte: 55000, rh: 44000 },
    departmentClt: { tecnologia: 530000, comercial: 400000, marketing: 330000, financeiro: 360000, criacao: 270000, suporte: 230000, rh: 200000 },
  },
  ru: {
    currency: "RUB", symbol: "₽", locale: "ru-RU",
    plans: { starter: 71900, growth: 179900 },
    tokenPacks: { pack5m: 35900, pack15m: 89900, pack50m: 269900, pack100m: 503900 },
    comparison: { avgSalary: 55000, avgSalaryYear3: 1980000, agentStarting: 71900, agentYear3: 862800 },
    departments: { tecnologia: 119900, comercial: 99900, marketing: 83900, financeiro: 71900, criacao: 59900, suporte: 59900, rh: 47900 },
    departmentClt: { tecnologia: 580000, comercial: 430000, marketing: 360000, financeiro: 395000, criacao: 290000, suporte: 250000, rh: 215000 },
  },
  ko: {
    currency: "KRW", symbol: "₩", locale: "ko-KR",
    plans: { starter: 1039000, growth: 2599000 },
    tokenPacks: { pack5m: 519000, pack15m: 1299000, pack50m: 3899000, pack100m: 7290000 },
    comparison: { avgSalary: 800000, avgSalaryYear3: 28800000, agentStarting: 1039000, agentYear3: 12468000 },
    departments: { tecnologia: 1729000, comercial: 1459000, marketing: 1189000, financeiro: 1039000, criacao: 869000, suporte: 869000, rh: 689000 },
    departmentClt: { tecnologia: 8400000, comercial: 6300000, marketing: 5200000, financeiro: 5700000, criacao: 4200000, suporte: 3600000, rh: 3100000 },
  },
  tr: {
    currency: "TRY", symbol: "₺", locale: "tr-TR",
    plans: { starter: 25590, growth: 63990 },
    tokenPacks: { pack5m: 12790, pack15m: 31990, pack50m: 95990, pack100m: 179190 },
    comparison: { avgSalary: 19000, avgSalaryYear3: 684000, agentStarting: 25590, agentYear3: 307080 },
    departments: { tecnologia: 42590, comercial: 35590, marketing: 28790, financeiro: 25590, criacao: 21590, suporte: 21590, rh: 16790 },
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
  en: { starter: 147, entry: 197, mid: 297, high: 397, premium: 497 },
  es: { starter: 147, entry: 197, mid: 297, high: 397, premium: 497 },
  fr: { starter: 129, entry: 179, mid: 269, high: 369, premium: 459 },
  de: { starter: 129, entry: 179, mid: 269, high: 369, premium: 459 },
  it: { starter: 129, entry: 179, mid: 269, high: 369, premium: 459 },
  ja: { starter: 19800, entry: 29800, mid: 44800, high: 59800, premium: 74800 },
  zh: { starter: 980, entry: 1380, mid: 2080, high: 2780, premium: 3480 },
  ar: { starter: 550, entry: 740, mid: 1120, high: 1490, premium: 1870 },
  hi: { starter: 12000, entry: 16500, mid: 24800, high: 33000, premium: 41200 },
  ru: { starter: 13200, entry: 17900, mid: 26900, high: 35900, premium: 44900 },
  ko: { starter: 189000, entry: 259000, mid: 389000, high: 519000, premium: 649000 },
  tr: { starter: 4790, entry: 6390, mid: 9590, high: 12790, premium: 15990 },
};

export function getPrice(lang: string, priceTier: PriceTier): number {
  const tiers = priceTierValues[lang] || priceTierValues.pt;
  return tiers[priceTier];
}

export function getPriceDisplay(lang: string, priceTier: PriceTier): string {
  return formatPrice(getPrice(lang, priceTier), lang);
}
