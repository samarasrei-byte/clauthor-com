/**
 * Server-side price catalog for PayPal checkout.
 *
 * O CLIENTE NÃO PODE ESCOLHER O PREÇO. Esta função resolve o valor mensal
 * e o setup fee máximo aceitável a partir do slug do departamento/agente.
 * Qualquer request cujo `amount` divergir do catálogo (ou slug ausente) é
 * rejeitado com 400.
 *
 * Fonte da verdade: `src/data/departmentData.ts` (mantido em sync manualmente).
 * Se um novo departamento for lançado, adicionar aqui + na tabela `credit_plans`.
 */

export interface PlanPrice {
  /** Valor mensal recorrente em unidades inteiras da moeda (não centavos). */
  amount: number;
  /** Moeda ISO-4217. */
  currency: "BRL" | "USD" | "EUR";
  /** Setup fee máximo aceitável (0 se não aplicável). */
  maxSetupFee: number;
  /** Nome legível para descrição no PayPal. */
  displayName: string;
}

// ── Catálogo de departamentos (BRL/mês) ─────────────────────────────────
// Mantido em sync com src/data/departmentData.ts (campo `clauthorCost`).
const DEPARTMENT_CATALOG: Record<string, PlanPrice> = {
  tecnologia:        { amount: 1650, currency: "BRL", maxSetupFee: 3000, displayName: "Departamento de Tecnologia" },
  comercial:         { amount: 1878, currency: "BRL", maxSetupFee: 3000, displayName: "Departamento Comercial" },
  marketing:         { amount: 1797, currency: "BRL", maxSetupFee: 3000, displayName: "Departamento de Marketing" },
  atendimento:       { amount: 1697, currency: "BRL", maxSetupFee: 3000, displayName: "Departamento de Atendimento" },
  financeiro:        { amount: 1297, currency: "BRL", maxSetupFee: 3000, displayName: "Departamento Financeiro" },
  juridico:          { amount: 1547, currency: "BRL", maxSetupFee: 3000, displayName: "Departamento Jurídico" },
  rh:                { amount: 1477, currency: "BRL", maxSetupFee: 3000, displayName: "Departamento de RH" },
  operacoes:         { amount: 1697, currency: "BRL", maxSetupFee: 3000, displayName: "Departamento de Operações" },
  dados:             { amount: 1397, currency: "BRL", maxSetupFee: 3000, displayName: "Departamento de Dados & BI" },
  design:            { amount: 1497, currency: "BRL", maxSetupFee: 3000, displayName: "Departamento de Design" },
  produto:           { amount: 1597, currency: "BRL", maxSetupFee: 3000, displayName: "Departamento de Produto" },
  compras:           { amount: 1197, currency: "BRL", maxSetupFee: 3000, displayName: "Departamento de Compras" },
  suprimentos:       { amount: 1197, currency: "BRL", maxSetupFee: 3000, displayName: "Departamento de Suprimentos" },
  qualidade:         { amount: 1397, currency: "BRL", maxSetupFee: 3000, displayName: "Departamento de Qualidade" },
  logistica:         { amount: 1497, currency: "BRL", maxSetupFee: 3000, displayName: "Departamento de Logística" },
  estrategia:        { amount: 1797, currency: "BRL", maxSetupFee: 3000, displayName: "Departamento de Estratégia" },
  educacao:          { amount: 1297, currency: "BRL", maxSetupFee: 3000, displayName: "Departamento de Educação" },
  advocacia:         { amount: 1900, currency: "BRL", maxSetupFee: 5000, displayName: "Vertical Advocacia" },
  medicina:          { amount: 1900, currency: "BRL", maxSetupFee: 5000, displayName: "Vertical Medicina" },
  contabilidade:     { amount: 1700, currency: "BRL", maxSetupFee: 3000, displayName: "Vertical Contabilidade" },
};

// ── Catálogo de token packs (one-time) ──────────────────────────────────
// Valores fixos aceitos pelo endpoint create_order (legacy).
const TOKEN_PACK_CATALOG: Record<string, PlanPrice> = {
  "pack-starter": { amount: 59,  currency: "USD", maxSetupFee: 0, displayName: "Starter Token Pack" },
  "pack-pro":     { amount: 199, currency: "USD", maxSetupFee: 0, displayName: "Pro Token Pack" },
  "pack-scale":   { amount: 499, currency: "USD", maxSetupFee: 0, displayName: "Scale Token Pack" },
};

// Tolerância de arredondamento aceito entre o valor pedido pelo cliente
// e o valor autoritativo do catálogo (em unidades inteiras da moeda).
const PRICE_TOLERANCE = 0.01;

export function resolveSubscriptionPrice(slug: string): PlanPrice | null {
  const key = slug?.trim().toLowerCase();
  return key && DEPARTMENT_CATALOG[key] ? DEPARTMENT_CATALOG[key] : null;
}

export function resolveOrderPrice(slug: string): PlanPrice | null {
  const key = slug?.trim().toLowerCase();
  return key && TOKEN_PACK_CATALOG[key] ? TOKEN_PACK_CATALOG[key] : null;
}

export function assertPriceMatches(
  requested: { amount?: number; currency?: string },
  authoritative: PlanPrice,
): { ok: true } | { ok: false; reason: string } {
  if (requested.currency && requested.currency.toUpperCase() !== authoritative.currency) {
    return { ok: false, reason: `currency_mismatch: requested=${requested.currency} expected=${authoritative.currency}` };
  }
  if (typeof requested.amount === "number") {
    const diff = Math.abs(requested.amount - authoritative.amount);
    if (diff > PRICE_TOLERANCE) {
      return { ok: false, reason: `amount_mismatch: requested=${requested.amount} expected=${authoritative.amount}` };
    }
  }
  return { ok: true };
}

export function assertSetupFeeAllowed(setupFee: number, authoritative: PlanPrice): { ok: true } | { ok: false; reason: string } {
  if (setupFee < 0) return { ok: false, reason: "setup_fee_negative" };
  if (setupFee > authoritative.maxSetupFee) {
    return { ok: false, reason: `setup_fee_exceeds_max: requested=${setupFee} max=${authoritative.maxSetupFee}` };
  }
  return { ok: true };
}
