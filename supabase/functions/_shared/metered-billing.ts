/**
 * Metered billing helper — wraps the `increment_agent_usage` RPC.
 *
 * Must be called with a service_role client because the RPC is
 * `SECURITY DEFINER` and the EXECUTE grant is restricted to service_role.
 *
 * Returned status values:
 *   - within_quota   → normal usage, keep going.
 *   - approaching    → ≥80% of monthly quota consumed.
 *   - over_quota     → 100–120% (soft cap): billed as overage, still allowed.
 *   - hard_cap       → ≥120% of quota: caller MUST block execution.
 */

export type PriceTier = "starter" | "entry" | "mid" | "high" | "hunter" | "premium";

export interface AgentUsageResult {
  status: "within_quota" | "approaching" | "over_quota" | "hard_cap";
  tier: PriceTier;
  quota: number;
  remaining: number;
  overage_actions: number;
  overage_charge_usd: number;
  usage_pct: number;
  period_start: string;
}

/**
 * Map catalog `agents_catalog.tier` (basic/pro/advanced/premium) and a few
 * agent slugs into the canonical pricing tier used by `agent_tier_quotas`.
 * Hunter/LinkedIn prospecting agents pay the hunter tier regardless of catalog tier.
 */
const HUNTER_SLUGS = new Set(["hunter", "hunter_linkedin", "sdr_linkedin"]);

export function resolvePriceTier(
  agentSlug: string | null | undefined,
  catalogTier: string | null | undefined,
): PriceTier {
  if (agentSlug && HUNTER_SLUGS.has(agentSlug)) return "hunter";
  switch ((catalogTier || "").toLowerCase()) {
    case "basic":
      return "starter";
    case "pro":
      return "mid";
    case "advanced":
      return "high";
    case "premium":
      return "premium";
    default:
      return "starter";
  }
}

/**
 * Increment monthly usage for a (tenant, agent). Never throws — on any error
 * returns `null` and logs a warning, so metering failure never blocks the
 * user's request. Callers should only block when `status === "hard_cap"`.
 */
export async function incrementAgentUsage(
  adminClient: any,
  params: {
    tenantId: string;
    agentSlug: string;
    tier: PriceTier;
    actions?: number;
  },
): Promise<AgentUsageResult | null> {
  const { tenantId, agentSlug, tier, actions = 1 } = params;
  if (!tenantId || !agentSlug) return null;
  try {
    const { data, error } = await adminClient.rpc("increment_agent_usage", {
      _tenant_id: tenantId,
      _agent_slug: agentSlug,
      _tier: tier,
      _actions: actions,
    });
    if (error) {
      console.warn("[metered-billing] rpc error:", error.message);
      return null;
    }
    return data as AgentUsageResult;
  } catch (e) {
    console.warn("[metered-billing] exception:", e);
    return null;
  }
}
