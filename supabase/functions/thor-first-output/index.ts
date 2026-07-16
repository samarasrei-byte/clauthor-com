/**
 * thor-first-output · o "aha moment" cronometrado.
 *
 * Recebe um prompt livre do usuário, THOR classifica (departamento + tipo de
 * necessidade) E gera o primeiro entregável de exemplo numa mesma passada,
 * registra TTFO em `ttfo_events` e retorna tudo pro cliente.
 *
 * Meta: p50 <30s, p95 <90s. Modelo escolhido pela velocidade (flash).
 * Não substitui a Central de Aprovações — é o *primeiro output visível* que
 * transforma "eu tenho uma IA" em "ela fez algo pra mim".
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface FirstOutputPayload {
  business_summary: string;
  detected_pain: string;
  need_type: "agent" | "squad" | "department";
  routed_department: string;
  recommendation_name: string;
  agent_persona: string;
  output_title: string;
  output_body: string;
  confidence: number;
  next_actions: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const t0 = Date.now();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "missing_auth" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_PUBLISHABLE_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")
      ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "ai_not_configured" }, 500);

    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes.user) return json({ error: "invalid_session" }, 401);
    const user = userRes.user;

    const body = await req.json().catch(() => ({}));
    const prompt = String(body?.prompt ?? "").trim().slice(0, 2000);
    const tenantId: string | null = body?.tenant_id ?? null;
    if (!prompt) return json({ error: "empty_prompt" }, 400);

    // ─────────────── AI: classify + generate em 1 shot ───────────────
    const system = `Você é THOR, orquestrador da CLAUTHOR (20 departamentos, 225 agentes IA).
Recebe um pedido livre do usuário e faz DUAS coisas na mesma resposta:

1) CLASSIFICA a necessidade:
   - "agent" (1 função específica), "squad" (3-6 agentes coordenados), "department" (área contínua)
   - Roteia para 1 dos departamentos: Marketing, Vendas, Atendimento, Financeiro, Jurídico, RH, TI, Produto, Operações, Logística, Compras, Dados, Growth, Design, Conteúdo, Sucesso do Cliente, Estratégia, Compliance, Inovação, Executivo.

2) GERA imediatamente o PRIMEIRO ENTREGÁVEL do agente responsável — algo que o usuário possa
   ler agora e sentir valor real (uma cópia curta pronta, um roteiro de abordagem, um resumo
   analítico, um esboço de estratégia). Preserva o tom brasileiro, direto e específico.
   NADA de "aqui está o que eu faria" — ENTREGA o output em si.

Responda APENAS JSON válido:
{
  "business_summary": "1 frase sobre o pedido",
  "detected_pain": "a dor real, 1 frase",
  "need_type": "agent" | "squad" | "department",
  "routed_department": "nome exato do departamento",
  "recommendation_name": "nome do agente/squad/departamento recomendado",
  "agent_persona": "nome + cargo curto do agente que fez o output (ex: 'Sofia · SDR Outbound')",
  "output_title": "título curto do entregável",
  "output_body": "o entregável em si, 80-220 palavras, em markdown leve",
  "confidence": 0.0-1.0,
  "next_actions": ["ação 1", "ação 2", "ação 3"]
}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text().catch(() => "");
      const status = aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 500;
      await logEvent(supabase, {
        user_id: user.id,
        tenant_id: tenantId,
        prompt,
        success: false,
        error: `ai_${aiRes.status}: ${detail.slice(0, 200)}`,
        ttfo_ms: Date.now() - t0,
      });
      return json({ error: "ai_error", status: aiRes.status, detail }, status);
    }

    const raw = await aiRes.json();
    const content = raw?.choices?.[0]?.message?.content ?? "{}";
    let payload: FirstOutputPayload;
    try {
      payload = JSON.parse(content);
    } catch {
      payload = {
        business_summary: "",
        detected_pain: "",
        need_type: "agent",
        routed_department: "Executivo",
        recommendation_name: "Agente Especialista",
        agent_persona: "THOR",
        output_title: "Primeira resposta",
        output_body: String(content).slice(0, 800),
        confidence: 0.5,
        next_actions: [],
      };
    }

    const ttfo_ms = Date.now() - t0;
    const event = await logEvent(supabase, {
      user_id: user.id,
      tenant_id: tenantId,
      prompt,
      routed_department: payload.routed_department,
      routed_need_type: payload.need_type,
      routed_recommendation: payload.recommendation_name,
      output_preview: payload.output_body?.slice(0, 500) ?? null,
      ttfo_ms,
      success: true,
    });

    return json({
      ttfo_ms,
      event_id: event?.id ?? null,
      ...payload,
    });
  } catch (e: any) {
    return json({ error: "unexpected", detail: String(e?.message ?? e) }, 500);
  }
});

async function logEvent(
  supabase: ReturnType<typeof createClient>,
  row: {
    user_id: string;
    tenant_id: string | null;
    prompt: string;
    routed_department?: string;
    routed_need_type?: "agent" | "squad" | "department";
    routed_recommendation?: string;
    output_preview?: string | null;
    ttfo_ms?: number;
    success: boolean;
    error?: string;
  },
): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from("ttfo_events")
    .insert(row)
    .select("id")
    .maybeSingle();
  return data as { id: string } | null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
