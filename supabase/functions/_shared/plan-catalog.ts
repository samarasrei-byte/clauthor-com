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
 *
 * Convenções de slug aceitas:
 *  - `<slug>`            (ex. "tecnologia")            → subscription single
 *  - `dept-<slug>`       (ex. "dept-tecnologia")       → subscription single
 *  - `cart-<a>_<b>_...`  (ex. "cart-tecnologia_rh")    → subscription cart (soma)
 *  - `pack-<size>`       (ex. "pack-10m")              → token pack (one-time)
 *  - `plan-<id>`         (ex. "plan-starter")          → plan upgrade (one-time)
 */

export interface PlanPrice {
  amount: number;
  currency: "BRL" | "USD" | "EUR";
  maxSetupFee: number;
  displayName: string;
}

// ── Catálogo de departamentos (BRL/mês) ─────────────────────────────────
// Mantido em sync com src/data/departmentData.ts (campo `clauthorCost`).
const DEPARTMENT_CATALOG: Record<string, PlanPrice> = {
  tecnologia:        { amount: 1650, currency: "BRL", maxSetupFee: 5000, displayName: "Departamento de Tecnologia" },
  comercial:         { amount: 1878, currency: "BRL", maxSetupFee: 5000, displayName: "Departamento Comercial" },
  marketing:         { amount: 1797, currency: "BRL", maxSetupFee: 5000, displayName: "Departamento de Marketing" },
  atendimento:       { amount: 1697, currency: "BRL", maxSetupFee: 5000, displayName: "Departamento de Atendimento" },
  financeiro:        { amount: 1297, currency: "BRL", maxSetupFee: 5000, displayName: "Departamento Financeiro" },
  juridico:          { amount: 1547, currency: "BRL", maxSetupFee: 5000, displayName: "Departamento Jurídico" },
  rh:                { amount: 1477, currency: "BRL", maxSetupFee: 5000, displayName: "Departamento de RH" },
  operacoes:         { amount: 1697, currency: "BRL", maxSetupFee: 5000, displayName: "Departamento de Operações" },
  dados:             { amount: 1397, currency: "BRL", maxSetupFee: 5000, displayName: "Departamento de Dados & BI" },
  design:            { amount: 1497, currency: "BRL", maxSetupFee: 5000, displayName: "Departamento de Design" },
  produto:           { amount: 1597, currency: "BRL", maxSetupFee: 5000, displayName: "Departamento de Produto" },
  compras:           { amount: 1197, currency: "BRL", maxSetupFee: 5000, displayName: "Departamento de Compras" },
  suprimentos:       { amount: 1197, currency: "BRL", maxSetupFee: 5000, displayName: "Departamento de Suprimentos" },
  qualidade:         { amount: 1397, currency: "BRL", maxSetupFee: 5000, displayName: "Departamento de Qualidade" },
  logistica:         { amount: 1497, currency: "BRL", maxSetupFee: 5000, displayName: "Departamento de Logística" },
  estrategia:        { amount: 1797, currency: "BRL", maxSetupFee: 5000, displayName: "Departamento de Estratégia" },
  educacao:          { amount: 1297, currency: "BRL", maxSetupFee: 5000, displayName: "Departamento de Educação" },
  advocacia:         { amount: 1900, currency: "BRL", maxSetupFee: 8000, displayName: "Vertical Advocacia" },
  medicina:          { amount: 1900, currency: "BRL", maxSetupFee: 8000, displayName: "Vertical Medicina" },
  contabilidade:     { amount: 1700, currency: "BRL", maxSetupFee: 5000, displayName: "Vertical Contabilidade" },
};

// ── Catálogo de token packs e planos (one-time, USD) ────────────────────
// Sync com src/components/dashboard/TokenUpgradeDialog.tsx.
const ORDER_CATALOG: Record<string, PlanPrice> = {
  // Plans (upgrades diretos)
  "plan-starter":    { amount: 799,  currency: "USD", maxSetupFee: 0, displayName: "Starter Plan" },
  "plan-pro":        { amount: 1999, currency: "USD", maxSetupFee: 0, displayName: "Professional Plan" },
  // Token packs
  "pack-5m":         { amount: 299,  currency: "USD", maxSetupFee: 0, displayName: "5M Token Pack" },
  "pack-10m":        { amount: 499,  currency: "USD", maxSetupFee: 0, displayName: "10M Token Pack" },
  "pack-25m":        { amount: 999,  currency: "USD", maxSetupFee: 0, displayName: "25M Token Pack" },
  "pack-50m":        { amount: 1799, currency: "USD", maxSetupFee: 0, displayName: "50M Token Pack" },
  "pack-100m":       { amount: 2999, currency: "USD", maxSetupFee: 0, displayName: "100M Token Pack" },
  // Legacy generic
  "pack-starter":    { amount: 59,   currency: "USD", maxSetupFee: 0, displayName: "Starter Token Pack" },
  "pack-pro":        { amount: 199,  currency: "USD", maxSetupFee: 0, displayName: "Pro Token Pack" },
  "pack-scale":      { amount: 499,  currency: "USD", maxSetupFee: 0, displayName: "Scale Token Pack" },
};

// Tolerância de arredondamento (unidades inteiras da moeda).
const PRICE_TOLERANCE = 0.01;

function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Resolve preço para uma assinatura mensal.
 * Aceita "<slug>", "dept-<slug>" ou "cart-<slug1>_<slug2>...".
 */
export function resolveSubscriptionPrice(rawSlug: string): PlanPrice | null {
  const slug = normalizeSlug(rawSlug);
  if (!slug) return null;

  // Cart: soma dos departamentos
  if (slug.startsWith("cart-")) {
    const parts = slug.slice(5).split("_").map(normalizeSlug).filter(Boolean);
    if (parts.length === 0) return null;
    let total = 0;
    let currency: PlanPrice["currency"] | null = null;
    const names: string[] = [];
    let maxSetupFee = 0;
    for (const part of parts) {
      const single = DEPARTMENT_CATALOG[part];
      if (!single) return null; // qualquer slug desconhecido invalida o carrinho
      if (currency && single.currency !== currency) return null; // moedas mistas não suportadas
      currency = single.currency;
      total += single.amount;
      maxSetupFee += single.maxSetupFee;
      names.push(single.displayName);
    }
    return {
      amount: total,
      currency: currency!,
      maxSetupFee,
      displayName: names.join(" + "),
    };
  }

  // dept-<slug>
  if (slug.startsWith("dept-")) {
    const key = slug.slice(5);
    return DEPARTMENT_CATALOG[key] ?? null;
  }

  // slug direto
  return DEPARTMENT_CATALOG[slug] ?? null;
}

/**
 * Resolve preço para uma ordem one-time (token pack ou plan upgrade).
 * Aceita "<slug>" ou "plan-<id>"/"pack-<id>".
 */
export function resolveOrderPrice(rawSlug: string): PlanPrice | null {
  const slug = normalizeSlug(rawSlug);
  if (!slug) return null;
  return ORDER_CATALOG[slug] ?? null;
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
