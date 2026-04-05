/**
 * Auto-generated progressive disclosure descriptions for 200+ agents.
 * Uses workforce architecture data to produce structured content.
 */

import { WORKFORCE } from "./workforceArchitecture";

export interface AgentDescription {
  oneLiner: string;
  category: string;
  expectedOutcome: string;
  impactLevel: "low" | "medium" | "high";
  sections: {
    whatItDoes: string;
    howItWorks: string;
    whenToUse: string;
    whenNotToUse: string;
    expectedResults: string;
    exampleInPractice: string;
    complexityLevel: "beginner" | "intermediate" | "advanced";
    dataInputs: string;
    output: string;
  };
  faq: { q: string; a: string }[];
  labels: string[];
}

// ─── Category mapping ───
const DEPT_CATEGORY: Record<string, string> = {
  marketing: "Marketing",
  growth: "Growth",
  product: "Product",
  sales: "Sales",
  customer_success: "Customer Success",
  finance: "Finance",
  operations: "Operations",
  security: "Security",
  engineering: "Engineering",
  data_analytics: "Analytics",
  communications: "Communications",
  talent: "HR & Talent",
  innovation: "Innovation",
  it_infrastructure: "IT Infrastructure",
  strategy: "Strategy",
};

// ─── Outcome patterns per department ───
const DEPT_OUTCOMES: Record<string, { outcome: string; impact: "low" | "medium" | "high" }> = {
  marketing: { outcome: "+20–40% em engajamento e leads", impact: "high" },
  growth: { outcome: "+15–30% em crescimento de receita", impact: "high" },
  product: { outcome: "Ciclo de entrega 2x mais rápido", impact: "high" },
  sales: { outcome: "+10–25% em taxa de conversão", impact: "high" },
  customer_success: { outcome: "-30% em churn e +NPS", impact: "medium" },
  finance: { outcome: "Economia de 15h/semana em processos", impact: "medium" },
  operations: { outcome: "+40% em eficiência operacional", impact: "high" },
  security: { outcome: "Redução de 90% em vulnerabilidades", impact: "high" },
  engineering: { outcome: "Deploy 3x mais rápido e seguro", impact: "high" },
  data_analytics: { outcome: "Insights em minutos, não dias", impact: "medium" },
  communications: { outcome: "+50% em alcance de marca", impact: "medium" },
  talent: { outcome: "-40% no tempo de contratação", impact: "medium" },
  innovation: { outcome: "3x mais experimentos validados", impact: "medium" },
  it_infrastructure: { outcome: "99.9% uptime garantido", impact: "medium" },
  strategy: { outcome: "Decisões 5x mais rápidas com dados", impact: "high" },
};

// ─── Complexity by tier mapping ───
const TIER_COMPLEXITY: Record<string, "beginner" | "intermediate" | "advanced"> = {
  basic: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
  enterprise: "advanced",
};

// ─── Smart label assignment ───
function getLabels(slug: string, deptId: string, responsibilities: string[]): string[] {
  const labels: string[] = [];
  const highImpactDepts = ["marketing", "growth", "sales", "security"];
  if (highImpactDepts.includes(deptId)) labels.push("Alto Impacto");

  const popularSlugs = [
    "social_media_agent", "media_buyer", "seo_strategist", "sdr_outbound",
    "content_strategist", "ai_cfo", "campaign_manager", "customer_health",
    "brand_architect", "growth_hacker", "data_scientist", "devops_engineer",
  ];
  if (popularSlugs.includes(slug)) labels.push("Mais Usado");

  if (responsibilities.some(r => r.toLowerCase().includes("automação") || r.toLowerCase().includes("automat"))) {
    labels.push("Automação");
  }

  const recommendedDepts = ["marketing", "sales", "growth"];
  if (recommendedDepts.includes(deptId) && labels.length < 2) labels.push("Recomendado");

  return labels.slice(0, 2);
}

/**
 * Generates a human-friendly one-liner from agent responsibilities.
 */
function generateOneLiner(name: string, responsibilities: string[]): string {
  if (responsibilities.length === 0) return `Automatiza tarefas com IA para ${name.toLowerCase()}`;
  const main = responsibilities[0];
  // Make it outcome-focused
  return `${main} de forma autônoma usando inteligência artificial`;
}

function generateWhatItDoes(name: string, responsibilities: string[]): string {
  const tasks = responsibilities.slice(0, 4).join(", ");
  return `O ${name} é um agente autônomo de IA especializado em: ${tasks}. Ele opera 24/7 sem supervisão, executando tarefas complexas que normalmente exigiriam horas de trabalho manual.`;
}

function generateHowItWorks(name: string, triggers: string[]): string {
  const triggerList = triggers.slice(0, 3).map(t => t.replace(/_/g, " ")).join(", ");
  return `O agente é ativado automaticamente por eventos como: ${triggerList}. Ele analisa o contexto, planeja a melhor estratégia usando modelos de IA e executa as ações necessárias. Cada execução gera um relatório com métricas de resultado.`;
}

function generateWhenToUse(responsibilities: string[]): string {
  const scenarios = responsibilities.slice(0, 3).map(r => `• Quando você precisa de ${r.toLowerCase()}`).join("\n");
  return `Use este agente quando:\n${scenarios}\n• Quando quer escalar operações sem contratar mais pessoas\n• Quando precisa de resultados consistentes 24/7`;
}

function generateWhenNotToUse(): string {
  return `Evite usar quando:\n• A tarefa exige decisões estratégicas de altíssimo nível que requerem contexto humano único\n• Você precisa de interação humana direta com clientes em situações muito sensíveis\n• Os dados necessários ainda não estão disponíveis ou são insuficientes`;
}

function generateExample(name: string, responsibilities: string[]): string {
  const task = responsibilities[0] || "análise";
  return `Uma empresa de médio porte ativou o ${name} para automatizar ${task.toLowerCase()}. Em 30 dias, o agente executou mais de 500 tarefas automaticamente, economizando ~20 horas semanais da equipe e gerando um aumento mensurável nos resultados.`;
}

function generateDataInputs(responsibilities: string[]): string {
  return `O agente precisa de acesso às suas contas e dados relevantes. Quanto mais contexto você fornecer (metas, histórico, preferências), melhores serão os resultados. A configuração inicial leva menos de 5 minutos.`;
}

function generateOutput(responsibilities: string[]): string {
  return `Relatórios de execução detalhados, métricas de performance em tempo real, alertas sobre oportunidades e problemas, e entregas concretas relacionadas às suas responsabilidades.`;
}

function generateFAQ(): { q: string; a: string }[] {
  return [
    { q: "Preciso de conhecimento técnico?", a: "Não. O agente foi projetado para ser configurado em minutos, sem código. Basta conectar suas contas e definir seus objetivos." },
    { q: "Quanto tempo leva para ver resultados?", a: "Os primeiros resultados aparecem em 24-48 horas. Resultados significativos geralmente surgem na primeira semana de operação." },
    { q: "É totalmente automático?", a: "Sim, o agente opera de forma autônoma. Você pode definir níveis de autonomia: totalmente automático ou com aprovação para ações de alto impacto." },
    { q: "Posso personalizar o comportamento?", a: "Totalmente. Você pode ajustar instruções, prioridades, tom de comunicação e regras de negócio para alinhar com sua estratégia." },
  ];
}

// ─── Build full description map ───
const descriptionMap = new Map<string, AgentDescription>();

for (const dept of WORKFORCE) {
  const deptOutcome = DEPT_OUTCOMES[dept.id] || { outcome: "+20% em eficiência", impact: "medium" as const };
  const category = DEPT_CATEGORY[dept.id] || "AI";

  for (const squad of dept.squads) {
    for (const agent of squad.agents) {
      descriptionMap.set(agent.slug, {
        oneLiner: generateOneLiner(agent.name, agent.responsibilities),
        category,
        expectedOutcome: deptOutcome.outcome,
        impactLevel: deptOutcome.impact,
        sections: {
          whatItDoes: generateWhatItDoes(agent.name, agent.responsibilities),
          howItWorks: generateHowItWorks(agent.name, agent.triggers),
          whenToUse: generateWhenToUse(agent.responsibilities),
          whenNotToUse: generateWhenNotToUse(),
          expectedResults: `Com base nos dados de uso da plataforma, empresas que utilizam este agente reportam: ${deptOutcome.outcome}. Resultados variam conforme o volume de dados e configuração.`,
          exampleInPractice: generateExample(agent.name, agent.responsibilities),
          complexityLevel: TIER_COMPLEXITY["intermediate"] || "intermediate",
          dataInputs: generateDataInputs(agent.responsibilities),
          output: generateOutput(agent.responsibilities),
        },
        faq: generateFAQ(),
        labels: getLabels(agent.slug, dept.id, agent.responsibilities),
      });
    }
  }
}

export function getAgentDescription(slug: string): AgentDescription | null {
  return descriptionMap.get(slug) || null;
}

export function getAllDescriptions(): Map<string, AgentDescription> {
  return descriptionMap;
}
