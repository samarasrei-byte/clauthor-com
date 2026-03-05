import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { classifyAction, formatActionForApproval } from "../_shared/autonomy-engine.ts";

/**
 * Event Loop — Autonomous Agent Triggers
 * 
 * Runs on a schedule (every 5 minutes via pg_cron).
 * Checks for trigger conditions and dispatches autonomous actions.
 * 
 * Triggers:
 *  1. Inactive leads (3+ days) → Growth Agent sends follow-up
 *  2. Expiring contracts (7 days) → Legal Agent alerts
 *  3. Token usage threshold → Notify owner
 *  4. Unresponded tasks (24h+) → Reminder notification
 *  5. Pending meetings today → Pre-meeting briefing
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");

    const supabase = createClient(supabaseUrl, serviceKey);
    const results: Array<{ trigger: string; actions: number; details: string }> = [];

    // ─── TRIGGER 1: Inactive leads (tasks open > 3 days, category = lead) ───
    try {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const { data: staleTasks } = await supabase
        .from("agent_tasks")
        .select("id, user_id, agent_id, tenant_id, title, assigned_to")
        .eq("status", "open")
        .eq("category", "lead")
        .lt("created_at", threeDaysAgo)
        .limit(20);

      if (staleTasks && staleTasks.length > 0) {
        for (const task of staleTasks) {
          // Check if we already notified about this task
          const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", task.user_id)
            .eq("type", "lead_followup")
            .contains("metadata", { task_id: task.id });

          if ((count || 0) === 0) {
            const classification = classifyAction("send_followup");

            if (classification.requiresApproval) {
              await supabase.from("pending_actions").insert({
                user_id: task.user_id,
                agent_id: task.agent_id,
                tenant_id: task.tenant_id,
                action_type: "send_followup",
                risk_level: classification.riskLevel,
                title: `🔄 Follow-up: Lead "${task.title}" inativo há 3+ dias`,
                description: `O lead está sem atividade desde a criação. Deseja que o agente envie um follow-up?`,
                payload: { task_id: task.id, task_title: task.title },
              });
            } else {
              await supabase.from("notifications").insert({
                user_id: task.user_id,
                type: "lead_followup",
                title: "🔄 Follow-up Automático Enviado",
                message: `O agente enviou follow-up para o lead "${task.title}" (inativo há 3+ dias).`,
                metadata: { task_id: task.id, autonomous: true },
              });
            }
          }
        }
        results.push({ trigger: "inactive_leads", actions: staleTasks.length, details: `${staleTasks.length} leads inativos processados` });
      }
    } catch (e) {
      console.error("[EventLoop] Trigger 1 (inactive leads) error:", e);
    }

    // ─── TRIGGER 2: Tasks overdue (past due_date, still open) ───
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: overdueTasks } = await supabase
        .from("agent_tasks")
        .select("id, user_id, agent_id, tenant_id, title, due_date")
        .eq("status", "open")
        .lt("due_date", today)
        .limit(20);

      if (overdueTasks && overdueTasks.length > 0) {
        for (const task of overdueTasks) {
          const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", task.user_id)
            .eq("type", "task_overdue")
            .contains("metadata", { task_id: task.id });

          if ((count || 0) === 0) {
            await supabase.from("notifications").insert({
              user_id: task.user_id,
              type: "task_overdue",
              title: "⏰ Tarefa Atrasada",
              message: `A tarefa "${task.title}" está atrasada (vencimento: ${task.due_date}).`,
              metadata: { task_id: task.id, due_date: task.due_date },
            });
          }
        }
        results.push({ trigger: "overdue_tasks", actions: overdueTasks.length, details: `${overdueTasks.length} tarefas atrasadas` });
      }
    } catch (e) {
      console.error("[EventLoop] Trigger 2 (overdue tasks) error:", e);
    }

    // ─── TRIGGER 3: Meetings today — send prep notification ───
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: todayMeetings } = await supabase
        .from("agent_meetings")
        .select("id, user_id, agent_id, tenant_id, title, meeting_time, participants")
        .eq("meeting_date", today)
        .eq("status", "scheduled")
        .limit(20);

      if (todayMeetings && todayMeetings.length > 0) {
        for (const meeting of todayMeetings) {
          const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", meeting.user_id)
            .eq("type", "meeting_prep")
            .contains("metadata", { meeting_id: meeting.id });

          if ((count || 0) === 0) {
            await supabase.from("notifications").insert({
              user_id: meeting.user_id,
              type: "meeting_prep",
              title: `📅 Reunião Hoje: ${meeting.title}`,
              message: `Reunião "${meeting.title}" às ${meeting.meeting_time}. ${(meeting.participants || []).length} participantes.`,
              metadata: { meeting_id: meeting.id, meeting_time: meeting.meeting_time },
            });
          }
        }
        results.push({ trigger: "today_meetings", actions: todayMeetings.length, details: `${todayMeetings.length} reuniões hoje` });
      }
    } catch (e) {
      console.error("[EventLoop] Trigger 3 (meetings today) error:", e);
    }

    // ─── TRIGGER 4: Company Board empty — nudge user ───
    try {
      // Get all users with active agents but no company board entries
      const { data: usersWithAgents } = await supabase
        .from("agents")
        .select("user_id")
        .eq("status", "active");

      if (usersWithAgents) {
        const uniqueUsers = [...new Set(usersWithAgents.map(a => a.user_id))];
        for (const userId of uniqueUsers) {
          const { count: boardCount } = await supabase
            .from("company_board")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId);

          if ((boardCount || 0) === 0) {
            // Check if already nudged in last 7 days
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const { count: nudgeCount } = await supabase
              .from("notifications")
              .select("*", { count: "exact", head: true })
              .eq("user_id", userId)
              .eq("type", "company_board_nudge")
              .gte("created_at", weekAgo);

            if ((nudgeCount || 0) === 0) {
              await supabase.from("notifications").insert({
                user_id: userId,
                type: "company_board_nudge",
                title: "🏢 Ensine seus agentes sobre sua empresa",
                message: "Seus agentes estão operando em modo genérico. Preencha as informações da empresa para respostas personalizadas.",
                metadata: { action: "open_company_wizard" },
              });
            }
          }
        }
      }
      results.push({ trigger: "company_board_check", actions: 1, details: "Verificação de onboarding concluída" });
    } catch (e) {
      console.error("[EventLoop] Trigger 4 (company board) error:", e);
    }

    // ─── TRIGGER 5: Credits running low (< 10% remaining) ───
    try {
      const { data: lowCredits } = await supabase
        .from("user_credits")
        .select("user_id, total_credits, used_credits, plan_type")
        .gt("total_credits", 0);

      if (lowCredits) {
        for (const credit of lowCredits) {
          const usagePct = Math.round((credit.used_credits / credit.total_credits) * 100);
          if (usagePct >= 95) {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const { count } = await supabase
              .from("notifications")
              .select("*", { count: "exact", head: true })
              .eq("user_id", credit.user_id)
              .eq("type", "credits_critical_loop")
              .gte("created_at", weekAgo);

            if ((count || 0) === 0) {
              await supabase.from("notifications").insert({
                user_id: credit.user_id,
                type: "credits_critical_loop",
                title: "🚨 Créditos Quase Esgotados",
                message: `Você usou ${usagePct}% dos seus créditos (${credit.used_credits}/${credit.total_credits}). Faça upgrade para manter os agentes ativos.`,
                metadata: { usage_pct: usagePct, plan_type: credit.plan_type },
              });
            }
          }
        }
      }
      results.push({ trigger: "credits_check", actions: 1, details: "Verificação de créditos concluída" });
    } catch (e) {
      console.error("[EventLoop] Trigger 5 (credits) error:", e);
    }

    // Log the event loop execution
    console.log(`[EventLoop] ✅ Completed. Triggers processed: ${results.length}`, results);

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      triggers_processed: results.length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[EventLoop] Fatal error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
