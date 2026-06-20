// Workforce Architect — sugere blueprint a partir do objetivo de negócio
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";
import { generateText, Output } from "npm:ai";
import { z } from "npm:zod";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEMPLATE_IDS = [
  "sdr-out","sdr-in","closer","ae-enterprise","bdr","rev-ops","proposal-writer","contract-negotiator","upsell-agent",
  "content-strategist","copywriter","seo-specialist","paid-media","social-media","email-mkt","growth-hacker","community-mgr",
  "recruiter","hr-bp","onboarding-rh","payroll","training-rh","culture-agent",
  "controller","ap","ar","fp-a","billing","cfo-virtual",
  "contracts","litigation","compliance-juridico","paralegal",
  "support-tier1","support-tier2","escalation","triage","kb-writer","voice-agent","whatsapp-concierge",
  "project-mgr","ops-analyst","workflow-builder",
  "devops","sre","secops","helpdesk","code-reviewer","data-engineer",
  "pm","ux-researcher","ux-designer","product-marketer","analytics-pm",
  "data-analyst","data-scientist","bi-engineer",
  "lgpd","risk-officer",
  "csm","onboarding-cs","renewal-mgr","health-score","voice-of-customer",
  "buyer","sourcing","supplier-mgmt",
  "last-mile","warehouse","tracking-agent",
  "ceo-virtual","coo-virtual","cmo-virtual","cto-virtual","chief-of-staff",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), { status: 500, headers: corsHeaders });

    const { objective, scale } = await req.json();
    if (!objective || typeof objective !== "string") {
      return new Response(JSON.stringify({ error: "objective required" }), { status: 400, headers: corsHeaders });
    }

    const gateway = createLovableAiGatewayProvider(key);
    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: `Você é um Principal Product Architect da Clauthor. Recebe um objetivo de negócio e propõe uma estrutura de força de trabalho digital (agentes IA). Devolve um blueprint estruturado em PT-BR. Escolha apenas template IDs desta lista: ${TEMPLATE_IDS.join(", ")}.`,
      prompt: `Objetivo: ${objective}\nEscala desejada: ${scale}\n\nProponha um nome curto, escolha de 1 a 10 agentes apropriados, nível de autonomia, integrações, canais e ferramentas.`,
      output: Output.object({
        schema: z.object({
          name: z.string(),
          scale: z.enum(["agent","squad","department","org"]),
          selectedTemplates: z.array(z.string()).min(1).max(15),
          autonomy: z.enum(["assistant","operator","specialist","coordinator","executive"]),
          tools: z.array(z.string()).max(10),
          integrations: z.array(z.string()).max(10),
          channels: z.array(z.string()).max(8),
          rationale: z.string(),
        }),
      }),
    });

    // Filter to only known IDs
    const filtered = {
      ...output,
      selectedTemplates: output.selectedTemplates.filter((id: string) => TEMPLATE_IDS.includes(id)),
    };

    return new Response(JSON.stringify({ blueprint: filtered }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
