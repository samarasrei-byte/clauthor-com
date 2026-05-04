import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

// Hunter v2 - Reads PhantomBuster credentials from environment (not user config).
// Body: { campaign_id: string }
Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return errorResponse("Unauthorized", 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse("Unauthorized", 401);

    const { campaign_id } = await req.json();
    if (!campaign_id) return errorResponse("campaign_id obrigatório", 400);

    const { data: campaign, error: campErr } = await supabase
      .from("hunter_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .eq("user_id", user.id)
      .single();
    if (campErr || !campaign) return errorResponse("Campanha não encontrada", 404);

    const { data: session } = await supabase
      .from("hunter_linkedin_session")
      .select("linkedin_cookie")
      .eq("user_id", user.id)
      .single();

    const pbKey = Deno.env.get("PHANTOMBUSTER_API_KEY");
    const searchAgentId = Deno.env.get("PHANTOMBUSTER_SEARCH_AGENT_ID");
    const cookie = session?.linkedin_cookie;

    await supabase.from("hunter_logs").insert({
      campaign_id,
      user_id: user.id,
      tipo: "info",
      mensagem: `Execução iniciada para "${campaign.nome}" (limite: ${campaign.limite_diario}/dia)`,
    });

    // Fallback: no PhantomBuster or no LinkedIn session - generate demo leads
    if (!pbKey || !searchAgentId || !cookie) {
      const demoLeads = Array.from({ length: Math.min(5, campaign.limite_diario) }, (_, i) => ({
        campaign_id,
        user_id: user.id,
        nome_completo: `Lead Demo ${i + 1}`,
        cargo: campaign.cargo_alvo || "Gerente",
        empresa: `Empresa ${i + 1}`,
        linkedin_url: `https://linkedin.com/in/demo-lead-${i + 1}`,
        status: "novo",
      }));

      await supabase.from("hunter_leads").insert(demoLeads);
      await supabase.from("hunter_campaigns").update({
        total_leads: (campaign.total_leads || 0) + demoLeads.length,
        last_run_at: new Date().toISOString(),
      }).eq("id", campaign_id);

      await supabase.from("hunter_logs").insert({
        campaign_id,
        user_id: user.id,
        tipo: "info",
        mensagem: !cookie
          ? "LinkedIn não conectado - gerados leads de demonstração."
          : "Modo demo - gerados leads de demonstração.",
      });

      return jsonResponse({ success: true, demo: true, leads_count: demoLeads.length });
    }

    // Real PhantomBuster Search call
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
            sessionCookie: cookie,
            searches: `${campaign.cargo_alvo} ${campaign.setor_alvo}`.trim(),
            location: campaign.localizacao_alvo,
            numberOfResultsPerSearch: campaign.limite_diario || 20,
          },
        }),
      });

      if (!pbResponse.ok) {
        const errText = await pbResponse.text();
        throw new Error(`PhantomBuster [${pbResponse.status}]: ${errText}`);
      }

      await supabase.from("hunter_campaigns").update({
        last_run_at: new Date().toISOString(),
      }).eq("id", campaign_id);

      await supabase.from("hunter_logs").insert({
        campaign_id,
        user_id: user.id,
        tipo: "sucesso",
        mensagem: `PhantomBuster Search disparado (limite ${campaign.limite_diario}). Leads chegam por webhook.`,
      });

      return jsonResponse({ success: true, message: "Busca iniciada no PhantomBuster" });
    } catch (e) {
      await supabase.from("hunter_logs").insert({
        campaign_id,
        user_id: user.id,
        tipo: "erro",
        mensagem: `Erro PhantomBuster: ${(e as Error).message}`,
      });
      return errorResponse((e as Error).message, 500);
    }
  } catch (e) {
    return errorResponse((e as Error).message || "Erro interno", 500);
  }
});
