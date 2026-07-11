import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { startRun } from "../_shared/execution-tracer.ts";

// Hunter v2 - Instrumented with execution-tracer for replayable runs.

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

    // Per-tenant credentials (fallback to global env for backwards compatibility)
    const { data: cfg } = await supabase
      .from("hunter_config")
      .select("phantombuster_api_key_encrypted, phantombuster_search_agent_id")
      .eq("user_id", user.id)
      .maybeSingle();
    const pbKey = cfg?.phantombuster_api_key_encrypted || Deno.env.get("PHANTOMBUSTER_API_KEY");
    const searchAgentId = cfg?.phantombuster_search_agent_id || Deno.env.get("PHANTOMBUSTER_SEARCH_AGENT_ID");
    const cookie = session?.linkedin_cookie;

    // Resolve tenant for tracer
    const { data: tm } = await supabase
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    const tenantId = tm?.tenant_id ?? user.id;

    const tracer = await startRun(supabase, {
      tenantId,
      userId: user.id,
      runType: "hunter",
      agents: ["hunter-buscar-leads"],
      message: `Campanha "${campaign.nome}" (limite ${campaign.limite_diario}/dia)`,
    }).catch(() => null);

    await tracer?.step("thought", {
      title: `Iniciando busca de leads`,
      content: {
        campaign_id,
        cargo_alvo: campaign.cargo_alvo,
        setor_alvo: campaign.setor_alvo,
        localizacao_alvo: campaign.localizacao_alvo,
        limite_diario: campaign.limite_diario,
      },
      agent_slug: "hunter",
    });

    await supabase.from("hunter_logs").insert({
      campaign_id,
      user_id: user.id,
      tipo: "info",
      mensagem: `Execução iniciada para "${campaign.nome}" (limite: ${campaign.limite_diario}/dia)`,
    });


    // Guard: PhantomBuster and LinkedIn cookie are required for real prospecting.
    // Previously this branch silently inserted fake demo leads — now we fail loudly.
    if (!pbKey || !searchAgentId || !cookie) {
      const missing: string[] = [];
      if (!pbKey) missing.push("PhantomBuster API key");
      if (!searchAgentId) missing.push("PhantomBuster search agent ID");
      if (!cookie) missing.push("LinkedIn session cookie");

      const message = `Configuração incompleta: faltam ${missing.join(", ")}. Configure em Hunter → Configurações antes de executar campanhas.`;

      await supabase.from("hunter_logs").insert({
        campaign_id,
        user_id: user.id,
        tipo: "erro",
        mensagem: message,
      });

      return jsonResponse(
        {
          success: false,
          error: "configuration_incomplete",
          message,
          missing,
        },
        422,
      );
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
