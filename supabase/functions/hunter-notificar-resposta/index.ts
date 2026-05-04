import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return errorResponse("Unauthorized", 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse("Unauthorized", 401);

    const body = await req.json();

    // Test mode - send test notification
    if (body.test === true) {
      const { data: config } = await supabase
        .from("hunter_config")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!config?.evolution_url || !config?.evolution_instance || !config?.evolution_notify_number) {
        return errorResponse("Configure a Evolution API em /hunter-configuracoes primeiro", 400);
      }

      const evoUrl = `${config.evolution_url}/message/sendText/${config.evolution_instance}`;
      const evoRes = await fetch(evoUrl, {
        method: "POST",
        headers: {
          apikey: config.evolution_api_key_encrypted || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: config.evolution_notify_number,
          text: "🎯 Hunter: Mensagem de teste! Se você recebeu, a integração está funcionando.",
        }),
      });

      if (!evoRes.ok) {
        const errText = await evoRes.text();
        return errorResponse(`Evolution API error [${evoRes.status}]: ${errText}`, 500);
      }

      return jsonResponse({ success: true, message: "Mensagem de teste enviada" });
    }

    // Real notification
    const { lead_id } = body;
    if (!lead_id) return errorResponse("lead_id obrigatório", 400);

    // Get lead + campaign
    const { data: lead } = await supabase
      .from("hunter_leads")
      .select("*, campaign:hunter_campaigns(*)")
      .eq("id", lead_id)
      .single();

    if (!lead) return errorResponse("Lead não encontrado", 404);

    // Get config
    const { data: config } = await supabase
      .from("hunter_config")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!config?.evolution_url || !config?.evolution_instance || !config?.evolution_notify_number) {
      return jsonResponse({ success: false, message: "Evolution API não configurada" });
    }

    const evoUrl = `${config.evolution_url}/message/sendText/${config.evolution_instance}`;
    const evoRes = await fetch(evoUrl, {
      method: "POST",
      headers: {
        apikey: config.evolution_api_key_encrypted || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: config.evolution_notify_number,
        text: `🎯 Hunter: ${lead.nome_completo} (${lead.cargo} na ${lead.empresa}) respondeu no LinkedIn!\nAcesse o painel para ver a conversa.`,
      }),
    });

    if (!evoRes.ok) {
      await supabase.from("hunter_logs").insert({
        campaign_id: lead.campaign_id,
        user_id: user.id,
        tipo: "erro",
        mensagem: `Falha ao notificar resposta de ${lead.nome_completo}: Evolution API error`,
      });
      return errorResponse("Erro ao enviar notificação", 500);
    }

    // Update lead status
    await supabase.from("hunter_leads").update({ status: "respondeu" }).eq("id", lead_id);

    // Increment campaign counter
    if (lead.campaign) {
      await supabase.from("hunter_campaigns")
        .update({ total_responderam: (lead.campaign.total_responderam || 0) + 1 })
        .eq("id", lead.campaign_id);
    }

    await supabase.from("hunter_logs").insert({
      campaign_id: lead.campaign_id,
      user_id: user.id,
      tipo: "sucesso",
      mensagem: `Notificação enviada: ${lead.nome_completo} respondeu!`,
    });

    return jsonResponse({ success: true });
  } catch (e) {
    return errorResponse(e.message || "Erro interno", 500);
  }
});
