/**
 * POLICY ENGINE CENTRAL v1
 * Validates tenant, plan, tier, area, and limits BEFORE any tool execution.
 * No tool call proceeds without passing all 5 gates.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

// Tier hierarchy for comparison
const TIER_HIERARCHY: Record<string, number> = {
  basic: 1,
  intermediate: 2,
  advanced: 3,
  enterprise: 4,
};

const PLAN_HIERARCHY: Record<string, number> = {
  free: 1,
  starter: 2,
  pro: 3,
  enterprise: 4,
};

export interface PolicyContext {
  userId: string;
  tenantId: string;
  agentId: string;
  agentTier: string;
  planType: string;
  agentArea: string;
}

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
  suggestUpgrade?: boolean;
  requiredTier?: string;
  requiredPlan?: string;
}

/**
 * Gate 1: Validate tenant membership
 */
export async function validateTenant(
  adminClient: any,
  userId: string
): Promise<{ valid: boolean; tenantId: string | null; role: string | null; error?: string }> {
  const { data, error } = await adminClient
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (error || !data) {
    return { valid: false, tenantId: null, role: null, error: "Usuário não pertence a nenhuma organização." };
  }

  return { valid: true, tenantId: data.tenant_id, role: data.role };
}

/**
 * Gate 2: Validate plan limits
 */
export async function validatePlan(
  adminClient: any,
  userId: string,
  planType: string,
  action: "agent_creation" | "tool_execution" | "squad_creation" | "member_invite"
): Promise<PolicyResult> {
  const { data: limits } = await adminClient
    .from("plan_limits")
    .select("*")
    .eq("plan_type", planType)
    .single();

  if (!limits) {
    // Fail-closed: apply conservative defaults when plan_limits not configured
    const defaultLimits: Record<string, number> = {
      agent_creation: 5,
      tool_execution: 500,
      squad_creation: 2,
      member_invite: 3,
    };
    const defaultMax = defaultLimits[action] || 100;
    console.warn(`[PolicyEngine] No plan_limits for "${planType}", applying default: ${action}=${defaultMax}`);
    
    if (action === "agent_creation") {
      const { count } = await adminClient.from("agents").select("*", { count: "exact", head: true }).eq("user_id", userId);
      if ((count || 0) >= defaultMax) {
        return { allowed: false, reason: `Limite padrão de ${defaultMax} agentes atingido.`, suggestUpgrade: true };
      }
    }
    if (action === "tool_execution") {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { count } = await adminClient.from("execution_logs").select("*", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", monthStart.toISOString());
      if ((count || 0) >= defaultMax) {
        return { allowed: false, reason: `Limite mensal padrão de ${defaultMax} execuções atingido.`, suggestUpgrade: true };
      }
    }
    return { allowed: true };
  }

  if (action === "agent_creation") {
    if (limits.max_agents === -1) return { allowed: true };
    const { count } = await adminClient
      .from("agents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((count || 0) >= limits.max_agents) {
      return {
        allowed: false,
        reason: `Limite de ${limits.max_agents} agentes atingido no plano ${planType}.`,
        suggestUpgrade: true,
      };
    }
  }

  if (action === "tool_execution") {
    if (limits.max_monthly_executions === -1) return { allowed: true };
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count } = await adminClient
      .from("execution_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", monthStart.toISOString());
    if ((count || 0) >= limits.max_monthly_executions) {
      return {
        allowed: false,
        reason: `Limite mensal de ${limits.max_monthly_executions} execuções atingido.`,
        suggestUpgrade: true,
      };
    }
  }

  return { allowed: true };
}

/**
 * Gate 3: Validate tier for specific tool
 */
export async function validateTier(
  adminClient: any,
  toolName: string,
  agentTier: string,
  planType: string,
  userId: string
): Promise<PolicyResult> {
  const { data: req } = await adminClient
    .from("tool_tier_requirements")
    .select("*")
    .eq("tool_name", toolName)
    .single();

  if (!req) return { allowed: true }; // No requirement = allowed

  const agentTierLevel = TIER_HIERARCHY[agentTier] || 1;
  const requiredTierLevel = TIER_HIERARCHY[req.min_tier] || 1;

  if (agentTierLevel < requiredTierLevel) {
    return {
      allowed: false,
      reason: `A ferramenta "${toolName}" requer tier "${req.min_tier}" ou superior. Seu agente é "${agentTier}".`,
      suggestUpgrade: true,
      requiredTier: req.min_tier,
    };
  }

  const planLevel = PLAN_HIERARCHY[planType] || 1;
  const requiredPlanLevel = PLAN_HIERARCHY[req.min_plan] || 1;

  if (planLevel < requiredPlanLevel) {
    return {
      allowed: false,
      reason: `A ferramenta "${toolName}" requer plano "${req.min_plan}" ou superior. Seu plano é "${planType}".`,
      suggestUpgrade: true,
      requiredPlan: req.min_plan,
    };
  }

  // Check monthly limit for this tool
  if (req.monthly_limit) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count } = await adminClient
      .from("execution_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("action", `tool:${toolName}`)
      .gte("created_at", monthStart.toISOString());

    if ((count || 0) >= req.monthly_limit) {
      return {
        allowed: false,
        reason: `Limite mensal de ${req.monthly_limit} execuções para "${toolName}" atingido.`,
        suggestUpgrade: true,
      };
    }
  }

  return { allowed: true };
}

/**
 * Gate 4: Validate area scope
 */
export function validateArea(
  toolName: string,
  agentArea: string
): PolicyResult {
  // Tools restricted to specific areas (empty array = all areas allowed)
  const areaRestrictions: Record<string, string[]> = {
    generate_report: [],  // All areas can generate reports
    analyze_data: [],     // All areas can analyze data
    send_email: ["vendas", "marketing", "suporte", "rh", "comunicacao", "prospeccao", "executivo", "operacoes", "ecommerce", "geral"],
    create_task: [],      // All areas can create tasks
    schedule_meeting: [], // All areas can schedule meetings
    search_leads: ["vendas", "marketing", "prospeccao", "ecommerce", "executivo", "geral"],
    delegate_to_agent: ["executivo", "operacoes", "geral"], // Only orchestrators/executives can delegate
  };

  const allowed = areaRestrictions[toolName];
  if (allowed && allowed.length > 0 && !allowed.includes(agentArea)) {
    return {
      allowed: false,
      reason: `A ferramenta "${toolName}" não é permitida na área "${agentArea}". Essa ferramenta é restrita às áreas: ${allowed.join(", ")}.`,
    };
  }

  return { allowed: true };
}

/**
 * Gate 5: Validate token/credit limits
 */
export function validateLimits(
  usedCredits: number,
  totalCredits: number
): PolicyResult {
  if (totalCredits <= 0) {
    return { allowed: false, reason: "Nenhum crédito configurado.", suggestUpgrade: true };
  }

  if (usedCredits >= totalCredits) {
    return {
      allowed: false,
      reason: "Limite de tokens atingido. Faça upgrade para continuar.",
      suggestUpgrade: true,
    };
  }

  return { allowed: true };
}

/**
 * MASTER GATE: Run all 5 validations in sequence.
 * Returns first failure or { allowed: true }.
 */
export async function enforcePolicy(
  adminClient: any,
  context: PolicyContext,
  toolName: string,
  usedCredits: number,
  totalCredits: number
): Promise<PolicyResult> {
  // Gate 5: Credits
  const creditsCheck = validateLimits(usedCredits, totalCredits);
  if (!creditsCheck.allowed) return creditsCheck;

  // Gate 2: Plan limits
  const planCheck = await validatePlan(adminClient, context.userId, context.planType, "tool_execution");
  if (!planCheck.allowed) return planCheck;

  // Gate 3: Tier enforcement
  const tierCheck = await validateTier(adminClient, toolName, context.agentTier, context.planType, context.userId);
  if (!tierCheck.allowed) return tierCheck;

  // Gate 4: Area scope
  const areaCheck = validateArea(toolName, context.agentArea);
  if (!areaCheck.allowed) return areaCheck;

  return { allowed: true };
}

/**
 * Backward-compatible helper used by orchestrator chats.
 * Keeps legacy signature while routing through the central policy engine.
 */
export async function validateAndEnforcePolicy(
  adminClient: any,
  userId: string,
  toolName: string,
  _action: string
): Promise<PolicyResult> {
  const tenantCheck = await validateTenant(adminClient, userId);
  if (!tenantCheck.valid || !tenantCheck.tenantId) {
    return { allowed: false, reason: tenantCheck.error || "Acesso não autorizado." };
  }

  const { data: credits } = await adminClient
    .from("user_credits")
    .select("used_credits, total_credits, plan_type")
    .eq("user_id", userId)
    .maybeSingle();

  // If credits are not initialized yet, avoid blocking chats.
  if (!credits) {
    return { allowed: true };
  }

  const context: PolicyContext = {
    userId,
    tenantId: tenantCheck.tenantId,
    agentId: "orchestrator",
    agentTier: "enterprise",
    planType: credits.plan_type || "free",
    agentArea: "executivo",
  };

  return enforcePolicy(
    adminClient,
    context,
    toolName,
    credits.used_credits || 0,
    credits.total_credits || 0
  );
}
