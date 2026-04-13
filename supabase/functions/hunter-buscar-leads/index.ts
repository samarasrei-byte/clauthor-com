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
    const { data: campaign, error: campErr } = await supabase
      .from("hunter_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .eq("user_id", user.id)
      .single();

    if (campErr || !campaign) return errorResponse("Campanha não encontrada", 404);

    // Get user's PhantomBuster config
    const { data: config } = await supabase
      .from("hunter_config")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const pbKey = config?.phantombuster_api_key_encrypted;
    const searchAgentId = config?.phantombuster_search_agent_id;

    // Log start
    await supabase.from("hunter_logs").insert({
      campaign_id,
      user_id: user.id,
      tipo: "info",
      mensagem: `Busca de leads iniciada para campanha "${campaign.nome}"`,
    });

    if (!pbKey || !searchAgentId) {
      // No PhantomBuster configured — create demo leads
      const demoLeads = Array.from({ length: 5 }, (_, i) => ({
        campaign_id,
        user_id: user.id,
        nome_completo: `Lead Demo ${i + 1}`,
        cargo: campaign.cargo_alvo || "Gerente",
        empresa: `Empresa ${i + 1}`,
        linkedin_url: `https://linkedin.com/in/demo-lead-${i + 1}`,
        status: "novo",
      }));

      await supabase.from("hunter_leads").insert(demoLeads);
      await supabase.from("hunter_campaigns").update({ total_leads: 5 }).eq("id", campaign_id);

      await supabase.from("hunter_logs").insert({
        campaign_id,
        user_id: user.id,
        tipo: "info",
        mensagem: "PhantomBuster não configurado — leads de demonstração criados. Configure em /hunter-configuracoes.",
      });

      // Generate icebreakers for demo leads
      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/hunter-gerar-icebreakers`, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ campaign_id }),
        });
      } catch { /* non-blocking */ }

      return jsonResponse({ success: true, leads_count: 5, demo: true });
    }

    // Call PhantomBuster Search
    try {
      const pbResponse = await fetch("https://api.phantombuster.com/api/v2/agents/launch", {
        method: "POST",
        headers: {
          "X-Phantombuster-Key": pbKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: searchAgentId,
          argument: {
            cookie: campaign.linkedin_cookie_encrypted,
            searches: `${campaign.cargo_alvo} ${campaign.setor_alvo}`,
            location: campaign.localizacao_alvo,
            numberOfResultsPerSearch: 25,
          },
        }),
      });

      if (!pbResponse.ok) {
        const errText = await pbResponse.text();
        throw new Error(`PhantomBuster error [${pbResponse.status}]: ${errText}`);
      }

      await supabase.from("hunter_logs").insert({
        campaign_id,
        user_id: user.id,
        tipo: "sucesso",
        mensagem: `PhantomBuster Search iniciado. Leads serão importados quando o Phantom concluir.`,
      });

      return jsonResponse({ success: true, message: "Busca iniciada no PhantomBuster" });
    } catch (e) {
      await supabase.from("hunter_logs").insert({
        campaign_id,
        user_id: user.id,
        tipo: "erro",
        mensagem: `Erro no PhantomBuster: ${e.message}`,
      });
      return errorResponse(e.message, 500);
    }
  } catch (e) {
    return errorResponse(e.message || "Erro interno", 500);
  }
});
