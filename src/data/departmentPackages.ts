/**
 * Departamentos Prontos — packages pré-configurados vendidos como solução.
 *
 * Cada package amarra:
 * - Uma dor específica de PME BR
 * - Um outcome mensurável (com garantia opcional)
 * - Um conjunto de agentes existentes no WORKFORCE
 * - Um roteiro de demonstração de ~60s (timeline plausível em pt-BR)
 * - Um preço mensal em BRL
 *
 * IMPORTANTE: todos os `agentSlugs` DEVEM existir em `ALL_AGENT_SLUGS`.
 * Este arquivo é puramente frontend — não há tabela nem edge function envolvida.
 */
import type { LucideIcon } from "lucide-react";
import {
  Briefcase, HeartHandshake, Megaphone,
  Scale, Landmark, Users,
} from "lucide-react";

/** Cores derivadas da paleta departamental já usada em `Library.tsx`. */
export type DeptColorKey = "sales" | "customer_success" | "marketing" | "legal" | "finance" | "talent";

export interface DepartmentTimelineEvent {
  /** Hora fictícia exibida (ex.: "09:47"). */
  time: string;
  /** Slug do agente responsável (deve existir no WORKFORCE). */
  agentSlug: string;
  /** Nome curto do agente exibido no card do evento. */
  agentName: string;
  /** Ação executada em pt-BR, curta e concreta. */
  action: string;
  /** Resultado observável ao final da ação (números, nomes, mensagens). */
  outcome: string;
  /** Delay em ms antes do próximo evento aparecer na simulação. */
  delayMs: number;
}

export interface DepartmentPackage {
  id: string;
  name: string;
  /** Ícone visual do departamento. */
  icon: LucideIcon;
  color: DeptColorKey;
  /** Dor do cliente em 1 frase curta. */
  painPoint: string;
  /** Outcome prometido, formato "métrica + prazo". */
  outcome: string;
  /** Slugs de agentes envolvidos (subset de ALL_AGENT_SLUGS). */
  agentSlugs: readonly string[];
  /** Roteiro de 6-8 eventos plausíveis para o LiveDemo. */
  timelineDemo: readonly DepartmentTimelineEvent[];
  /** Contador que sobe durante a demo (ex.: "Leads qualificados"). */
  outcomeMetric: {
    label: string;
    /** Valores exibidos após cada evento (mesmo comprimento de `timelineDemo`). */
    progression: readonly number[];
    /** Sufixo opcional para o número (ex.: "%", "min"). */
    suffix?: string;
  };
  /** Preço mensal em BRL (centavos ficam para Fase 3). */
  priceMonthly: number;
  /** Flag de destaque na landing/onboarding. */
  flagship: boolean;
}

/**
 * Currency helper — BRL formatado como "R$ 1.997".
 * Colocado aqui para não vazar dependência de i18n na data layer.
 */
export const formatBRL = (value: number): string => {
  const hasCents = Math.round(value * 100) % 100 !== 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(value);
};

/**
 * Preços por dificuldade do departamento — varia de R$ 1.477,30 (mais simples)
 * a R$ 1.878,00 (mais complexo). Aplicado globalmente via `priceMonthly`.
 */
export const DEPARTMENT_PRICE_BY_ID: Record<string, number> = {
  comercial:   1878.00, // alta complexidade (12 agentes, funil completo)
  marketing:   1797.00, // alta (14 agentes, mídia paga + conteúdo)
  financeiro:  1697.00, // média-alta (DRE, forecasting, pricing)
  juridico:    1597.00, // média (contratos + compliance)
  atendimento: 1547.00, // média (24/7, escala)
  rh:          1477.30, // base (recrutamento + engagement)
};

/* ============================================================
 * FLAGSHIP PACKAGES (aparecem na landing e no onboarding)
 * ============================================================ */

const COMERCIAL: DepartmentPackage = {
  id: "comercial",
  name: "Departamento Comercial",
  icon: Briefcase,
  color: "sales",
  painPoint: "Sua equipe não bate meta e o pipeline vive vazio.",
  outcome: "Pipeline preenchido em < 30 dias, meta batida no trimestre",
  agentSlugs: [
    "hunter_linkedin", "sdr_outbound", "sdr_linkedin", "sdr_email_agent",
    "sdr_whatsapp", "sdr_inbound", "lead_qualifier", "lead_scorer",
    "smb_closer", "deal_desk", "sales_forecaster", "revenue_ops",
  ],
  outcomeMetric: {
    label: "Leads qualificados",
    progression: [0, 3, 7, 12, 18, 22, 27, 31],
  },
  timelineDemo: [
    { time: "09:12", agentSlug: "hunter_linkedin", agentName: "Hunter LinkedIn",
      action: "Buscou perfis compatíveis com ICP (CMOs em SaaS B2B, 20-100 funcionários, São Paulo)",
      outcome: "47 leads encontrados", delayMs: 3500 },
    { time: "09:34", agentSlug: "lead_qualifier", agentName: "Lead Qualifier",
      action: "Avaliou fit de cada perfil contra critérios do ICP",
      outcome: "24 leads aprovados · 23 descartados", delayMs: 4000 },
    { time: "10:02", agentSlug: "sdr_linkedin", agentName: "SDR LinkedIn",
      action: "Enviou convite personalizado para Marina Alves (CMO · TechNova)",
      outcome: "Convite aceito em 18 min", delayMs: 4500 },
    { time: "11:47", agentSlug: "sdr_whatsapp", agentName: "SDR WhatsApp",
      action: "Iniciou conversa com Rafael Costa (Head of Growth · Delta Labs)",
      outcome: "Resposta positiva: quer agendar reunião", delayMs: 4500 },
    { time: "14:20", agentSlug: "sdr_linkedin", agentName: "SDR LinkedIn",
      action: "Rodou sequência de InMail para 22 leads restantes",
      outcome: "8 respostas positivas · 6 pedidos de material", delayMs: 5000 },
    { time: "16:03", agentSlug: "revenue_ops", agentName: "Revenue Ops",
      action: "Consolidou pipeline do dia no CRM e agendou follow-ups",
      outcome: "31 leads no pipeline · 4 reuniões marcadas", delayMs: 5000 },
  ],
  priceMonthly: 1878.0,
  flagship: true,
};

const ATENDIMENTO: DepartmentPackage = {
  id: "atendimento",
  name: "Departamento de Atendimento",
  icon: HeartHandshake,
  color: "customer_success",
  painPoint: "Cliente espera horas por resposta e você perde vendas por demora.",
  outcome: "SLA de resposta < 5 minutos, 24/7",
  agentSlugs: [
    "support_channel", "support_lead", "email_support", "helpdesk_agent",
    "voice_ai", "integration_support", "help_center_writer",
    "nps_analyst", "customer_advocacy", "retention_analyst", "onboarding_specialist",
  ],
  outcomeMetric: {
    label: "Tempo médio de resposta",
    progression: [180, 42, 18, 8, 5, 4, 3, 3],
    suffix: "min",
  },
  timelineDemo: [
    { time: "08:03", agentSlug: "support_channel", agentName: "Support Channel",
      action: "Recebeu 12 mensagens em WhatsApp durante a madrugada",
      outcome: "Todas respondidas em < 2 min · 3 escaladas", delayMs: 3500 },
    { time: "09:15", agentSlug: "voice_ai", agentName: "Voice AI",
      action: "Atendeu ligação da cliente Camila Souza sobre status de pedido",
      outcome: "Resolvido sem transferência · call de 2m14s", delayMs: 4500 },
    { time: "10:41", agentSlug: "support_lead", agentName: "Support Lead",
      action: "Recebeu escalação de bug crítico do cliente TechNova",
      outcome: "Ticket priorizado · time de dev acionado", delayMs: 4500 },
    { time: "12:22", agentSlug: "support_channel", agentName: "Support Channel",
      action: "Respondeu 34 dúvidas simultâneas via chat do site",
      outcome: "SLA médio: 47 segundos", delayMs: 4500 },
    { time: "15:08", agentSlug: "customer_advocacy", agentName: "Customer Advocacy",
      action: "Identificou 6 clientes elegíveis para programa de indicação",
      outcome: "Convites enviados · 2 já aceitaram", delayMs: 4500 },
    { time: "18:44", agentSlug: "nps_analyst", agentName: "NPS Analyst",
      action: "Consolidou NPS do dia e gerou relatório de temas recorrentes",
      outcome: "NPS 74 · principal elogio: velocidade", delayMs: 5000 },
  ],
  priceMonthly: 1547.0,
  flagship: true,
};

const MARKETING: DepartmentPackage = {
  id: "marketing",
  name: "Departamento de Marketing",
  icon: Megaphone,
  color: "marketing",
  painPoint: "Você queima verba em ads sem saber o que está trazendo retorno.",
  outcome: "ROAS medido e otimizado semana a semana",
  agentSlugs: [
    "brand_strategist", "brand_voice_writer", "ad_copywriter", "content_strategist",
    "content_seo_writer", "seo_strategist", "technical_seo", "social_media_agent",
    "video_script_agent", "meta_ads_agent", "google_ads_agent", "traffic_manager",
    "content_performance", "influencer_mgr",
  ],
  outcomeMetric: {
    label: "ROAS acumulado",
    progression: [0.8, 1.4, 2.1, 2.8, 3.4, 3.9, 4.2, 4.5],
    suffix: "x",
  },
  timelineDemo: [
    { time: "08:30", agentSlug: "brand_strategist", agentName: "Brand Strategist",
      action: "Analisou performance da semana anterior e definiu 3 ângulos de teste",
      outcome: "Hipóteses: dor de tempo · prova social · urgência", delayMs: 4000 },
    { time: "09:45", agentSlug: "ad_copywriter", agentName: "Ad Copywriter",
      action: "Escreveu 9 variações de copy (3 por ângulo) para Meta e Google",
      outcome: "9 copies aprovados · 27 headlines geradas", delayMs: 4500 },
    { time: "11:12", agentSlug: "meta_ads_agent", agentName: "Meta Ads Agent",
      action: "Publicou campanhas no Facebook e Instagram com budget escalonado",
      outcome: "9 anúncios ativos · R$ 300/dia distribuídos", delayMs: 4500 },
    { time: "14:33", agentSlug: "traffic_manager", agentName: "Traffic Manager",
      action: "Pausou 3 criativos abaixo de CTR alvo e realocou budget",
      outcome: "CPC caiu 22% em 3h", delayMs: 4500 },
    { time: "17:20", agentSlug: "content_performance", agentName: "Content Performance",
      action: "Cruzou dados de anúncios × landing × conversões no CRM",
      outcome: "Ângulo 'prova social' converte 2.4× melhor", delayMs: 5000 },
    { time: "19:00", agentSlug: "brand_strategist", agentName: "Brand Strategist",
      action: "Gerou relatório executivo com recomendação de escala",
      outcome: "Sugestão: 3× no ângulo vencedor amanhã", delayMs: 5000 },
  ],
  priceMonthly: 1797.0,
  flagship: true,
};

/* ============================================================
 * SECUNDÁRIOS (aparecem em "explorar mais")
 * ============================================================ */

const JURIDICO: DepartmentPackage = {
  id: "juridico",
  name: "Departamento Jurídico",
  icon: Scale,
  color: "legal",
  painPoint: "Contratos travados, compliance vulnerável, resposta jurídica lenta.",
  outcome: "Contratos revisados em < 2h, compliance monitorado 24/7",
  agentSlugs: [
    "contract_analyst", "contract_negotiator", "compliance_officer", "lgpd_agent",
    "labor_law_agent", "tax_compliance", "regulatory_monitor", "legal_researcher",
    "esg_compliance",
  ],
  outcomeMetric: {
    label: "Contratos revisados",
    progression: [0, 2, 5, 8, 12, 15, 18, 21],
  },
  timelineDemo: [
    { time: "08:45", agentSlug: "regulatory_monitor", agentName: "Regulatory Monitor",
      action: "Varreu diários oficiais e portais reguladores em busca de novidades do setor",
      outcome: "2 mudanças relevantes detectadas · alerta emitido", delayMs: 3800 },
    { time: "09:20", agentSlug: "contract_analyst", agentName: "Contract Analyst",
      action: "Revisou contrato de prestação de serviços do fornecedor X",
      outcome: "3 cláusulas de risco identificadas", delayMs: 4200 },
    { time: "10:40", agentSlug: "contract_negotiator", agentName: "Contract Negotiator",
      action: "Redigiu contraproposta para as cláusulas 4.2, 7.1 e 12",
      outcome: "Minuta ajustada · devolvida à contraparte", delayMs: 4500 },
    { time: "12:05", agentSlug: "lgpd_agent", agentName: "LGPD Agent",
      action: "Auditou fluxo de dados pessoais no novo funil de vendas",
      outcome: "Base legal definida · DPIA atualizado", delayMs: 4500 },
    { time: "14:30", agentSlug: "labor_law_agent", agentName: "Labor Law Agent",
      action: "Revisou 4 acordos de rescisão e 1 contrato de PJ",
      outcome: "Todos em conformidade · 1 ajuste sugerido", delayMs: 4800 },
    { time: "17:10", agentSlug: "compliance_officer", agentName: "Compliance Officer",
      action: "Consolidou relatório de compliance semanal para o board",
      outcome: "Score 92/100 · 1 gap prioritário aberto", delayMs: 5000 },
  ],
  priceMonthly: 1597.0,
  flagship: true,
};

const FINANCEIRO: DepartmentPackage = {
  id: "financeiro",
  name: "Departamento Financeiro",
  icon: Landmark,
  color: "finance",
  painPoint: "DRE atrasada, fluxo de caixa no chute, decisões financeiras às cegas.",
  outcome: "Fechamento mensal em D+3 e dashboard financeiro diário",
  agentSlugs: [
    "ai_cfo", "digital_accountant", "accounts_payable", "accounts_receivable",
    "budget_analyst", "budget_allocator", "financial_forecaster",
    "pricing_analyst", "pricing_strategist", "billing_agent",
  ],
  outcomeMetric: {
    label: "Dias para fechamento",
    progression: [21, 14, 10, 7, 5, 4, 3, 3],
    suffix: "d",
  },
  timelineDemo: [
    { time: "07:50", agentSlug: "digital_accountant", agentName: "Digital Accountant",
      action: "Conciliou 320 lançamentos bancários do dia anterior",
      outcome: "312 conciliados automaticamente · 8 para revisão", delayMs: 3800 },
    { time: "09:10", agentSlug: "accounts_receivable", agentName: "Accounts Receivable",
      action: "Disparou cobranças de 46 boletos vencidos e negociou prazos",
      outcome: "R$ 87k recuperados · 11 acordos fechados", delayMs: 4300 },
    { time: "10:40", agentSlug: "accounts_payable", agentName: "Accounts Payable",
      action: "Priorizou pagamentos da semana respeitando fluxo projetado",
      outcome: "R$ 142k programados · 0 atrasos", delayMs: 4300 },
    { time: "13:20", agentSlug: "financial_forecaster", agentName: "Financial Forecaster",
      action: "Rodou projeção de fluxo de caixa para os próximos 90 dias",
      outcome: "Alerta: gap de R$ 120k previsto em 45d", delayMs: 4800 },
    { time: "15:45", agentSlug: "pricing_analyst", agentName: "Pricing Analyst",
      action: "Testou 3 cenários de reajuste no plano Business",
      outcome: "Cenário B: +9% receita sem impacto no churn", delayMs: 4800 },
    { time: "17:30", agentSlug: "ai_cfo", agentName: "AI CFO",
      action: "Consolidou DRE gerencial do mês e recomendações executivas",
      outcome: "3 ações concretas · fechamento em D+3", delayMs: 5000 },
  ],
  priceMonthly: 1697.0,
  flagship: true,
};

const RH: DepartmentPackage = {
  id: "rh",
  name: "Departamento de Pessoas",
  icon: Users,
  color: "talent",
  painPoint: "Contratações demoram meses e turnover consome operação.",
  outcome: "Time-to-hire < 21 dias, engajamento medido semanalmente",
  agentSlugs: [
    "recruiter_agent", "reseller_recruiter", "onboarding_specialist", "onboarding_optimizer",
    "people_analytics", "employee_engagement_agent", "employer_brand_agent",
  ],
  outcomeMetric: {
    label: "Candidatos qualificados",
    progression: [0, 4, 9, 15, 22, 28, 33, 38],
  },
  timelineDemo: [
    { time: "08:30", agentSlug: "employer_brand_agent", agentName: "Employer Brand",
      action: "Publicou 3 posts de employer branding no LinkedIn e Instagram",
      outcome: "1.240 impressões · 47 candidatos clicaram na vaga", delayMs: 3800 },
    { time: "09:45", agentSlug: "recruiter_agent", agentName: "Recruiter Agent",
      action: "Buscou candidatos para vaga de Analista de Dados Sênior",
      outcome: "38 perfis relevantes · 12 shortlist", delayMs: 4200 },
    { time: "11:20", agentSlug: "recruiter_agent", agentName: "Recruiter Agent",
      action: "Fez triagem por vídeo assíncrono com os 12 do shortlist",
      outcome: "6 aprovados para entrevista técnica", delayMs: 4500 },
    { time: "13:40", agentSlug: "onboarding_optimizer", agentName: "Onboarding Optimizer",
      action: "Ajustou trilha de onboarding com base no NPS dos últimos hires",
      outcome: "Time-to-productivity projetado: 18d (-6d)", delayMs: 4500 },
    { time: "15:15", agentSlug: "employee_engagement_agent", agentName: "Engagement Agent",
      action: "Rodou pulse survey semanal com o time",
      outcome: "Engajamento 78% · alerta em 1 squad", delayMs: 4800 },
    { time: "17:00", agentSlug: "people_analytics", agentName: "People Analytics",
      action: "Cruzou engajamento × performance × turnover por squad",
      outcome: "Risco de churn identificado em 2 pessoas-chave", delayMs: 5000 },
  ],
  priceMonthly: 1477.3,
  flagship: true,
};

/* ============================================================
 * PUBLIC API
 * ============================================================ */

export const DEPARTMENT_PACKAGES: readonly DepartmentPackage[] = [
  COMERCIAL,
  ATENDIMENTO,
  MARKETING,
  JURIDICO,
  FINANCEIRO,
  RH,
] as const;

export const FLAGSHIP_DEPARTMENTS: readonly DepartmentPackage[] =
  DEPARTMENT_PACKAGES.filter((d) => d.flagship);

export const SECONDARY_DEPARTMENTS: readonly DepartmentPackage[] =
  DEPARTMENT_PACKAGES.filter((d) => !d.flagship);

export const getDepartmentById = (id: string): DepartmentPackage | undefined =>
  DEPARTMENT_PACKAGES.find((d) => d.id === id);

/**
 * Tokens de cor departamentais — espelha o esquema já em uso em `Library.tsx`.
 * Mantido aqui para que componentes de departamento não precisem duplicar o mapa.
 */
export const DEPT_COLOR_TOKENS: Record<DeptColorKey, {
  gradient: string; border: string; text: string; bg: string;
}> = {
  sales:            { gradient: "from-blue-500/20 to-blue-500/5",       border: "border-blue-500/30",     text: "text-blue-400",     bg: "bg-blue-500/10" },
  customer_success: { gradient: "from-amber-500/20 to-amber-500/5",     border: "border-amber-500/30",    text: "text-amber-400",    bg: "bg-amber-500/10" },
  marketing:        { gradient: "from-rose-500/20 to-rose-500/5",       border: "border-rose-500/30",     text: "text-rose-400",     bg: "bg-rose-500/10" },
  legal:            { gradient: "from-slate-500/20 to-slate-500/5",     border: "border-slate-500/30",    text: "text-slate-400",    bg: "bg-slate-500/10" },
  finance:          { gradient: "from-cyan-500/20 to-cyan-500/5",       border: "border-cyan-500/30",     text: "text-cyan-400",     bg: "bg-cyan-500/10" },
  talent:           { gradient: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/30",  text: "text-emerald-400",  bg: "bg-emerald-500/10" },
};
