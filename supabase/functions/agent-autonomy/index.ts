import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { classifyAction, formatActionForApproval, DAILY_ACTION_LIMITS } from "../_shared/autonomy-engine.ts";
import { startRun } from "../_shared/execution-tracer.ts";

import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { action, agent_id, agent_name, details, payload, tenant_id } = await req.json();

    if (!action || !agent_id || !tenant_id) {
      return new Response(JSON.stringify({ error: "Missing required fields: action, agent_id, tenant_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Classify the action
    const classification = classifyAction(action);
    console.log(`[Autonomy] Action: ${action} | Risk: ${classification.riskLevel} | Approval: ${classification.requiresApproval}`);

    // Start tracer (best-effort — never blocks execution)
    const tracer = await startRun(supabase, {
      tenantId: tenant_id,
      userId,
      runType: "agent_execute",
      agents: agent_name ? [agent_name] : [],
      message: `${action}${details ? ` — ${details}` : ""}`.slice(0, 400),
    }).catch(() => null);

    await tracer?.step("decision", {
      title: `Ação classificada: ${classification.riskLevel}`,
      content: { action, risk_level: classification.riskLevel, requires_approval: classification.requiresApproval, reason: classification.reason },
      agent_slug: agent_name ?? null,
    });


    // 2. Check daily limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayCount } = await supabase
      .from("execution_logs")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", agent_id)
      .eq("user_id", userId)
      .gte("created_at", today.toISOString());

    const limit = DAILY_ACTION_LIMITS[classification.riskLevel];
    if ((todayCount || 0) >= limit) {
      // Notify owner about limit reached
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "autonomy_limit",
        title: "⚠️ Limite diário atingido",
        message: `O agente ${agent_name || "AI"} atingiu o limite de ${limit} ações ${classification.riskLevel}/dia.`,
        metadata: { agent_id, action, risk_level: classification.riskLevel, limit },
      });
      await tracer?.step("error", { title: "Limite diário atingido", content: { limit, todayCount } });
      await tracer?.finish({ status: "cancelled", summary: "daily_limit_reached" });

      return new Response(JSON.stringify({
        executed: false,
        reason: "daily_limit_reached",
        limit,
        risk_level: classification.riskLevel,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }



    // 3. If requires approval → queue it
    if (classification.requiresApproval) {
      const formatted = formatActionForApproval(
        agent_name || "Agente AI",
        action,
        classification,
        details || ""
      );

      const { data: pendingAction, error: insertError } = await supabase
        .from("pending_actions")
        .insert({
          user_id: userId,
          agent_id,
          tenant_id,
          action_type: action,
          risk_level: classification.riskLevel,
          title: formatted.title,
          description: formatted.description,
          payload: payload || {},
          status: "pending",
        })
        .select()
        .single();

      if (insertError) {
        console.error("[Autonomy] Failed to queue action:", insertError);
        throw insertError;
      }

      // Notify owner
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "action_approval_needed",
        title: formatted.title,
        message: `Ação requer sua aprovação: ${formatted.description}`.slice(0, 500),
        metadata: { pending_action_id: pendingAction.id, agent_id, action, risk_level: classification.riskLevel },
      });

      console.log(`[Autonomy] ⏳ Action queued for approval: ${pendingAction.id}`);
      await tracer?.step("delegation", {
        title: "Aprovação humana solicitada",
        content: { pending_action_id: pendingAction.id, action, risk_level: classification.riskLevel },
      });
      await tracer?.finish({ status: "completed", summary: "approval_required" });

      return new Response(JSON.stringify({
        executed: false,
        reason: "approval_required",
        pending_action_id: pendingAction.id,
        risk_level: classification.riskLevel,
        message: formatted.title,
        run_id: tracer?.runId,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    // 4. Auto-execute + log
    await supabase.from("execution_logs").insert({
      agent_id,
      user_id: userId,
      action: `autonomous_${action}`,
      status: "success",
      details: {
        risk_level: classification.riskLevel,
        autonomous: true,
        description: details || "",
        payload: payload || {},
      },
    });

    // 5. Notify if medium risk
    if (classification.notifyOwner) {
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "autonomous_action",
        title: `✅ ${agent_name || "Agente"}: ${classification.reason}`,
        message: (details || classification.reason).slice(0, 500),
        metadata: { agent_id, action, risk_level: classification.riskLevel, autonomous: true },
      });
    }

    console.log(`[Autonomy] ✅ Auto-executed: ${action} (${classification.riskLevel})`);
    return new Response(JSON.stringify({
      executed: true,
      risk_level: classification.riskLevel,
      notified: classification.notifyOwner,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[Autonomy] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
