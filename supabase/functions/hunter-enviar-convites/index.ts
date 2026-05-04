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

    const { campaign_id } = await req.json();
    if (!campaign_id) return errorResponse("campaign_id obrigatório", 400);

    // Get campaign
    const { data: campaign } = await supabase
      .from("hunter_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .eq("user_id", user.id)
      .single();

    if (!campaign) return errorResponse("Campanha não encontrada", 404);

    // Get leads with status "novo"
    const { data: leads } = await supabase
      .from("hunter_leads")
      .select("*")
      .eq("campaign_id", campaign_id)
      .eq("status", "novo")
      .limit(campaign.limite_diario);

    if (!leads || leads.length === 0) return jsonResponse({ success: true, message: "Nenhum lead novo para enviar" });

    // Get user's note template
    const { data: templates } = await supabase
      .from("hunter_templates")
      .select("conteudo")
      .eq("user_id", user.id)
      .eq("tipo", "nota_conexao")
      .eq("ativo", true)
      .limit(1);

    const templateText = templates?.[0]?.conteudo || "{{icebreaker}} Posso te adicionar?";

    // Get PhantomBuster config
    const { data: config } = await supabase
      .from("hunter_config")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const pbKey = config?.phantombuster_api_key_encrypted;
    const connectAgentId = config?.phantombuster_connect_agent_id;

    // Prepare messages for each lead
    const messagesInserts = leads.map(lead => {
      const msg = templateText
        .replace(/\{\{nome\}\}/g, lead.nome_completo)
        .replace(/\{\{cargo\}\}/g, lead.cargo)
        .replace(/\{\{empresa\}\}/g, lead.empresa)
        .replace(/\{\{icebreaker\}\}/g, lead.icebreaker || "");

      return {
        lead_id: lead.id,
        campaign_id,
        user_id: user.id,
        tipo: "nota_conexao",
        conteudo: msg,
        status: "pendente",
      };
    });

    await supabase.from("hunter_messages").insert(messagesInserts);

    if (pbKey && connectAgentId) {
      // Send via PhantomBuster
      try {
        const profileUrls = leads.map(l => l.linkedin_url).filter(Boolean);
        const pbRes = await fetch("https://api.phantombuster.com/api/v2/agents/launch", {
          method: "POST",
          headers: {
            "X-Phantombuster-Key": pbKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: connectAgentId,
            argument: {
              cookie: campaign.linkedin_cookie_encrypted,
              spreadsheetUrl: "",
              profileUrls,
              message: messagesInserts[0]?.conteudo || "",
              numberOfRequestsPerLaunch: campaign.limite_diario,
            },
          }),
        });

        if (!pbRes.ok) {
          const errText = await pbRes.text();
          throw new Error(`PhantomBuster error [${pbRes.status}]: ${errText}`);
        }

        // Update statuses
        const leadIds = leads.map(l => l.id);
        await supabase.from("hunter_leads").update({ status: "convite_enviado" }).in("id", leadIds);
        await supabase.from("hunter_messages").update({ status: "enviada" }).eq("campaign_id", campaign_id).eq("status", "pendente");
        await supabase.from("hunter_campaigns").update({ total_leads: campaign.total_leads + leads.length }).eq("id", campaign_id);

        await supabase.from("hunter_logs").insert({
          campaign_id,
          user_id: user.id,
          tipo: "sucesso",
          mensagem: `${leads.length} convites enviados via PhantomBuster`,
        });

        return jsonResponse({ success: true, sent: leads.length });
      } catch (e) {
        await supabase.from("hunter_logs").insert({
          campaign_id,
          user_id: user.id,
          tipo: "erro",
          mensagem: `Erro ao enviar convites: ${e.message}`,
        });
        return errorResponse(e.message, 500);
      }
    } else {
      // Mark as pending (no PhantomBuster)
      await supabase.from("hunter_logs").insert({
        campaign_id,
        user_id: user.id,
        tipo: "info",
        mensagem: `${leads.length} mensagens criadas como pendentes. Configure PhantomBuster para envio automático.`,
      });

      return jsonResponse({ success: true, queued: leads.length, message: "PhantomBuster não configurado - mensagens ficaram na fila" });
    }
  } catch (e) {
    return errorResponse(e.message || "Erro interno", 500);
  }
});
