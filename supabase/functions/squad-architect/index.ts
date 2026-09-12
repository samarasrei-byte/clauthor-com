import { z } from "npm:zod";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchAI } from "../_shared/ai-gateway.ts";
import { getUserFromRequest, unauthorizedResponse } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const agentSchema = z.object({
  name: z.string().min(2).max(80),
  role: z.string().min(2).max(120),
  personality: z.string().min(2).max(300),
  mission: z.string().min(2).max(400).optional(),
  responsibilities: z.array(z.string().min(2).max(300)).min(3).max(6),
  delivery: z.string().min(2).max(600).optional(),
  assumptions: z.array(z.string().max(300)).max(6).default([]),
  limitations: z.array(z.string().max(300)).max(6).default([]),
});

const blueprintSchema = z.object({
  squadName: z.string().min(2).max(100),
  slogan: z.string().min(2).max(180),
  mission: z.string().min(2).max(400),
  problem: z.string().min(2).max(800),
  idealClient: z.string().min(2).max(600),
  principal: agentSchema,
  subagents: z.array(agentSchema).min(2).max(8),
  workflow: z.array(z.string().min(2).max(600)).length(8),
  delegationRules: z.array(z.string().min(2).max(500)).min(4).max(10),
  conflicts: z.array(z.string().max(500)).max(8),
  missingInformation: z.array(z.string().max(500)).max(8),
  executionPlan: z.array(z.object({
    priority: z.enum(["alta", "media", "baixa"]),
    action: z.string().min(2).max(500),
    owner: z.string().min(2).max(100),
    indicator: z.string().min(2).max(300),
  })).min(3).max(10),
  nextStep: z.string().min(2).max(400),
});

const requestSchema = z.object({
  objective: z.string().trim().min(15).max(4000),
  clientProfile: z.string().trim().max(2000).optional().default(""),
  constraints: z.string().trim().max(2000).optional().default(""),
});

const SYSTEM_PROMPT = `Você é o Arquiteto Supremo de Squads da Clauthor. Transforme objetivos de negócio em uma equipe real, útil, criativa, organizada e segura. Crie um coordenador e apenas os especialistas necessários, sem funções repetidas. Use nomes criativos e humor leve, profissional e memorável. Nunca invente fatos, números, integrações, preços ou resultados. Separe premissas de recomendações e sinalize limites. O coordenador deve delegar, comparar, detectar contradições, revisar e consolidar. Cada especialista recebe tarefa objetiva e produz entrega verificável. Não afirme que integrações estão ativas. Retorne somente JSON válido, sem markdown, conforme o contrato solicitado.`;

const jsonContract = {
  squadName: "string", slogan: "string", mission: "string", problem: "string", idealClient: "string",
  principal: { name: "string", role: "string", personality: "string", mission: "string", responsibilities: ["string"], assumptions: ["string"], limitations: ["string"] },
  subagents: [{ name: "string", role: "string", personality: "string", responsibilities: ["string"], delivery: "string", assumptions: ["string"], limitations: ["string"] }],
  workflow: ["exatamente 8 passos, na ordem exigida"], delegationRules: ["string"], conflicts: ["string"], missingInformation: ["string"],
  executionPlan: [{ priority: "alta|media|baixa", action: "string", owner: "string", indicator: "string" }], nextStep: "string",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const auth = await getUserFromRequest(req);
  if (!auth.user) return unauthorizedResponse(corsHeaders, auth.error);

  try {
    const input = requestSchema.parse(await req.json());
    const aiResponse = await fetchAI({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Objetivo:\n${input.objective}\n\nPerfil do cliente informado:\n${input.clientProfile || "Não informado"}\n\nLimites e contexto:\n${input.constraints || "Não informados"}\n\nContrato JSON obrigatório:\n${JSON.stringify(jsonContract)}` },
      ],
      temperature: 0.55,
      max_tokens: 4200,
      response_format: { type: "json_object" },
    }, { complexity: "complex", qualityMode: "balanced" });

    if (!aiResponse.ok) throw new Error("generation_unavailable");
    const raw = await aiResponse.json();
    const content = raw?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("invalid_generation");
    const blueprint = blueprintSchema.parse(JSON.parse(content));

    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    const authorization = req.headers.get("Authorization") ?? "";
    if (!url || !anon) throw new Error("database_not_configured");
    const db = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
    const { data: membership, error: membershipError } = await db.from("tenant_members").select("tenant_id").eq("user_id", auth.user.id).maybeSingle();
    if (membershipError || !membership?.tenant_id) throw new Error("tenant_not_found");

    const { data: saved, error: saveError } = await db.from("squad_blueprints").insert({
      tenant_id: membership.tenant_id,
      owner_id: auth.user.id,
      objective: input.objective,
      client_profile: input.clientProfile || null,
      constraints: input.constraints || null,
      status: "generated",
      blueprint,
      schema_version: 1,
    }).select("id, created_at").single();
    if (saveError) throw new Error("persistence_failed");

    return new Response(JSON.stringify({ blueprint, record: saved }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const isInput = error instanceof z.ZodError;
    const message = error instanceof Error ? error.message : "unexpected_error";
    const status = isInput ? 400 : message === "tenant_not_found" ? 409 : message === "persistence_failed" || message === "database_not_configured" ? 503 : 502;
    return new Response(JSON.stringify({ error: message, fallback: "Revise os dados e tente novamente. Nenhum squad foi ativado." }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
