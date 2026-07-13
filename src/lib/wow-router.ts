/**
 * Wow Router · mapa determinístico dor → agente/template ideal.
 * Usado pelo InstantWow para gerar o primeiro entregável em <90s.
 */

export type PainCategory =
  | "vendas_b2b"
  | "juridico"
  | "marketing"
  | "operacoes"
  | "financeiro"
  | "outro";

export interface PainOption {
  id: PainCategory;
  label: string;
  emoji: string;
  agentSlug: string;
  agentLabel: string;
  outputLabel: string;
  systemPrompt: string;
  userPromptTemplate: (company: string, pain: string) => string;
}

export const PAIN_OPTIONS: PainOption[] = [
  {
    id: "vendas_b2b",
    label: "Vendas B2B",
    emoji: "🎯",
    agentSlug: "sales-hunter",
    agentLabel: "Sales Hunter",
    outputLabel: "Cold email personalizado",
    systemPrompt:
      "Você é um SDR sênior B2B. Escreva um cold email curto (máx 120 palavras), com assunto forte, gancho concreto, CTA claro. Português brasileiro, tom consultivo, sem clichês.",
    userPromptTemplate: (company, pain) =>
      `Escreva um cold email B2B que a empresa "${company}" pode enviar hoje para prospectar clientes.\n\nContexto/dor da empresa: ${pain}\n\nFormate como:\nAssunto: ...\n\nCorpo do email (100-120 palavras).`,
  },
  {
    id: "juridico",
    label: "Jurídico",
    emoji: "⚖️",
    agentSlug: "contratos",
    agentLabel: "Agente Contratos",
    outputLabel: "Minuta de NDA",
    systemPrompt:
      "Você é advogado especialista em contratos. Redija minutas claras, com cláusulas essenciais e placeholders [INSERIR DADO] onde faltar informação. Português brasileiro.",
    userPromptTemplate: (company, pain) =>
      `Redija uma minuta enxuta de NDA (Acordo de Confidencialidade) para a empresa "${company}".\n\nContexto: ${pain}\n\nInclua: Partes, Objeto, Prazo, Multa, Foro. Máx 400 palavras.`,
  },
  {
    id: "marketing",
    label: "Marketing",
    emoji: "📢",
    agentSlug: "copy-strategist",
    agentLabel: "Copy Strategist",
    outputLabel: "Headline + hook LinkedIn",
    systemPrompt:
      "Você é copywriter estratégico. Escreva 3 variações de headline e 1 post de LinkedIn (150-180 palavras) com hook forte na primeira linha. Português brasileiro.",
    userPromptTemplate: (company, pain) =>
      `A empresa "${company}" quer melhorar seu marketing.\n\nContexto/dor: ${pain}\n\nEntregue:\n\n**3 Headlines** (uma por linha)\n\n**Post LinkedIn** (150-180 palavras, hook na primeira linha, CTA no final).`,
  },
  {
    id: "operacoes",
    label: "Operações",
    emoji: "⚙️",
    agentSlug: "ops-analyst",
    agentLabel: "Ops Analyst",
    outputLabel: "SOP em 5 passos",
    systemPrompt:
      "Você é analista de operações. Escreva SOPs (Standard Operating Procedures) curtos e acionáveis, em passos numerados. Português brasileiro.",
    userPromptTemplate: (company, pain) =>
      `Crie um SOP em 5 passos para a empresa "${company}" resolver:\n\n${pain}\n\nFormato:\n**Objetivo:** ...\n\n**Passo 1:** ...\n**Passo 2:** ...\n(até Passo 5)\n\n**Métrica de sucesso:** ...`,
  },
  {
    id: "financeiro",
    label: "Financeiro",
    emoji: "💰",
    agentSlug: "cfo-agent",
    agentLabel: "CFO Agent",
    outputLabel: "Análise de fluxo de caixa",
    systemPrompt:
      "Você é CFO fracional. Faça análises financeiras enxutas, com diagnóstico, 3 recomendações práticas e alerta de risco. Português brasileiro.",
    userPromptTemplate: (company, pain) =>
      `Faça uma análise financeira inicial para a empresa "${company}".\n\nContexto/dor: ${pain}\n\nFormato:\n**Diagnóstico** (2-3 frases)\n\n**3 Recomendações** (bullets acionáveis)\n\n**Alerta de risco** (1 frase)`,
  },
  {
    id: "outro",
    label: "Outro",
    emoji: "✨",
    agentSlug: "thor-generalist",
    agentLabel: "Thor",
    outputLabel: "Plano de ação em 5 pontos",
    systemPrompt:
      "Você é Thor, CEO de IA da Clauthor. Entregue planos de ação diretos, com 5 passos priorizados. Português brasileiro, tom executivo.",
    userPromptTemplate: (company, pain) =>
      `A empresa "${company}" trouxe este desafio:\n\n${pain}\n\nEntregue um plano de ação em 5 pontos, priorizados por impacto vs. esforço. Formato: **Ponto N:** título · descrição (1-2 frases).`,
  },
];

export function getPainOption(id: PainCategory): PainOption {
  return PAIN_OPTIONS.find((p) => p.id === id) ?? PAIN_OPTIONS[PAIN_OPTIONS.length - 1];
}
