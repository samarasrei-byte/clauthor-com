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
          agent("ASO", ["Otimização App Store/Play Store"]),
          agent("Podcast Ads", ["Anúncios em podcasts", "Host-reads"]),
          agent("Afiliados", ["Recrutamento", "Comissionamento", "Tracking"]),
          agent("Trade Marketing", ["Ponto de venda", "Materiais de canal"]),
          agent("Field Marketing", ["Ações regionais", "Eventos locais"]),
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
          agent("Sales Engineer", ["Demos técnicas", "POCs"]),
          agent("Solutions Architect", ["Desenho de solução", "RFP"]),
          agent("Deal Desk", ["Aprovação de descontos", "Estrutura de deals"]),
          agent("Sales Enablement", ["Playbooks", "Treinamento de vendas"]),
          agent("Channel Sales", ["Vendas via parceiros e revendas"]),
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
          agent("M&A Analyst", ["Due diligence", "Valuation"]),
          agent("Tesouraria FX", ["Câmbio", "Hedge cambial"]),
          agent("Pricing Strategist", ["Estratégia de preços"]),
          agent("RevOps Financeiro", ["Reconhecimento de receita", "MRR/ARR"]),
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
          agent("People Analytics", ["KPIs de pessoas", "Dashboards"]),
          agent("Comp & Benefits Strategist", ["Bandas salariais", "Equidade"]),
          agent("Learning Designer", ["Trilhas instrucionais", "Conteúdo educacional"]),
          agent("OKR Coach", ["Facilitação de OKRs", "Cadência"]),
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
          agent("Platform Engineer", ["Plataforma interna de devs"]),
          agent("Cloud Architect", ["AWS/GCP/Azure", "Multi-cloud"]),
          agent("FinOps", ["Custos de nuvem", "Otimização"]),
          agent("Observability", ["Logs", "Métricas", "Tracing"]),
          agent("API Gateway", ["Rate limit", "Versionamento", "Auth"]),
          agent("Mobile iOS", ["Swift", "App Store"]),
          agent("Mobile Android", ["Kotlin", "Play Store"]),
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
          agent("Quality Control", ["Inspeção", "Amostragem"]),
          agent("Six Sigma", ["DMAIC", "Redução de variabilidade"]),
          agent("BPM Automation", ["Automação de processos", "Workflows"]),
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
          agent("Tributário", ["Planejamento fiscal", "Recuperação de créditos"]),
          agent("Societário", ["Estatutos", "Atas", "M&A"]),
          agent("M&A Legal", ["Due diligence jurídica"]),
          agent("Propriedade Intelectual", ["Marcas", "Patentes", "Software"]),
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
          agent("Voz/IVR", ["Atendimento telefônico", "URA inteligente"]),
          agent("Self-service KB", ["Base de conhecimento", "FAQ dinâmico"]),
          agent("Bot Trainer", ["Treina chatbots", "Refina intenções"]),
          agent("Voice of Customer", ["Coleta de feedback", "Insights"]),
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

  // ════════════════════════════════════════════════════════
  // 10. INOVAÇÃO & P&D
  // ════════════════════════════════════════════════════════
  {
    id: "inovacao",
    name: "Inovação & P&D",
    color: "text-accent-purple",
    squads: [
      {
        id: "inovacao_specialties",
        name: "Especialistas de Inovação",
        mission: "Explora novas tecnologias, produtos e modelos de negócio.",
        agents: [
          agent("Head de Inovação", ["Visão de longo prazo", "Portfólio de bets"]),
          agent("Pesquisa & Desenvolvimento", ["Provas de conceito", "Patentes"]),
          agent("Design Thinking", ["Workshops", "Prototipação rápida"]),
          agent("UX Research", ["Entrevistas", "Testes de usabilidade"]),
          agent("Prototipagem", ["Mockups", "MVPs"]),
          agent("Venture Building", ["Spin-offs", "Novos negócios"]),
          agent("Trend Hunter", ["Sinais fracos", "Foresight"]),
          agent("Open Innovation", ["Startups", "Universidades", "Hackathons"]),
          agent("Patent Officer", ["Registro de patentes", "Vigilância"]),
          agent("Tech Scout", ["Radar de tecnologias emergentes"]),
          agent("Lab Manager", ["Laboratório de experimentos"]),
        ],
        outcomes: ["Pipeline de inovação", "Time-to-market", "Receita de novos produtos"],
      },
    ],
  },

  // ════════════════════════════════════════════════════════
  // 11. SUSTENTABILIDADE & ESG
  // ════════════════════════════════════════════════════════
  {
    id: "sustentabilidade",
    name: "Sustentabilidade & ESG",
    color: "text-accent-emerald",
    squads: [
      {
        id: "esg_specialties",
        name: "Especialistas ESG",
        mission: "Garante impacto ambiental, social e de governança positivo.",
        agents: [
          agent("Diretor ESG", ["Estratégia ESG", "Reporting"]),
          agent("Sustentabilidade Ambiental", ["Pegada de carbono", "Net zero"]),
          agent("Impacto Social", ["Comunidades", "Voluntariado"]),
          agent("Governança Corporativa", ["Conselho", "Políticas"]),
          agent("Diversidade & Inclusão", ["Indicadores DEI", "Programas"]),
          agent("Relatórios GRI/SASB", ["Frameworks", "Auditoria externa"]),
          agent("Economia Circular", ["Reuso", "Reciclagem"]),
          agent("Carbon Accountant", ["Inventário de GEE", "Escopo 1/2/3"]),
          agent("Supply Chain ESG", ["Due diligence de fornecedores"]),
          agent("Climate Risk", ["Análise TCFD", "Cenários climáticos"]),
        ],
        outcomes: ["Score ESG", "Redução de emissões", "Reputação"],
      },
    ],
  },

  // ════════════════════════════════════════════════════════
  // 12. INTERNACIONAL & EXPANSÃO
  // ════════════════════════════════════════════════════════
  {
    id: "internacional",
    name: "Internacional & Expansão",
    color: "text-accent-blue",
    squads: [
      {
        id: "intl_specialties",
        name: "Especialistas Internacionais",
        mission: "Lidera expansão para novos mercados e operações globais.",
        agents: [
          agent("Diretor Internacional", ["Estratégia global", "Entrada em mercados"]),
          agent("Localização", ["Tradução", "Adaptação cultural"]),
          agent("Comércio Exterior", ["Importação", "Exportação", "Drawback"]),
          agent("Compliance Internacional", ["Sanctions", "FCPA"]),
          agent("Câmbio & Hedge", ["Operações cambiais", "Proteção"]),
          agent("Parcerias Globais", ["Distribuidores", "Joint ventures"]),
          agent("Inteligência Geopolítica", ["Riscos país", "Macro"]),
          agent("Tax International", ["Transfer pricing", "Tratados"]),
          agent("Localization QA", ["QA de traduções", "Adaptação cultural"]),
          agent("Trade Compliance", ["Sanctions screening", "Export controls"]),
        ],
        outcomes: ["Receita internacional", "Mercados ativos", "Margem cambial"],
      },
    ],
  },

  // ════════════════════════════════════════════════════════
  // 13. PARCERIAS & ECOSSISTEMA
  // ════════════════════════════════════════════════════════
  {
    id: "parcerias",
    name: "Parcerias & Ecossistema",
    color: "text-accent-yellow",
    squads: [
      {
        id: "parcerias_specialties",
        name: "Especialistas em Alianças",
        mission: "Constrói e gerencia parcerias estratégicas e canais.",
        agents: [
          agent("Head de Parcerias", ["Estratégia de canais"]),
          agent("Gestor de Canais", ["Revenda", "VARs", "Marketplaces"]),
          agent("Aliança Tecnológica", ["Integrações", "Co-engineering"]),
          agent("Co-marketing", ["Campanhas conjuntas", "MDF"]),
          agent("Developer Relations", ["Comunidade dev", "APIs públicas"]),
          agent("Programa de Afiliados", ["Recrutamento", "Comissionamento"]),
          agent("Embaixadores de Marca", ["Influenciadores B2B", "Advocacy"]),
        ],
        outcomes: ["Receita via parceiros", "Parceiros ativos", "Pipeline indireto"],
      },
    ],
  },
];

/** Conta total de agentes especialistas (excluindo orquestrador CEO). */
export const CLAUTHOR_AGENT_COUNT = CLAUTHOR_ORG_CHART.reduce(
  (acc, d) => acc + d.squads.reduce((a, s) => a + s.agents.length, 0),
  0,
);
