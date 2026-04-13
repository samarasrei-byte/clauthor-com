import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

const AI_GATEWAY = "https://ai-gateway.lovable.dev/v1/chat/completions";

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

    // Get leads without icebreakers
    const { data: leads, error: leadsErr } = await supabase
      .from("hunter_leads")
      .select("id, nome_completo, cargo, empresa")
      .eq("campaign_id", campaign_id)
      .eq("user_id", user.id)
      .eq("icebreaker", "");

    if (leadsErr) return errorResponse(leadsErr.message, 400);
    if (!leads || leads.length === 0) return jsonResponse({ success: true, message: "Nenhum lead sem icebreaker" });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let generated = 0;

    for (const lead of leads) {
      try {
        let icebreaker: string;

        if (LOVABLE_API_KEY) {
          const aiRes = await fetch(AI_GATEWAY, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                {
                  role: "system",
                  content: "Você é um especialista em prospecção no LinkedIn. Gere icebreakers curtos (máximo 200 caracteres) para notas de conexão. Seja natural e humano, nunca genérico. Retorne APENAS o texto do icebreaker, sem aspas.",
                },
                {
                  role: "user",
                  content: `Gere um icebreaker para nota de conexão no LinkedIn.\nNome: ${lead.nome_completo}\nCargo: ${lead.cargo}\nEmpresa: ${lead.empresa}\n\nFormato: Oi [nome], vi que você é [cargo] na [empresa]. [observação curta e humana]. Posso te adicionar?`,
                },
              ],
              max_tokens: 100,
              temperature: 0.8,
            }),
          });

          if (!aiRes.ok) throw new Error("AI gateway error");
          const aiData = await aiRes.json();
          icebreaker = aiData.choices?.[0]?.message?.content?.trim() || "";
        } else {
          // Fallback template
          icebreaker = `Oi ${lead.nome_completo}, vi que você é ${lead.cargo} na ${lead.empresa}. Adoraria trocar uma ideia.`;
        }

        if (icebreaker) {
          await supabase.from("hunter_leads").update({ icebreaker }).eq("id", lead.id);
          generated++;
        }
      } catch {
        // Continue with next lead
      }
    }

    await supabase.from("hunter_logs").insert({
      campaign_id,
      user_id: user.id,
      tipo: "sucesso",
      mensagem: `Icebreakers gerados: ${generated}/${leads.length} leads`,
    });

    return jsonResponse({ success: true, generated, total: leads.length });
  } catch (e) {
    return errorResponse(e.message || "Erro interno", 500);
  }
});
