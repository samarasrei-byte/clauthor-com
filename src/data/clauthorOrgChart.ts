/**
 * CLAUTHOR ORG CHART — Estrutura oficial multi-agente
 *
 * Hierarquia recomendada (10 orquestradores + sub-especialidades):
 *   CEO Virtual → coordena os 9 departamentos
 *   Cada departamento tem 1 "squad" com seus agentes especialistas internos
 *
 * Esta é a fonte canônica usada pela Rede Neural, Library e Dashboard.
 * Reduz custo/complexidade vs. instanciar 90 agentes independentes.
 */

import type { WorkforceDepartment } from "./workforceArchitecture";

const slug = (s: string) =>
  s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const agent = (name: string, resp: string[] = [], triggers: string[] = ["task_assigned"]) => ({
  slug: slug(name),
  name,
  responsibilities: resp.length ? resp : [name],
  triggers,
});

export const CLAUTHOR_ORG_CHART: WorkforceDepartment[] = [
  // ════════════════════════════════════════════════════════
  // 0. EXECUTIVO — CEO Virtual (Orquestrador)
  // ════════════════════════════════════════════════════════
  {
    id: "executivo",
    name: "Executivo (CEO Virtual)",
    color: "text-accent-amber",
    squads: [
      {
        id: "ceo_orchestrator",
        name: "Orquestração Estratégica",
        mission: "Coordena os 9 departamentos, define prioridades e aloca recursos entre agentes.",
        agents: [
          agent("CEO Virtual", ["Define visão e estratégia", "Roteia demandas entre departamentos", "Aprova ações high-risk"], ["new_request", "escalation", "daily_review"]),
          agent("Chief of Staff", ["Acompanha OKRs", "Prepara reuniões executivas", "Compila relatórios C-Level"]),
          agent("Conselho Consultivo IA", ["Pareceres estratégicos cross-departamento", "Análise de cenários"]),
        ],
        outcomes: ["Decisões executivas auditáveis", "Alinhamento entre departamentos", "ROI consolidado"],
      },
    ],
  },

  // ════════════════════════════════════════════════════════
  // 1. MARKETING
  // ════════════════════════════════════════════════════════
  {
    id: "marketing",
    name: "Marketing",
    color: "text-accent-rose",
    squads: [
      {
        id: "marketing_specialties",
        name: "Especialistas de Marketing",
        mission: "Constrói marca, gera demanda e nutre audiência multicanal.",
        agents: [
          agent("Gerente de Marketing", ["Coordena especialistas", "Aprova campanhas", "Define brief"]),
          agent("Planejamento de Marketing", ["Calendário editorial", "Budget", "Metas trimestrais"]),
          agent("Branding", ["Guardião de marca", "Tom de voz", "Consistência visual"]),
          agent("Pesquisa de Mercado", ["Benchmarks", "Persona", "Tendências"]),
          agent("SEO", ["On-page", "Backlinks", "Pesquisa de palavras-chave"]),
          agent("Tráfego Pago", ["Meta Ads", "Google Ads", "Otimização ROAS"]),
          agent("Social Media", ["Publicações", "Engajamento", "Calendário social"]),
          agent("Community Manager", ["Moderação", "Fóruns", "Programa de embaixadores"]),
          agent("Copywriter", ["Headlines", "Landing pages", "Ads copy"]),
          agent("Conteúdo", ["Blog", "E-books", "Newsletter"]),
          agent("Designer Gráfico", ["Posts", "Apresentações", "Identidade visual"]),
          agent("Motion Design", ["Reels", "Shorts", "Animações"]),
          agent("CRM", ["Segmentação", "Jornadas", "Higienização"]),
          agent("Automação de Marketing", ["Fluxos", "Lead scoring", "Triggers"]),
          agent("Analytics de Marketing", ["GA4", "Attribution", "Dashboards"]),
          agent("Relações Públicas", ["Releases", "Mídia espontânea", "Crise"]),
          agent("Eventos", ["Webinars", "Feiras", "Lançamentos"]),
        ],
        outcomes: ["Pipeline qualificado", "Brand awareness", "CAC otimizado"],
      },
    ],
  },

  // ════════════════════════════════════════════════════════
  // 2. VENDAS
  // ════════════════════════════════════════════════════════
  {
    id: "vendas",
    name: "Vendas",
    color: "text-accent-red",
    squads: [
      {
        id: "vendas_specialties",
        name: "Especialistas Comerciais",
        mission: "Prospecta, qualifica, fecha e expande receita.",
        agents: [
          agent("Diretor Comercial", ["Estratégia comercial", "Forecast", "Metas"]),
          agent("Gerente Comercial", ["Coaching de time", "Pipeline review"]),
          agent("SDR", ["Prospecção outbound", "Agendamento de reuniões"]),
          agent("BDR", ["Mapeamento ICP", "Enriquecimento de base"]),
          agent("Qualificação de Leads", ["BANT/MEDDIC", "Scoring", "Roteamento"]),
          agent("Closer", ["Demos", "Negociação", "Fechamento"]),
          agent("Executivo de Contas", ["Gestão de carteira", "Renovações"]),
          agent("Key Account", ["Contas estratégicas enterprise"]),
          agent("Pós-venda", ["Handoff", "Acompanhamento inicial"]),
          agent("Inteligência Comercial", ["Sales intel", "Battle cards"]),
          agent("CRM Comercial", ["Higiene de pipeline", "Relatórios"]),
          agent("Pricing", ["Tabelas", "Descontos", "Margens"]),
        ],
        outcomes: ["MRR/ARR", "Conversion rate", "Ticket médio"],
      },
    ],
  },

  // ════════════════════════════════════════════════════════
  // 3. FINANCEIRO
  // ════════════════════════════════════════════════════════
  {
    id: "financeiro",
    name: "Financeiro",
    color: "text-accent-emerald",
    squads: [
      {
        id: "financeiro_specialties",
        name: "Especialistas Financeiros",
        mission: "Garante saúde financeira, previsibilidade e compliance fiscal.",
        agents: [
          agent("Controladoria", ["Fechamento mensal", "DRE", "Conciliações"]),
          agent("FP&A", ["Orçamento", "Forecast", "Cenários"]),
          agent("Tesouraria", ["Caixa", "Aplicações", "Bancos"]),
          agent("Fluxo de Caixa", ["Projeções diárias", "Alertas de liquidez"]),
          agent("Contas a Pagar", ["Agendamento", "Conferência de NFs"]),
          agent("Contas a Receber", ["Conciliação de recebíveis"]),
          agent("Cobrança", ["Régua inteligente", "Recuperação"]),
          agent("Custos", ["Custeio ABC", "Margens por produto"]),
          agent("Investimentos", ["CAPEX", "Análise de retorno"]),
          agent("Crédito", ["Análise de crédito", "Limites"]),
          agent("Auditoria Financeira", ["Revisão de controles"]),
          agent("Contabilidade", ["Apuração fiscal", "Obrigações acessórias"]),
        ],
        outcomes: ["DRE auditável", "Cash runway", "Compliance fiscal"],
      },
    ],
  },

  // ════════════════════════════════════════════════════════
  // 4. RECURSOS HUMANOS
  // ════════════════════════════════════════════════════════
  {
    id: "rh",
    name: "Recursos Humanos",
    color: "text-accent-cyan",
    squads: [
      {
        id: "rh_specialties",
        name: "Especialistas de Pessoas",
        mission: "Atrai, desenvolve e retém talentos.",
        agents: [
          agent("Recrutamento", ["Sourcing", "Triagem", "Banco de talentos"]),
          agent("Seleção", ["Entrevistas estruturadas", "Provas técnicas"]),
          agent("Onboarding", ["Integração", "Documentação", "Trilhas iniciais"]),
          agent("Departamento Pessoal", ["Admissões", "Demissões", "eSocial"]),
          agent("Folha de Pagamento", ["Cálculo", "Encargos", "Holerites"]),
          agent("Benefícios", ["VR/VA", "Plano de saúde", "Convênios"]),
          agent("Treinamento", ["Trilhas LMS", "Certificações"]),
          agent("Avaliação de Desempenho", ["Ciclos 360°", "PDI"]),
          agent("Cultura Organizacional", ["Pulse surveys", "Engajamento"]),
          agent("RH Business Partner", ["Parceiro estratégico das áreas"]),
        ],
        outcomes: ["Time-to-hire", "eNPS", "Retenção"],
      },
    ],
  },

  // ════════════════════════════════════════════════════════
  // 5. TECNOLOGIA
  // ════════════════════════════════════════════════════════
  {
    id: "ti",
    name: "Tecnologia",
    color: "text-accent-violet",
    squads: [
      {
        id: "ti_specialties",
        name: "Especialistas de Tecnologia",
        mission: "Constrói, opera e protege a plataforma.",
        agents: [
          agent("Arquiteto de Sistemas", ["Design de arquitetura", "ADRs"]),
          agent("Product Manager", ["Roadmap", "Discovery", "Priorização"]),
          agent("Product Owner", ["Backlog", "Refinamento", "Aceite"]),
          agent("Desenvolvedor Front-end", ["UI", "Acessibilidade", "Performance"]),
          agent("Desenvolvedor Back-end", ["APIs", "Regras de negócio"]),
          agent("Desenvolvedor Full Stack", ["End-to-end features"]),
          agent("Mobile", ["iOS/Android", "Push", "Build pipelines"]),
          agent("DevOps", ["CI/CD", "Infra como código"]),
          agent("QA", ["Testes automatizados", "E2E", "Regressão"]),
          agent("Segurança da Informação", ["AppSec", "Pentest", "Hardening"]),
          agent("Banco de Dados", ["Modelagem", "Performance", "Backups"]),
          agent("Ciência de Dados", ["Modelos preditivos", "ML"]),
          agent("Engenharia de Dados", ["Pipelines", "Data Lake"]),
          agent("IA/LLM", ["Prompts", "RAG", "Fine-tuning"]),
          agent("Suporte Técnico", ["L2/L3", "Troubleshooting"]),
        ],
        outcomes: ["Uptime", "Lead time", "MTTR"],
      },
    ],
  },

  // ════════════════════════════════════════════════════════
  // 6. OPERAÇÕES & LOGÍSTICA
  // ════════════════════════════════════════════════════════
  {
    id: "operacoes",
    name: "Operações & Logística",
    color: "text-accent-orange",
    squads: [
      {
        id: "operacoes_specialties",
        name: "Especialistas de Operações",
        mission: "Processos, qualidade, suprimentos e cadeia logística.",
        agents: [
          agent("Gestão de Processos", ["Mapeamento BPMN", "Padronização"]),
          agent("Qualidade", ["Auditorias", "Não-conformidades"]),
          agent("Melhoria Contínua", ["Kaizen", "PDCA"]),
          agent("Planejamento Operacional", ["S&OP", "Capacidade"]),
          agent("Controle Operacional", ["KPIs de produção"]),
          agent("Compras", ["Cotações", "Pedidos", "Negociação"]),
          agent("Suprimentos", ["Política de estoque mínimo"]),
          agent("Estoque", ["Inventário", "Acuracidade"]),
          agent("Transporte", ["Roteirização", "Frete"]),
          agent("Distribuição", ["Last mile", "SLAs de entrega"]),
          agent("Planejamento Logístico", ["Demanda", "Hubs"]),
        ],
        outcomes: ["OTIF", "Custo logístico", "Giro de estoque"],
      },
    ],
  },

  // ════════════════════════════════════════════════════════
  // 7. JURÍDICO & COMPLIANCE
  // ════════════════════════════════════════════════════════
  {
    id: "juridico",
    name: "Jurídico & Compliance",
    color: "text-accent-slate",
    squads: [
      {
        id: "juridico_specialties",
        name: "Especialistas Jurídicos",
        mission: "Protege a empresa de riscos legais e regulatórios.",
        agents: [
          agent("Jurídico Contratual", ["Revisão", "Redação", "Padronização"]),
          agent("Jurídico Trabalhista", ["Reclamatórias", "Sindicatos"]),
          agent("Compliance", ["Políticas", "Treinamentos", "Canal de denúncias"]),
          agent("LGPD", ["DPIA", "Direitos do titular", "Resposta a incidentes"]),
          agent("Gestão de Riscos", ["Matriz", "Controles", "Heatmap"]),
          agent("Auditoria Interna", ["Plano anual", "Testes de controle"]),
        ],
        outcomes: ["Risco mapeado", "Aderência LGPD", "Contratos auditáveis"],
      },
    ],
  },

  // ════════════════════════════════════════════════════════
  // 8. ATENDIMENTO AO CLIENTE
  // ════════════════════════════════════════════════════════
  {
    id: "atendimento",
    name: "Atendimento ao Cliente",
    color: "text-accent-sky",
    squads: [
      {
        id: "atendimento_specialties",
        name: "Especialistas de Atendimento",
        mission: "Resolve, retém e encanta clientes em todos os canais.",
        agents: [
          agent("SAC", ["Multicanal", "Tom de marca"]),
          agent("Suporte N1", ["Dúvidas comuns", "FAQ", "Roteiros"]),
          agent("Suporte N2", ["Troubleshooting técnico"]),
          agent("Customer Success", ["Adoção", "QBRs", "Expansão"]),
          agent("Retenção", ["Anti-churn", "Win-back"]),
          agent("Ouvidoria", ["Casos críticos", "Procon"]),
        ],
        outcomes: ["CSAT", "NPS", "Churn"],
      },
    ],
  },

  // ════════════════════════════════════════════════════════
  // 9. INTELIGÊNCIA EMPRESARIAL (BI/DADOS)
  // ════════════════════════════════════════════════════════
  {
    id: "dados",
    name: "Inteligência Empresarial",
    color: "text-accent-teal",
    squads: [
      {
        id: "bi_specialties",
        name: "Especialistas de Dados",
        mission: "Transforma dados em decisões acionáveis para todos os departamentos.",
        agents: [
          agent("BI", ["Self-service BI", "Modelagem semântica"]),
          agent("Data Analyst", ["Análises ad-hoc", "Storytelling"]),
          agent("Data Scientist", ["Modelos preditivos", "Experimentos"]),
          agent("Business Intelligence", ["Dashboards executivos"]),
          agent("Relatórios Executivos", ["Board packs", "Insights"]),
          agent("Indicadores (KPIs)", ["Definição", "Governança", "Catálogo"]),
        ],
        outcomes: ["Decisão data-driven", "Single source of truth", "Previsibilidade"],
      },
    ],
  },
];

/** Conta total de agentes especialistas (excluindo orquestrador CEO). */
export const CLAUTHOR_AGENT_COUNT = CLAUTHOR_ORG_CHART.reduce(
  (acc, d) => acc + d.squads.reduce((a, s) => a + s.agents.length, 0),
  0,
);
