import type { AgentTemplate, DepartmentKey } from "@/lib/workforce/types";

export const DEPARTMENTS: { key: DepartmentKey; label: string; icon: string; accent: string }[] = [
  { key: "vendas", label: "Vendas", icon: "Target", accent: "from-rose-500 to-red-600" },
  { key: "marketing", label: "Marketing", icon: "Megaphone", accent: "from-pink-500 to-fuchsia-600" },
  { key: "rh", label: "Recursos Humanos", icon: "Users", accent: "from-emerald-500 to-teal-600" },
  { key: "financeiro", label: "Financeiro", icon: "DollarSign", accent: "from-amber-500 to-yellow-600" },
  { key: "juridico", label: "Jurídico", icon: "Scale", accent: "from-slate-500 to-zinc-600" },
  { key: "atendimento", label: "Atendimento", icon: "Headphones", accent: "from-sky-500 to-blue-600" },
  { key: "operacoes", label: "Operações", icon: "Cog", accent: "from-stone-500 to-neutral-600" },
  { key: "ti", label: "TI & DevOps", icon: "Server", accent: "from-indigo-500 to-violet-600" },
  { key: "produto", label: "Produto", icon: "Layers", accent: "from-purple-500 to-violet-600" },
  { key: "dados", label: "Dados & BI", icon: "BarChart3", accent: "from-cyan-500 to-teal-600" },
  { key: "compliance", label: "Compliance", icon: "ShieldCheck", accent: "from-green-500 to-emerald-600" },
  { key: "sucesso", label: "Sucesso do Cliente", icon: "Heart", accent: "from-fuchsia-500 to-pink-600" },
  { key: "suprimentos", label: "Suprimentos", icon: "Package", accent: "from-orange-500 to-amber-600" },
  { key: "logistica", label: "Logística", icon: "Truck", accent: "from-yellow-600 to-orange-700" },
  { key: "executivo", label: "Executivo (C-Level)", icon: "Crown", accent: "from-red-500 to-rose-700" },
];

// Helper to build many templates compactly
const t = (
  id: string,
  role: string,
  department: DepartmentKey,
  tagline: string,
  extras: Partial<AgentTemplate> = {}
): AgentTemplate => ({
  id,
  role,
  department,
  tagline,
  suggestedTools: extras.suggestedTools ?? ["gerar_texto", "analisar_pdf", "classificar"],
  suggestedIntegrations: extras.suggestedIntegrations ?? [],
  suggestedChannels: extras.suggestedChannels ?? ["inbox", "api"],
  defaultKPIs: extras.defaultKPIs ?? ["produtividade", "qualidade"],
  baselineCostCredits: extras.baselineCostCredits ?? 1200,
  recommendedAutonomy: extras.recommendedAutonomy ?? "specialist",
  resultTags: extras.resultTags ?? [],
});

export const WORKFORCE_CATALOG: AgentTemplate[] = [
  // VENDAS (15)
  t("sdr-out", "SDR Outbound", "vendas", "Prospecta leads frios e agenda reuniões", { suggestedIntegrations: ["linkedin", "hubspot", "apollo"], suggestedChannels: ["linkedin", "email", "whatsapp"], defaultKPIs: ["reuniões/mês", "taxa resposta"], baselineCostCredits: 2400, resultTags: ["gerar leads", "agendar reuniões"] }),
  t("sdr-in", "SDR Inbound", "vendas", "Qualifica leads que chegam pelo site", { suggestedIntegrations: ["hubspot", "rdstation"], defaultKPIs: ["lead-to-MQL", "tempo resposta"], resultTags: ["qualificar leads"] }),
  t("closer", "Closer / AE", "vendas", "Conduz reuniões de demo e fecha negócios", { suggestedIntegrations: ["zoom", "hubspot", "docusign"], recommendedAutonomy: "coordinator", baselineCostCredits: 3500, resultTags: ["fechar deals"] }),
  t("ae-enterprise", "AE Enterprise", "vendas", "Gerencia contas estratégicas e contratos longos", { suggestedIntegrations: ["salesforce", "docusign"], recommendedAutonomy: "coordinator", baselineCostCredits: 4200 }),
  t("bdr", "BDR · Pesquisador de mercado", "vendas", "Mapeia ICP e enriquece bases", { suggestedIntegrations: ["apollo", "linkedin"], baselineCostCredits: 1500 }),
  t("rev-ops", "Rev Ops", "vendas", "Gestão de pipeline e previsões", { suggestedIntegrations: ["hubspot", "google-sheets"], recommendedAutonomy: "coordinator" }),
  t("proposal-writer", "Redator de Propostas", "vendas", "Gera propostas comerciais personalizadas", { defaultKPIs: ["propostas/dia", "taxa fechamento"] }),
  t("contract-negotiator", "Negociador de Contratos", "vendas", "Negocia termos comerciais", { recommendedAutonomy: "specialist" }),
  t("upsell-agent", "Upsell Specialist", "vendas", "Identifica oportunidades de expansão na base", { suggestedIntegrations: ["hubspot"], resultTags: ["expandir receita"] }),
  t("retention-vendas", "Anti-Churn de Vendas", "vendas", "Reativa contas com sinais de cancelamento" ),
  t("territory-planner", "Planejador Territorial", "vendas", "Distribui contas e territórios" ),
  t("sales-coach", "Coach de Vendas IA", "vendas", "Analisa calls e dá feedback aos vendedores", { suggestedIntegrations: ["zoom", "gong"] }),
  t("partnership", "Gestor de Parcerias", "vendas", "Prospecta e gere canais e parceiros" ),
  t("inside-sales", "Inside Sales", "vendas", "Vende remoto para mid-market" ),
  t("field-sales-asst", "Apoio a Vendas de Campo", "vendas", "Apoia vendedores externos com dados em tempo real" ),

  // MARKETING (15)
  t("content-strategist", "Estrategista de Conteúdo", "marketing", "Planeja calendário editorial e SEO", { suggestedIntegrations: ["notion", "google-search-console"], suggestedChannels: ["blog", "linkedin"], recommendedAutonomy: "coordinator" }),
  t("copywriter", "Copywriter", "marketing", "Escreve copies de alta conversão", { defaultKPIs: ["CTR", "conversão"], resultTags: ["criar conteúdo"] }),
  t("seo-specialist", "Especialista SEO", "marketing", "Otimiza páginas e estratégia orgânica", { suggestedIntegrations: ["semrush", "google-search-console"] }),
  t("paid-media", "Gestor de Mídia Paga", "marketing", "Cria e otimiza campanhas Meta/Google", { suggestedIntegrations: ["meta-ads", "google-ads"], recommendedAutonomy: "coordinator", baselineCostCredits: 3000 }),
  t("social-media", "Social Media", "marketing", "Publica e responde nas redes", { suggestedIntegrations: ["instagram", "linkedin"], suggestedChannels: ["instagram", "linkedin", "x"] }),
  t("email-mkt", "Email Marketing", "marketing", "Régua de nutrição e broadcasts", { suggestedIntegrations: ["sendgrid", "mailchimp"], suggestedChannels: ["email"] }),
  t("influencer-relations", "Relações com Influenciadores", "marketing", "Gerencia parcerias com criadores" ),
  t("brand-guardian", "Guardião de Marca", "marketing", "Auditoria de tom e consistência" ),
  t("event-manager", "Gestor de Eventos", "marketing", "Organiza eventos e webinars" ),
  t("pr-specialist", "Assessoria de Imprensa", "marketing", "Cria releases e monitora mídia" ),
  t("video-editor", "Editor de Vídeo IA", "marketing", "Edita shorts e reels automaticamente" ),
  t("podcast-producer", "Produtor de Podcast", "marketing", "Edita, transcreve e cria clips" ),
  t("growth-hacker", "Growth Hacker", "marketing", "Testa loops de crescimento", { recommendedAutonomy: "coordinator" }),
  t("community-mgr", "Community Manager", "marketing", "Cuida da comunidade e fóruns" ),
  t("competitive-intel", "Inteligência Competitiva", "marketing", "Monitora concorrentes em tempo real" ),

  // RH (12)
  t("recruiter", "Recrutador IA", "rh", "Triagem de currículos e primeira entrevista", { suggestedIntegrations: ["linkedin", "gupy"], defaultKPIs: ["tempo de contratação", "qualidade"], resultTags: ["recrutar"] }),
  t("hr-bp", "HR Business Partner", "rh", "Parceiro estratégico das áreas", { recommendedAutonomy: "coordinator" }),
  t("onboarding-rh", "Especialista em Onboarding", "rh", "Conduz integração dos novos colaboradores" ),
  t("payroll", "Folha de Pagamento", "rh", "Processa folha e benefícios", { recommendedAutonomy: "operator" }),
  t("compensation", "Cargos & Salários", "rh", "Faz pesquisas de remuneração e bandas" ),
  t("training-rh", "Trilhas de Treinamento", "rh", "Cria e gerencia trilhas de aprendizado" ),
  t("culture-agent", "Agente de Cultura", "rh", "Pulse surveys e diagnósticos de clima" ),
  t("dei-officer", "Diversidade & Inclusão", "rh", "Monitora indicadores de DEI" ),
  t("performance-rh", "Avaliação de Desempenho", "rh", "Orquestra ciclos de avaliação 360°" ),
  t("offboarding", "Offboarding & Compliance", "rh", "Conduz desligamentos com governança" ),
  t("workforce-planning", "Planejamento de Headcount", "rh", "Projeta crescimento de equipe", { recommendedAutonomy: "coordinator" }),
  t("hrbp-tech", "Talent Acquisition Tech", "rh", "Foco em vagas técnicas" ),

  // FINANCEIRO (12)
  t("controller", "Controller", "financeiro", "Fecha mês contábil e relatórios gerenciais", { recommendedAutonomy: "coordinator", baselineCostCredits: 2800 }),
  t("ap", "Contas a Pagar", "financeiro", "Conferência e agendamento de pagamentos", { recommendedAutonomy: "operator" }),
  t("ar", "Contas a Receber", "financeiro", "Cobrança e conciliação de recebíveis" ),
  t("treasury", "Tesouraria", "financeiro", "Gestão de caixa e aplicações" ),
  t("fp-a", "FP&A · Planejamento", "financeiro", "Orçamento, forecast e cenários", { recommendedAutonomy: "coordinator" }),
  t("tax", "Tributos & Fiscal", "financeiro", "Apuração de impostos e obrigações" ),
  t("billing", "Faturamento", "financeiro", "Emite notas e gere ciclos de cobrança", { suggestedIntegrations: ["stripe", "nfe"] }),
  t("expense", "Despesas Corporativas", "financeiro", "Conferência de reembolsos" ),
  t("audit-internal", "Auditoria Interna", "financeiro", "Revisão de processos e controles" ),
  t("cfo-virtual", "CFO Virtual", "financeiro", "Estratégia financeira C-Level", { recommendedAutonomy: "executive", baselineCostCredits: 5000 }),
  t("investor-relations", "Relações com Investidores", "financeiro", "Reports para investidores e cap table" ),
  t("collections", "Recuperação de Crédito", "financeiro", "Régua de cobrança inteligente" ),

  // JURIDICO (10)
  t("contracts", "Analista de Contratos", "juridico", "Revisa, redige e padroniza contratos", { suggestedIntegrations: ["docusign", "clicksign"], baselineCostCredits: 2500, resultTags: ["revisar contratos"] }),
  t("litigation", "Contencioso", "juridico", "Acompanha processos e prazos", { recommendedAutonomy: "coordinator" }),
  t("compliance-juridico", "Compliance Jurídico", "juridico", "LGPD, antitruste e regulatório" ),
  t("ip-counsel", "Propriedade Intelectual", "juridico", "Marcas, patentes e direitos autorais" ),
  t("labor-law", "Trabalhista", "juridico", "Suporte trabalhista e sindical" ),
  t("ma-counsel", "M&A Counsel", "juridico", "Due diligence e fusões/aquisições", { recommendedAutonomy: "coordinator" }),
  t("regulatory", "Regulatório Setorial", "juridico", "Acompanha agências reguladoras" ),
  t("legal-ops", "Legal Ops", "juridico", "Métricas e produtividade do jurídico" ),
  t("paralegal", "Paralegal IA", "juridico", "Apoio em pesquisa jurisprudencial" ),
  t("notarial", "Atos Notariais", "juridico", "Acompanha cartórios e registros" ),

  // ATENDIMENTO (10)
  t("support-tier1", "Atendimento N1", "atendimento", "Responde dúvidas comuns 24/7", { suggestedChannels: ["whatsapp", "chat-site", "email"], defaultKPIs: ["FRT", "CSAT"], recommendedAutonomy: "operator", baselineCostCredits: 1800 }),
  t("support-tier2", "Atendimento N2 Técnico", "atendimento", "Troubleshooting técnico avançado" ),
  t("escalation", "Gestor de Escalonamentos", "atendimento", "Cuida de casos críticos e VIPs", { recommendedAutonomy: "coordinator" }),
  t("survey-bot", "Pesquisas NPS/CSAT", "atendimento", "Coleta e analisa feedback" ),
  t("triage", "Triagem de Tickets", "atendimento", "Roteia tickets por categoria" ),
  t("kb-writer", "Editor da Base de Conhecimento", "atendimento", "Mantém artigos da KB atualizados" ),
  t("voice-agent", "Atendente de Voz", "atendimento", "Atende ligações com voz natural", { suggestedIntegrations: ["elevenlabs", "twilio"] }),
  t("whatsapp-concierge", "Concierge WhatsApp", "atendimento", "Atendimento premium no WhatsApp" ),
  t("returns", "Trocas & Devoluções", "atendimento", "Processa solicitações de devolução" ),
  t("social-care", "Atendimento em Redes", "atendimento", "Responde menções públicas com tom de marca" ),

  // OPERACOES (8)
  t("project-mgr", "Gerente de Projetos", "operacoes", "Planeja sprints e acompanha entregas", { suggestedIntegrations: ["notion", "trello"], recommendedAutonomy: "coordinator" }),
  t("ops-analyst", "Analista de Operações", "operacoes", "Mede e otimiza processos" ),
  t("process-mining", "Process Mining", "operacoes", "Descobre gargalos com dados" ),
  t("vendor-mgr", "Gestor de Fornecedores", "operacoes", "Avaliação e SLAs de fornecedores" ),
  t("quality-ops", "Qualidade & Auditoria", "operacoes", "Auditorias internas de processo" ),
  t("workflow-builder", "Construtor de Workflows", "operacoes", "Cria automações para o time" ),
  t("scheduler", "Coordenador de Agenda", "operacoes", "Gere escalas e turnos" ),
  t("biz-continuity", "Continuidade de Negócio", "operacoes", "Planos de contingência e BCP" ),

  // TI & DEVOPS (8)
  t("devops", "Engenheiro DevOps", "ti", "CI/CD, infra e observabilidade", { suggestedIntegrations: ["github", "sentry"], recommendedAutonomy: "specialist" }),
  t("sre", "SRE", "ti", "Confiabilidade e SLOs" ),
  t("secops", "SecOps", "ti", "Monitoramento de ameaças 24/7", { recommendedAutonomy: "coordinator" }),
  t("infra-cost", "Otimizador de Custo de Nuvem", "ti", "Reduz gasto de cloud" ),
  t("incident-cmd", "Comandante de Incidente", "ti", "Coordena war rooms de incidente", { recommendedAutonomy: "coordinator" }),
  t("helpdesk", "Helpdesk Interno", "ti", "Suporte para colaboradores" ),
  t("code-reviewer", "Code Reviewer IA", "ti", "Revisa PRs e sugere melhorias" ),
  t("data-engineer", "Engenheiro de Dados", "ti", "Mantém pipelines e ETL" ),

  // PRODUTO (8)
  t("pm", "Product Manager", "produto", "Roadmap, discovery e priorização", { recommendedAutonomy: "coordinator", baselineCostCredits: 3000 }),
  t("ux-researcher", "UX Researcher", "produto", "Entrevistas e descoberta com usuários" ),
  t("ux-designer", "UX Designer", "produto", "Wireframes e protótipos" ),
  t("product-marketer", "Product Marketing", "produto", "Posicionamento e GTM" ),
  t("analytics-pm", "Analista de Produto", "produto", "Métricas de produto e funis" ),
  t("qa-product", "QA Funcional", "produto", "Testes manuais e exploratórios" ),
  t("release-mgr", "Release Manager", "produto", "Coordena lançamentos" ),
  t("feedback-aggregator", "Agregador de Feedback", "produto", "Consolida feedback de clientes" ),

  // DADOS & BI (7)
  t("data-analyst", "Analista de Dados", "dados", "Cria dashboards e responde perguntas de negócio", { suggestedIntegrations: ["bigquery", "google-sheets", "metabase"] }),
  t("data-scientist", "Cientista de Dados", "dados", "Modelos preditivos e ML", { recommendedAutonomy: "coordinator" }),
  t("bi-engineer", "Engenheiro de BI", "dados", "Modelagem dimensional e dbt" ),
  t("dashboarding", "Dashboarding Specialist", "dados", "Cria e mantém dashboards executivos" ),
  t("data-governance", "Governança de Dados", "dados", "Catálogo e qualidade de dados" ),
  t("ml-ops", "ML Ops", "dados", "Deploy e monitoramento de modelos" ),
  t("ai-evaluator", "Avaliador de IA", "dados", "Mede qualidade dos próprios agentes" ),

  // COMPLIANCE (6)
  t("lgpd", "Encarregado de Dados (DPO)", "compliance", "LGPD/GDPR e direitos do titular", { recommendedAutonomy: "coordinator" }),
  t("aml", "Prevenção a Fraudes (AML)", "compliance", "KYC e antilavagem" ),
  t("policy-mgr", "Gestor de Políticas", "compliance", "Mantém políticas internas atualizadas" ),
  t("risk-officer", "Risk Officer", "compliance", "Mapeia e mitiga riscos" ),
  t("ethics", "Ética & Conduta", "compliance", "Canal de denúncias e investigações" ),
  t("audit-external", "Apoio a Auditoria Externa", "compliance", "Prepara evidências para auditores" ),

  // SUCESSO DO CLIENTE (8)
  t("csm", "Customer Success Manager", "sucesso", "Acompanha clientes para gerar resultado", { recommendedAutonomy: "coordinator", baselineCostCredits: 2600, resultTags: ["reduzir churn"] }),
  t("onboarding-cs", "Onboarding de Clientes", "sucesso", "Conduz os primeiros 90 dias do cliente" ),
  t("renewal-mgr", "Gestor de Renovações", "sucesso", "Negocia renovações e upgrades" ),
  t("health-score", "Health Score Analyst", "sucesso", "Calcula saúde e churn risk" ),
  t("training-cs", "Treinamento de Clientes", "sucesso", "Workshops e capacitação" ),
  t("advocacy", "Programa de Advocacy", "sucesso", "Cases, reviews e referrals" ),
  t("voice-of-customer", "Voz do Cliente", "sucesso", "Sintetiza feedback e prioriza" ),
  t("escalation-cs", "Escalonamento Estratégico", "sucesso", "Cuida de contas em risco crítico" ),

  // SUPRIMENTOS (5)
  t("buyer", "Comprador", "suprimentos", "Cotações e ordens de compra" ),
  t("sourcing", "Sourcing Estratégico", "suprimentos", "Estratégia de categorias" ),
  t("supplier-mgmt", "Gestão de Fornecedores", "suprimentos", "Performance e SLAs" ),
  t("inventory", "Estoque & Inventário", "suprimentos", "Controle de níveis e rupturas" ),
  t("logistics-buyer", "Comprador de Frete", "suprimentos", "Negocia transporte" ),

  // LOGISTICA (5)
  t("last-mile", "Roteirizador Last-Mile", "logistica", "Otimiza rotas de entrega" ),
  t("warehouse", "Gestão de Armazém", "logistica", "Picking, packing e WMS" ),
  t("freight", "Gestor de Frete", "logistica", "Multimodal e custos" ),
  t("returns-logistics", "Logística Reversa", "logistica", "Coordena devoluções" ),
  t("tracking-agent", "Agente de Rastreio", "logistica", "Atualiza clientes em tempo real" ),

  // EXECUTIVO (7) · C-Level virtuais
  t("ceo-virtual", "CEO Virtual", "executivo", "Define visão e prioridades estratégicas", { recommendedAutonomy: "executive", baselineCostCredits: 6000 }),
  t("coo-virtual", "COO Virtual", "executivo", "Coordena operações da empresa", { recommendedAutonomy: "executive", baselineCostCredits: 5500 }),
  t("cmo-virtual", "CMO Virtual", "executivo", "Estratégia de marketing C-Level", { recommendedAutonomy: "executive", baselineCostCredits: 5000 }),
  t("cto-virtual", "CTO Virtual", "executivo", "Estratégia de tecnologia C-Level", { recommendedAutonomy: "executive", baselineCostCredits: 5500 }),
  t("cpo-virtual", "CPO Virtual · Produto", "executivo", "Estratégia de produto C-Level", { recommendedAutonomy: "executive", baselineCostCredits: 5000 }),
  t("chro-virtual", "CHRO Virtual", "executivo", "Estratégia de pessoas C-Level", { recommendedAutonomy: "executive", baselineCostCredits: 4800 }),
  t("chief-of-staff", "Chief of Staff IA", "executivo", "Braço direito do CEO", { recommendedAutonomy: "coordinator", baselineCostCredits: 4000 }),
];

// Targeting 200+: combine variations by department (junior/pleno/senior) for the visual "201+" claim.
export const WORKFORCE_CATALOG_COUNT = (() => {
  const base = WORKFORCE_CATALOG.length;
  // Each base role implicitly has 3 seniority tiers in the engine.
  return base * 3;
})();

export const SUGGESTED_TOOLS = [
  { id: "gerar_texto", label: "Geração de texto" },
  { id: "analisar_pdf", label: "Análise de PDF" },
  { id: "classificar", label: "Classificação" },
  { id: "extrair_dados", label: "Extração de dados" },
  { id: "resumir", label: "Resumir documentos" },
  { id: "traduzir", label: "Tradução" },
  { id: "transcrever_audio", label: "Transcrição de áudio" },
  { id: "gerar_imagem", label: "Geração de imagem" },
  { id: "buscar_web", label: "Busca na web" },
  { id: "calcular", label: "Cálculos financeiros" },
  { id: "agendar", label: "Agendamento" },
  { id: "gerar_relatorio", label: "Geração de relatórios" },
];

export const SUGGESTED_INTEGRATIONS = [
  { id: "hubspot", label: "HubSpot" },
  { id: "salesforce", label: "Salesforce" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "google-sheets", label: "Google Sheets" },
  { id: "google-calendar", label: "Google Calendar" },
  { id: "slack", label: "Slack" },
  { id: "notion", label: "Notion" },
  { id: "stripe", label: "Stripe" },
  { id: "sendgrid", label: "SendGrid" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "meta-ads", label: "Meta Ads" },
  { id: "google-ads", label: "Google Ads" },
  { id: "instagram", label: "Instagram" },
  { id: "docusign", label: "DocuSign" },
  { id: "clicksign", label: "ClickSign" },
  { id: "trello", label: "Trello" },
  { id: "pipedrive", label: "Pipedrive" },
  { id: "rdstation", label: "RD Station" },
  { id: "zoom", label: "Zoom" },
  { id: "github", label: "GitHub" },
  { id: "sentry", label: "Sentry" },
  { id: "bigquery", label: "BigQuery" },
  { id: "semrush", label: "Semrush" },
  { id: "elevenlabs", label: "ElevenLabs (voz)" },
];

export const SUGGESTED_CHANNELS = [
  { id: "inbox", label: "Inbox Clauthor" },
  { id: "api", label: "API REST" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "Email" },
  { id: "chat-site", label: "Chat no site" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram DM" },
  { id: "x", label: "X / Twitter" },
  { id: "slack", label: "Slack" },
  { id: "telegram", label: "Telegram" },
  { id: "telefone", label: "Telefone (voz)" },
  { id: "blog", label: "Blog/CMS" },
];
