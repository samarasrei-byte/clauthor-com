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
const VALID_DEPTS = ["comercial", "atendimento", "marketing", "juridico", "financeiro", "rh"] as const;
type DeptId = (typeof VALID_DEPTS)[number];

const PAIN_TO_DEPT: Array<{ needle: RegExp; deptId: DeptId }> = [
  { needle: /(atend|suporte|sac|cliente\s+(demora|espera|reclam)|resposta|sla|whatsapp\s+lotado|nps|csat|ces|churn|retenção|retencao|satisfa|experi[eê]ncia\s+do\s+cliente|\bcx\b|cancelament|reclama|ticket)/i, deptId: "atendimento" },
  { needle: /(vend|comercial|pipeline|\blead\b|prospec|\bsdr\b|meta\s+de\s+venda|receita|closing|fechament|ciclo\s+de\s+venda|conver[sç][ãa]o\s+de\s+lead)/i, deptId: "comercial" },
  { needle: /(marketing|an[uú]nc|\bads\b|tr[aá]feg|\broas\b|\bcac\b|conte[uú]do|instagram|linkedin\s+post|\bseo\b|branding|awareness|funil\s+de\s+topo)/i, deptId: "marketing" },
  { needle: /(contrato|jur[ií]dic|legal|lgpd|complian|process|advog|\bnda\b|termos|due\s+dilig)/i, deptId: "juridico" },
  { needle: /(financ|\bdre\b|caixa|cobran|pagament|contab|fatur|invoice|boleto|inadimpl)/i, deptId: "financeiro" },
  { needle: /(\brh\b|contrata|recruta|pessoas|turnover|engaj|onboarding\s+de\s+colab|clima|cultura|talent|headcount)/i, deptId: "rh" },
];

const DEFAULT_DEPT_BY_INDUSTRY: Record<string, DeptId> = {
  "Tecnologia / SaaS": "comercial",
  "E-commerce": "atendimento",
  "Saúde / Clínica": "atendimento",
  "Educação": "marketing",
  "Imobiliário": "comercial",
  "Jurídico": "juridico",
  "Financeiro": "atendimento",
  "Alimentação": "atendimento",
  "Beleza / Estética": "atendimento",
  "Varejo": "atendimento",
  "Indústria": "comercial",
};

function recommendDepartmentRegex(pain: string, industry?: string): DeptId {
  const found = PAIN_TO_DEPT.find(({ needle }) => needle.test(pain));
  if (found) return found.deptId;
  if (industry && DEFAULT_DEPT_BY_INDUSTRY[industry]) return DEFAULT_DEPT_BY_INDUSTRY[industry];
  return "comercial";
}

/**
 * Classifica dor → departamento via LLM (primário) com fallback regex.
 * Nunca lança — o funil não pode travar por causa de gateway offline.
 */
async function recommendDepartment(pain: string, industry?: string, empresa?: string): Promise<DeptId> {
  const system = `Você classifica a dor de negócio de um cliente em UM ÚNICO departamento.
Ids permitidos (retorne EXATAMENTE um):
- "comercial" → vendas, prospecção, pipeline, SDR, closing, receita nova
- "atendimento" → CX, NPS, CSAT, churn, retenção, satisfação, suporte, SLA, cancelamento
- "marketing" → tráfego, ROAS, ads, conteúdo, SEO, branding, funil de topo
- "juridico" → contratos, LGPD, compliance, processos, due diligence
- "financeiro" → DRE, caixa, cobrança, contas a pagar/receber, inadimplência
- "rh" → contratação, turnover, cultura, onboarding de colaborador
Retorne SOMENTE JSON: {"dept_id": "<id>"}. Nada mais.`;
  const user = `Dor: "${pain}"\nSetor: "${industry ?? "Outro"}"\nEmpresa: "${empresa ?? ""}"`;
  const parsed = await callAiJson(system, user);
  const raw = (parsed as { dept_id?: unknown })?.dept_id;
  if (typeof raw === "string" && (VALID_DEPTS as readonly string[]).includes(raw)) {
    return raw as DeptId;
  }
  return recommendDepartmentRegex(pain, industry);
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
  dor?: string;
}

/**
 * Gera 3 leads plausíveis (nomes + cargos + empresas fictícias) que
 * casem com o ICP declarado. O campo `signal` DEVE referenciar a dor
 * concreta do usuário — é o que faz o feed parecer real.
 */
async function sampleLeads({ icp, industry, dept_id, empresa, dor }: SampleLeadsPayload): Promise<Response> {
  if (!icp || icp.trim().length < 3) return errorResponse("icp é obrigatório");

  const system = `Você gera exemplos de LEADS plausíveis (fictícios mas realistas) para uma demonstração.
Retorne SOMENTE um JSON válido no formato exato:
{
  "leads": [
    { "name": "Nome Sobrenome", "role": "Cargo · Empresa Fictícia", "signal": "Frase curta (max 16 palavras) que cite explicitamente a DOR do cliente e por que esse lead a sente também" }
  ]
}
Regras:
- Exatamente 3 leads.
- Nomes brasileiros verossímeis, empresas fictícias com sufixos como "Labs", "Digital", "Solutions", "Pay", "Tech".
- Cargos coerentes com o ICP.
- NÃO use empresas reais famosas.
- O campo "signal" NUNCA pode ser genérico — precisa referenciar a dor específica (ex.: "Também viu NPS cair 14 pts em 3 meses e busca um squad de CX").`;

  const user = `ICP do cliente: "${icp}"
Dor do cliente (obrigatório referenciar): "${dor ?? "não informada"}"
Setor do cliente: "${industry ?? "Outro"}"
Departamento a demonstrar: "${dept_id ?? "comercial"}"
Empresa do cliente (contexto, NÃO usar como lead): "${empresa ?? ""}"`;

  const parsed = await callAiJson(system, user);
  const leads = Array.isArray((parsed as any)?.leads) ? (parsed as any).leads.slice(0, 3) : null;

  if (leads && leads.length > 0) {
    return jsonResponse({ leads, source: "ai" });
  }

  // Fallback determinístico — signal reutiliza a dor real quando disponível.
  const painFrag = dor && dor.trim().length > 0
    ? `Mesma dor: "${dor.trim().slice(0, 80)}${dor.length > 80 ? "…" : ""}"`
    : "Perfil bate com o ICP declarado";
  return jsonResponse({
    leads: [
      { name: "Marina Alves", role: "Head of Growth · Trilha Digital", signal: painFrag },
      { name: "Rafael Costa",  role: "Diretor Comercial · Delta Labs",  signal: `${painFrag} — empresa cresceu 40% em 12 meses` },
      { name: "Camila Souza",  role: "Founder · Verso Solutions",       signal: `${painFrag} — publicou sobre o tema esta semana` },
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

  const dept_id = payload.dept_id || (await recommendDepartment(payload.dor, payload.industry, payload.empresa));

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
