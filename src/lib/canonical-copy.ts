/**
 * canonical-copy.ts — Single Source of Truth para números comerciais.
 *
 * Toda vez que uma inconsistência aparecer entre landing/pricing/dashboard/ROI
 * (agente barato demais, CLT com valor divergente, contagem de agentes errada,
 * % de economia inflado), é sinal de que alguém hardcodou um número em vez
 * de consumir este arquivo.
 *
 * REGRA DE OURO:
 *   - PROIBIDO literal de preço/CLT/savings/contagem em componente ou string i18n.
 *   - Componentes leem `CANONICAL.<x>.monthly[currency]` ou `formatAgentPrice()`.
 *   - Strings i18n usam placeholders `{{agentPrice}}`, `{{cltPrice}}`,
 *     `{{workforceSize}}`, `{{deptCount}}`, `{{starterSavings}}`, etc.,
 *     injetados globalmente pelo i18n init (ver src/i18n/index.ts).
 *
 * CANONICALS:
 *   - Agente sênior (Starter):    R$ 1.497 / $297
 *   - Funcionário CLT sênior:     R$ 8.500 / $5.500 (base para ROI Benchmark)
 *   - Contagem de agentes:        "+200" (sempre com o "+", nunca "200" ou "225")
 *   - Contagem de departamentos:  20
 *   - Economia Starter (1x1):     82% (comparação direta 1 agente vs 1 CLT sênior)
 *   - Economia Growth (squad):    93% (3 agentes fazendo trabalho de 3-5 CLTs
 *                                     com overhead 1.8x)
 *
 * Se o preço mudar, atualize AQUI e valide com:
 *   rg -n "1497|1\.497|8500|8\.500|297|5,?500|\+200|\"200\"" src/ | \
 *     grep -v canonical-copy.ts
 */

export type CanonicalCurrency = "BRL" | "USD";

export const CANONICAL = {
  agent: {
    monthly: { BRL: 1497, USD: 297 } as Record<CanonicalCurrency, number>,
    label: { BRL: "R$ 1.497", USD: "$297" } as Record<CanonicalCurrency, string>,
  },
  clt: {
    monthly: { BRL: 8500, USD: 5500 } as Record<CanonicalCurrency, number>,
    label: { BRL: "R$ 8.500", USD: "$5,500" } as Record<CanonicalCurrency, string>,
    /** Overhead multiplier: salário + 68% encargos + benefícios. */
    overheadMultiplier: 1.8,
  },
  workforce: {
    /** Sempre renderizado como "+200" — jamais "200" ou "225". */
    agentCountLabel: "+200",
    departmentCount: 20,
  },
  savings: {
    /** 1 agente vs 1 CLT sênior (sem overhead). */
    starterPct: 82,
    /** Squad de 3 agentes vs 3 CLT sênior com overhead 1.8x. */
    growthPct: 93,
  },
} as const;

/** Mapeia i18n locale → currency canônica. Só pt* usa BRL. */
export function currencyForLocale(locale: string): CanonicalCurrency {
  return locale.toLowerCase().startsWith("pt") ? "BRL" : "USD";
}

/** Formata um valor monetário canônico usando Intl.NumberFormat. */
export function formatCanonicalCurrency(
  value: number,
  currency: CanonicalCurrency
): string {
  const locale = currency === "BRL" ? "pt-BR" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Valores prontos para injeção em `t(..., interpolationContext)`. */
export function canonicalInterpolationContext(locale: string): Record<string, string | number> {
  const currency = currencyForLocale(locale);
  return {
    agentPrice: CANONICAL.agent.label[currency],
    agentPriceValue: CANONICAL.agent.monthly[currency],
    cltPrice: CANONICAL.clt.label[currency],
    cltPriceValue: CANONICAL.clt.monthly[currency],
    workforceSize: CANONICAL.workforce.agentCountLabel,
    deptCount: CANONICAL.workforce.departmentCount,
    starterSavings: CANONICAL.savings.starterPct,
    growthSavings: CANONICAL.savings.growthPct,
  };
}
