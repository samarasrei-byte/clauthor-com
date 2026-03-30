/**
 * ThorIntentDetector.ts — Detect user intent from messages and map to actions
 */

import type { DemoType } from "./AgentDemoModal";

export type ThorIntent =
  | { type: "pricing" }
  | { type: "demo"; demoType: DemoType }
  | { type: "competitor"; competitor: string }
  | { type: "none" };

const PRICING_PATTERNS = /\b(preço|precos|quanto\s*custa|valor|pricing|price|cost|how\s*much|plano|plans?)\b/i;

const DEMO_PATTERNS = /\b(demo|mostre|mostra|mostrar|me\s*mostr[ae]|exemplo|como\s*funciona|how\s*(does\s*)?it\s*work|show\s*me|funciona|see\s*it|try\s*it|testar|test)\b/i;

const COMPETITOR_MAP: Record<string, string[]> = {
  "CrewAI": ["crewai", "crew ai", "crew-ai"],
  "AutoGen": ["autogen", "auto gen", "auto-gen"],
  "LangChain": ["langchain", "lang chain"],
  "ChatGPT": ["chatgpt", "chat gpt", "openai"],
  "Zapier": ["zapier"],
  "Make": ["make.com", "integromat"],
};

const DEPARTMENT_KEYWORDS: Record<DemoType, RegExp> = {
  sdr: /\b(vendas?|sales|prospecção|prospecting|outbound|lead|leads|comercial|sdr|pipeline)\b/i,
  support: /\b(suporte|support|atendimento|customer\s*service|ticket|help\s*desk|chamado)\b/i,
  hr: /\b(rh|hr|recursos\s*humanos|human\s*resources|recrutamento|hiring|contratação|people)\b/i,
  content: /\b(conteúdo|content|marketing|social\s*media|post|blog|copy|redação)\b/i,
  data: /\b(dados|data|análise|analytics|relatório|report|bi|business\s*intelligence|dashboard)\b/i,
  generic: /(?!)/,  // Never matches
};

export function detectIntent(message: string): ThorIntent {
  const lower = message.toLowerCase();

  // Check competitor first (most specific)
  for (const [name, patterns] of Object.entries(COMPETITOR_MAP)) {
    if (patterns.some(p => lower.includes(p))) {
      return { type: "competitor", competitor: name };
    }
  }

  // Check demo intent
  if (DEMO_PATTERNS.test(message)) {
    const demoType = detectDepartment(message);
    return { type: "demo", demoType };
  }

  // Check pricing intent
  if (PRICING_PATTERNS.test(message)) {
    return { type: "pricing" };
  }

  return { type: "none" };
}

export function detectDepartment(message: string): DemoType {
  for (const [dept, regex] of Object.entries(DEPARTMENT_KEYWORDS)) {
    if (dept !== "generic" && regex.test(message)) {
      return dept as DemoType;
    }
  }
  return "generic";
}

export function detectDepartmentFromConversation(messages: { role: string; content: string }[]): DemoType {
  // Look at last 5 messages for department context
  const recent = messages.slice(-5);
  for (const msg of recent.reverse()) {
    const dept = detectDepartment(msg.content);
    if (dept !== "generic") return dept;
  }
  return "generic";
}

export function buildPricingResponse(lang: string): string {
  const isPt = lang.startsWith("pt");
  return isPt
    ? `💰 Ótima pergunta! Nossos planos foram feitos para caber no seu bolso:\n\n` +
      `🟢 **Starter** — R$197/mês → 1 agente, ideal para começar\n` +
      `🔵 **Professional** — R$497/mês → 3 agentes + squad\n` +
      `🟣 **Enterprise** — Sob medida → Agentes ilimitados\n\n` +
      `👉 Quer que eu te ajude a escolher o melhor plano? Ou pode ver todos os detalhes em [Preços](/pricing).`
    : `💰 Great question! Our plans are designed to fit your budget:\n\n` +
      `🟢 **Starter** — $47/mo → 1 agent, perfect to start\n` +
      `🔵 **Professional** — $127/mo → 3 agents + squad\n` +
      `🟣 **Enterprise** — Custom → Unlimited agents\n\n` +
      `👉 Want me to help you choose the best plan? Or see all details at [Pricing](/pricing).`;
}

export function buildCompetitorResponse(competitor: string, lang: string): string {
  const isPt = lang.startsWith("pt");

  const differentials: Record<string, { pt: string; en: string }> = {
    CrewAI: {
      pt: `Conheço bem o ${competitor}! É um framework excelente para devs, mas a Clauthor é diferente:\n\n` +
        `✅ **Interface pronta** — Não precisa escrever código\n` +
        `✅ **Governança enterprise** — RLS, audit logs, multi-tenant\n` +
        `✅ **Orquestração A2A** — Agentes colaboram entre si automaticamente\n` +
        `✅ **Dashboard completo** — Métricas, ROI, logs em tempo real\n\n` +
        `O ${competitor} é tipo montar um carro do zero. A Clauthor é o carro pronto, com GPS e motorista. 🚗`,
      en: `I know ${competitor} well! It's an excellent dev framework, but Clauthor is different:\n\n` +
        `✅ **Ready-to-use UI** — No coding needed\n` +
        `✅ **Enterprise governance** — RLS, audit logs, multi-tenant\n` +
        `✅ **A2A Orchestration** — Agents collaborate automatically\n` +
        `✅ **Full dashboard** — Metrics, ROI, real-time logs\n\n` +
        `${competitor} is like building a car from scratch. Clauthor is the car, ready to drive. 🚗`,
    },
  };

  const defaultResp = {
    pt: `Conheço o ${competitor}! Boa ferramenta, mas a Clauthor oferece:\n\n` +
      `✅ **Sem código** — Configure agentes em minutos\n` +
      `✅ **Segurança enterprise** — RLS, criptografia, audit logs\n` +
      `✅ **Departamentos completos** — Vendas, Suporte, RH, Marketing, tudo integrado\n` +
      `✅ **ROI mensurável** — Veja exatamente quanto cada agente gera de valor\n\n` +
      `Quer ver a diferença na prática? Posso te mostrar uma demo agora! 🚀`,
    en: `I know ${competitor}! Good tool, but Clauthor offers:\n\n` +
      `✅ **No-code** — Set up agents in minutes\n` +
      `✅ **Enterprise security** — RLS, encryption, audit logs\n` +
      `✅ **Full departments** — Sales, Support, HR, Marketing, all integrated\n` +
      `✅ **Measurable ROI** — See exactly how much value each agent generates\n\n` +
      `Want to see the difference? I can show you a demo right now! 🚀`,
  };

  const resp = differentials[competitor] || defaultResp;
  return isPt ? resp.pt : resp.en;
}

export function buildDemoOffer(demoType: DemoType, lang: string): string {
  const isPt = lang.startsWith("pt");
  const names: Record<DemoType, { pt: string; en: string }> = {
    sdr: { pt: "SDR Agent prospectando um lead", en: "SDR Agent prospecting a lead" },
    support: { pt: "Support Agent resolvendo um ticket", en: "Support Agent resolving a ticket" },
    hr: { pt: "HR Agent triando um candidato", en: "HR Agent screening a candidate" },
    content: { pt: "Content Agent criando um post", en: "Content Agent creating a post" },
    data: { pt: "Data Agent analisando métricas", en: "Data Agent analyzing metrics" },
    generic: { pt: "um agente IA em ação", en: "an AI agent in action" },
  };

  const name = names[demoType];
  return isPt
    ? `🎬 Posso te mostrar o **${name.pt}** agora mesmo! Quer ver a simulação ao vivo?`
    : `🎬 I can show you the **${name.en}** right now! Want to see the live simulation?`;
}
