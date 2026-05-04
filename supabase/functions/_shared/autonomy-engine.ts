/**
 * Autonomy Engine - Action Classification & Execution
 * 
 * Risk Levels:
 *   🟢 LOW    → Auto-execute (respond WhatsApp, create task, log activity)
 *   🟡 MEDIUM → Auto-execute + notify owner (send email, schedule meeting)
 *   🔴 HIGH   → Require approval (bulk actions, financial, delete, external API calls)
 *   ⛔ CRITICAL → Always require approval (mass email, data export, billing changes)
 */

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface ActionClassification {
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  notifyOwner: boolean;
  reason: string;
}

// Action → Risk mapping
const ACTION_RISK_MAP: Record<string, { risk: RiskLevel; reason: string }> = {
  // 🟢 LOW - Auto-execute silently
  "respond_whatsapp": { risk: "low", reason: "Resposta automática a cliente via WhatsApp" },
  "respond_chat": { risk: "low", reason: "Resposta a mensagem no chat interno" },
  "create_task": { risk: "low", reason: "Criação de tarefa interna" },
  "log_activity": { risk: "low", reason: "Registro de atividade" },
  "search_leads": { risk: "low", reason: "Pesquisa de leads" },
  "analyze_data": { risk: "low", reason: "Análise de dados internos" },
  "generate_report": { risk: "low", reason: "Geração de relatório" },

  // 🟡 MEDIUM - Auto-execute + notify
  "send_email_single": { risk: "medium", reason: "Envio de email individual" },
  "schedule_meeting": { risk: "medium", reason: "Agendamento de reunião" },
  "update_lead_status": { risk: "medium", reason: "Atualização de status de lead" },
  "delegate_to_agent": { risk: "medium", reason: "Delegação entre agentes" },
  "send_followup": { risk: "medium", reason: "Envio de follow-up automático" },

  // 🔴 HIGH - Requires approval
  "send_email_bulk": { risk: "high", reason: "Envio de emails em massa" },
  "delete_data": { risk: "high", reason: "Exclusão de dados" },
  "modify_credentials": { risk: "high", reason: "Alteração de credenciais" },
  "external_api_call": { risk: "high", reason: "Chamada a API externa" },
  "update_pricing": { risk: "high", reason: "Alteração de preços" },
  "publish_content": { risk: "high", reason: "Publicação de conteúdo" },

  // ⛔ CRITICAL - Always requires explicit approval
  "mass_notification": { risk: "critical", reason: "Notificação em massa" },
  "data_export": { risk: "critical", reason: "Exportação de dados" },
  "billing_change": { risk: "critical", reason: "Alteração de cobrança" },
  "account_modification": { risk: "critical", reason: "Modificação de conta" },
  "contract_action": { risk: "critical", reason: "Ação contratual" },
};

/**
 * Classifies an action by risk level and determines if approval is needed.
 */
export function classifyAction(actionType: string): ActionClassification {
  const mapping = ACTION_RISK_MAP[actionType];

  if (!mapping) {
    // Unknown actions default to HIGH risk (safety first)
    return {
      riskLevel: "high",
      requiresApproval: true,
      notifyOwner: true,
      reason: `Ação desconhecida: ${actionType}`,
    };
  }

  const { risk, reason } = mapping;

  return {
    riskLevel: risk,
    requiresApproval: risk === "high" || risk === "critical",
    notifyOwner: risk !== "low", // Medium+ always notify
    reason,
  };
}

/**
 * Formats a pending action for user-friendly display.
 */
export function formatActionForApproval(
  agentName: string,
  actionType: string,
  classification: ActionClassification,
  details: string
): { title: string; description: string } {
  const riskEmoji = {
    low: "🟢",
    medium: "🟡",
    high: "🔴",
    critical: "⛔",
  }[classification.riskLevel];

  return {
    title: `${riskEmoji} ${agentName} quer: ${classification.reason}`,
    description: details,
  };
}

/**
 * Daily action limits per risk level to prevent runaway loops.
 */
export const DAILY_ACTION_LIMITS: Record<RiskLevel, number> = {
  low: 500,     // High volume OK
  medium: 50,   // Moderate
  high: 10,     // Careful
  critical: 3,  // Very restricted
};
