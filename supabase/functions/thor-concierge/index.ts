/**
 * Thor Concierge — funil de 3 turnos que captura contexto do visitante
 * (empresa, dor, ICP) e devolve um `ctx_id` para personalizar a Mesa Redonda.
 *
 * Endpoint único (`POST /functions/v1/thor-concierge`) com discriminador
 * `action`:
 *   - "scan_company"  → { url }                            → { empresa, industry, description, dept_id }
 *   - "sample_leads"  → { icp, industry, dept_id }         → { leads: [...] }
 *   - "finalize"      → { session_id, empresa, ..., leads }→ { ctx_id }
 *   - "get_context"   → { ctx_id }                         → { context }
 *
 * A função é a única superfície de escrita/leitura da tabela
 * `thor_concierge_sessions` (RLS bloqueia PostgREST direto).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

/* -------------------------------------------------------------------------- */
/*  Configuração                                                              */
/* -------------------------------------------------------------------------- */

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/* -------------------------------------------------------------------------- */
/*  Mapeamento dor → departamento                                             */
/* -------------------------------------------------------------------------- */

/**
 * Mapa determinístico dor→departamento. Deve espelhar `DEPARTMENT_PACKAGES`
 * em `src/data/departmentPackages.ts`. Chave é substring lowercase da dor
 * relatada pelo usuário.
 */
const PAIN_TO_DEPT: Array<{ needle: RegExp; deptId: string }> = [
  { needle: /(venda|comercial|pipeline|lead|prospec|sdr|meta|receita)/i, deptId: "comercial" },
  { needle: /(atend|suporte|sac|cliente demora|resposta|sla|whatsapp lotado)/i, deptId: "atendimento" },
  { needle: /(marketing|anún|ads|tráfeg|roas|conteúdo|instagram|linkedin post)/i, deptId: "marketing" },
  { needle: /(contrato|jurídic|legal|lgpd|compliance|process|advog)/i, deptId: "juridico" },
  { needle: /(financ|dre|caixa|cobran|pagament|contab|fatur)/i, deptId: "financeiro" },
  { needle: /(rh|contrata|recruta|pessoas|turnover|engaj|onboarding)/i, deptId: "rh" },
];

const DEFAULT_DEPT_BY_INDUSTRY: Record<string, string> = {
  "Tecnologia / SaaS": "comercial",
  "E-commerce": "marketing",
  "Saúde / Clínica": "atendimento",
  "Educação": "marketing",
  "Imobiliário": "comercial",
  "Jurídico": "juridico",
  "Financeiro": "financeiro",
  "Alimentação": "atendimento",
  "Beleza / Estética": "atendimento",
  "Varejo": "marketing",
  "Indústria": "comercial",
};

/** Retorna o `dept_id` mais provável dado dor + industry (fallback). */
function recommendDepartment(pain: string, industry?: string): string {
  const found = PAIN_TO_DEPT.find(({ needle }) => needle.test(pain));
  if (found) return found.deptId;
  if (industry && DEFAULT_DEPT_BY_INDUSTRY[industry]) return DEFAULT_DEPT_BY_INDUSTRY[industry];
  return "comercial";
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

/**
 * Chama o Lovable AI Gateway pedindo saída JSON pura. Retorna o objeto
 * parseado ou `null` em falha; nunca lança para não derrubar o funil.
 */
async function callAiJson(system: string, user: string): Promise<Record<string, unknown> | null> {
  if (!LOVABLE_API_KEY) {
    console.error("[thor-concierge] LOVABLE_API_KEY missing");
    return null;
  }
  try {
    const res = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        stream: false,
      }),
    });
    if (!res.ok) {
      console.warn(`[thor-concierge] AI gateway ${res.status}`);
      return null;
    }
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    const cleaned = String(raw).replace(/```json\s*/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("[thor-concierge] callAiJson error", err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Ações                                                                     */
/* -------------------------------------------------------------------------- */

interface ScanCompanyPayload {
  url?: string;
  text?: string;
}

/**
 * Reaproveita `company-scanner` (que já orquestra o fetch + LLM) para extrair
 * dados estruturados da empresa a partir de uma URL. Adiciona um fallback
 * plausível quando a chamada falha — o funil não pode travar por causa de
 * um site que bloqueia crawlers.
 */
async function scanCompany({ url, text }: ScanCompanyPayload): Promise<Response> {
  if (!url && !text) return errorResponse("url ou text é obrigatório");

  const action = url ? "scan_url" : "analyze_text";
  const payload = url ? { action, url } : { action, text };

  try {
    const scannerRes = await fetch(`${SUPABASE_URL}/functions/v1/company-scanner`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (scannerRes.ok) {
      const body = await scannerRes.json();
      const data = body?.data ?? {};
      const empresa = data.companyName || fallbackNameFromUrl(url);
      const industry = data.industry || "Outro";
      return jsonResponse({
        empresa,
        industry,
        description: data.description || "",
        products: data.products || "",
        targetAudience: data.targetAudience || "",
        source: "scanner",
      });
    }
    console.warn("[thor-concierge] scanner returned", scannerRes.status);
  } catch (err) {
    console.warn("[thor-concierge] scanner error", err);
  }

  // Fallback: retornar algo utilizável a partir do domínio.
  return jsonResponse({
    empresa: fallbackNameFromUrl(url),
    industry: "Outro",
    description: "",
    source: "fallback",
  });
}

function fallbackNameFromUrl(url?: string): string {
  if (!url) return "Sua empresa";
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname
      .replace(/^www\./, "")
      .split(".")[0];
    return host.charAt(0).toUpperCase() + host.slice(1);
  } catch {
    return "Sua empresa";
  }
}

interface SampleLeadsPayload {
  icp?: string;
  industry?: string;
  dept_id?: string;
  empresa?: string;
}

/**
 * Gera 2-3 leads plausíveis (nomes + cargos + empresas fictícias) que
 * casem com o ICP declarado. Feito via LLM em JSON puro — se falhar,
 * cai num template determinístico para não deixar o feed vazio.
 */
async function sampleLeads({ icp, industry, dept_id, empresa }: SampleLeadsPayload): Promise<Response> {
  if (!icp || icp.trim().length < 3) return errorResponse("icp é obrigatório");

  const system = `Você gera exemplos de LEADS plausíveis (fictícios mas realistas) para uma demonstração.
Retorne SOMENTE um JSON válido no formato exato:
{
  "leads": [
    { "name": "Nome Sobrenome", "role": "Cargo · Empresa Ficctícia", "signal": "Motivo curto pelo qual bate com o ICP (max 12 palavras)" }
  ]
}
Regras: exatamente 3 leads, nomes brasileiros, empresas verossímeis com sufixos como "Labs", "Digital", "Solutions" ou nomes de fantasia, cargos coerentes com o ICP. NÃO use empresas reais famosas.`;

  const user = `ICP do cliente: "${icp}"
Setor do cliente: "${industry ?? "Outro"}"
Departamento a demonstrar: "${dept_id ?? "comercial"}"
Empresa do cliente (contexto): "${empresa ?? ""}"`;

  const parsed = await callAiJson(system, user);
  const leads = Array.isArray((parsed as any)?.leads) ? (parsed as any).leads.slice(0, 3) : null;

  if (leads && leads.length > 0) {
    return jsonResponse({ leads, source: "ai" });
  }

  // Fallback determinístico.
  return jsonResponse({
    leads: [
      { name: "Marina Alves", role: "Head of Growth · Trilha Digital", signal: "Perfil bate 92% com o ICP declarado" },
      { name: "Rafael Costa",  role: "Diretor Comercial · Delta Labs",  signal: "Empresa cresceu 40% em 12 meses no seu segmento" },
      { name: "Camila Souza",  role: "Founder · Verso Solutions",       signal: "Publicou sobre a dor exata que você mencionou" },
    ],
    source: "fallback",
  });
}

interface FinalizePayload {
  session_id?: string;
  empresa?: string;
  empresa_url?: string;
  industry?: string;
  dor?: string;
  icp?: string;
  dept_id?: string;
  leads?: unknown;
  user_id?: string | null;
}

/**
 * Persiste a sessão do concierge e devolve o `ctx_id` para
 * `/experience?ctx=<id>`. Sessões anônimas gravam `user_id = NULL`.
 */
async function finalize(payload: FinalizePayload): Promise<Response> {
  if (!payload.session_id) return errorResponse("session_id é obrigatório");
  if (!payload.dor || !payload.icp) return errorResponse("dor e icp são obrigatórios");

  const dept_id = payload.dept_id || recommendDepartment(payload.dor, payload.industry);

  const { data, error } = await adminClient
    .from("thor_concierge_sessions")
    .insert({
      session_id: payload.session_id,
      user_id: payload.user_id ?? null,
      empresa: payload.empresa ?? null,
      empresa_url: payload.empresa_url ?? null,
      industry: payload.industry ?? null,
      dor: payload.dor,
      icp: payload.icp,
      dept_id,
      context: { leads: payload.leads ?? [] },
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("[thor-concierge] finalize insert error", error);
    return errorResponse("Não foi possível salvar o contexto", 500);
  }

  return jsonResponse({ ctx_id: data.id, dept_id });
}

interface GetContextPayload {
  ctx_id?: string;
}

/** Lê um contexto salvo para a Mesa Redonda hidratar. */
async function getContext({ ctx_id }: GetContextPayload): Promise<Response> {
  if (!ctx_id) return errorResponse("ctx_id é obrigatório");

  const { data, error } = await adminClient
    .from("thor_concierge_sessions")
    .select("id, empresa, empresa_url, industry, dor, icp, dept_id, context, created_at")
    .eq("id", ctx_id)
    .maybeSingle();

  if (error) {
    console.error("[thor-concierge] getContext error", error);
    return errorResponse("Não foi possível ler o contexto", 500);
  }
  if (!data) return errorResponse("Contexto não encontrado", 404);

  return jsonResponse({ context: data });
}

/* -------------------------------------------------------------------------- */
/*  HTTP entrypoint                                                           */
/* -------------------------------------------------------------------------- */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return errorResponse("Método não permitido", 405);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse("JSON inválido");
  }

  const action = String(body.action ?? "");
  try {
    switch (action) {
      case "scan_company":
        return await scanCompany(body as ScanCompanyPayload);
      case "sample_leads":
        return await sampleLeads(body as SampleLeadsPayload);
      case "finalize":
        return await finalize(body as FinalizePayload);
      case "get_context":
        return await getContext(body as GetContextPayload);
      default:
        return errorResponse(`Ação desconhecida: ${action}`);
    }
  } catch (err) {
    console.error("[thor-concierge] fatal", err);
    return errorResponse("Erro interno", 500);
  }
});
