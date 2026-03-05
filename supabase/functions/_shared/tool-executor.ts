/**
 * Tool Executor with Autonomy Engine Integration
 * 
 * Wraps tool execution with risk classification from autonomy-engine.
 * Low/Medium risk → auto-execute (medium notifies owner)
 * High/Critical risk → queue in pending_actions for approval
 */

import { classifyAction, formatActionForApproval, DAILY_ACTION_LIMITS } from "./autonomy-engine.ts";

export interface ToolExecutionResult {
  executed: boolean;
  success: boolean;
  result: any;
  riskLevel: string;
  queued?: boolean;
  pendingActionId?: string;
}

/**
 * Maps tool names to autonomy-engine action types
 */
const TOOL_TO_ACTION_MAP: Record<string, string> = {
  "send_email": "send_email_single",
  "create_task": "create_task",
  "generate_report": "generate_report",
  "search_leads": "search_leads",
  "schedule_meeting": "schedule_meeting",
  "analyze_data": "analyze_data",
  "delegate_to_agent": "delegate_to_agent",
};

/**
 * Checks if daily action limit has been reached for this risk level
 */
async function checkDailyLimit(
  adminClient: any,
  agentId: string,
  userId: string,
  riskLevel: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await adminClient
    .from("execution_logs")
    .select("*", { count: "exact", head: true })
    .eq("agent_id", agentId)
    .eq("user_id", userId)
    .gte("created_at", today.toISOString());

  const limit = DAILY_ACTION_LIMITS[riskLevel as keyof typeof DAILY_ACTION_LIMITS] || 10;
  return { allowed: (count || 0) < limit, count: count || 0, limit };
}

/**
 * Autonomous tool execution gate.
 * Classifies risk and either executes immediately or queues for approval.
 */
export async function autonomousExecute(
  toolName: string,
  args: any,
  adminClient: any,
  userId: string,
  tenantId: string,
  agentId: string,
  agentName: string,
  /** The actual tool executor function */
  executor: () => Promise<{ success: boolean; result: any }>
): Promise<ToolExecutionResult> {
  const actionType = TOOL_TO_ACTION_MAP[toolName] || toolName;
  const classification = classifyAction(actionType);

  console.log(`[ToolExecutor] Tool: ${toolName} → Action: ${actionType} | Risk: ${classification.riskLevel} | Approval: ${classification.requiresApproval}`);

  // Check daily limits
  const limitCheck = await checkDailyLimit(adminClient, agentId, userId, classification.riskLevel);
  if (!limitCheck.allowed) {
    // Notify owner
    await adminClient.from("notifications").insert({
      user_id: userId,
      type: "autonomy_limit",
      title: "⚠️ Limite diário atingido",
      message: `O agente ${agentName} atingiu o limite de ${limitCheck.limit} ações ${classification.riskLevel}/dia para "${toolName}".`,
      metadata: { agent_id: agentId, tool: toolName, risk_level: classification.riskLevel, count: limitCheck.count, limit: limitCheck.limit },
    });

    return {
      executed: false,
      success: false,
      riskLevel: classification.riskLevel,
      result: {
        error: `Limite diário atingido (${limitCheck.count}/${limitCheck.limit} ações ${classification.riskLevel}).`,
        limit_reached: true,
      },
    };
  }

  // HIGH/CRITICAL → Queue for approval (don't execute)
  if (classification.requiresApproval) {
    const formatted = formatActionForApproval(agentName, actionType, classification, JSON.stringify(args).slice(0, 500));

    const { data: pendingAction, error: insertError } = await adminClient
      .from("pending_actions")
      .insert({
        user_id: userId,
        agent_id: agentId,
        tenant_id: tenantId,
        action_type: actionType,
        risk_level: classification.riskLevel,
        title: formatted.title,
        description: formatted.description,
        payload: { tool: toolName, args },
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[ToolExecutor] Failed to queue action:", insertError);
    }

    // Notify owner
    await adminClient.from("notifications").insert({
      user_id: userId,
      type: "action_approval_needed",
      title: formatted.title,
      message: `Ação "${toolName}" requer sua aprovação antes de ser executada.`,
      metadata: {
        pending_action_id: pendingAction?.id,
        agent_id: agentId,
        tool: toolName,
        risk_level: classification.riskLevel,
        args,
      },
    });

    return {
      executed: false,
      success: true,
      riskLevel: classification.riskLevel,
      queued: true,
      pendingActionId: pendingAction?.id,
      result: {
        status: "queued_for_approval",
        message: `Esta ação (${classification.reason}) requer sua aprovação. Verifique o painel de Ações Pendentes.`,
        pending_action_id: pendingAction?.id,
      },
    };
  }

  // LOW/MEDIUM → Auto-execute
  try {
    const executionResult = await executor();

    // MEDIUM → notify owner after execution
    if (classification.notifyOwner) {
      await adminClient.from("notifications").insert({
        user_id: userId,
        type: "autonomous_action",
        title: `✅ ${agentName}: ${classification.reason}`,
        message: `Ação "${toolName}" executada automaticamente. ${JSON.stringify(args).slice(0, 300)}`,
        metadata: {
          agent_id: agentId,
          tool: toolName,
          risk_level: classification.riskLevel,
          autonomous: true,
          args,
        },
      });
    }

    // Log autonomous execution
    await adminClient.from("execution_logs").insert({
      agent_id: agentId,
      user_id: userId,
      action: `autonomous:${toolName}`,
      status: executionResult.success ? "success" : "error",
      details: {
        risk_level: classification.riskLevel,
        autonomous: true,
        tool: toolName,
        notified: classification.notifyOwner,
      },
    });

    return {
      executed: true,
      success: executionResult.success,
      riskLevel: classification.riskLevel,
      result: executionResult.result,
    };
  } catch (err) {
    console.error(`[ToolExecutor] Execution failed for ${toolName}:`, err);
    return {
      executed: false,
      success: false,
      riskLevel: classification.riskLevel,
      result: { error: `Erro ao executar ${toolName}: ${err instanceof Error ? err.message : "unknown"}` },
    };
  }
}
