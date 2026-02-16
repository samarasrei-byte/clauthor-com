import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  MessageSquare, FileText, DollarSign,
  Calendar, Receipt, Star, ShoppingCart, ArrowRight,
  Code, Brain, Shield, Mic, Bot, Eye, Workflow,
  Phone, Search, Users, Briefcase, BarChart3,
  Layers, Cpu, Sparkles, Globe, Rocket
} from "lucide-react";
import ROICalculator from "@/components/library/ROICalculator";
import AgentLivePreview from "@/components/library/AgentLivePreview";

const templates = [
  {
    icon: Phone,
    title: "Voice AI Agent — Call Center Autônomo",
    desc: "Atende e realiza ligações telefônicas com voz humana ultra-realista. Negocia, fecha vendas, cobra inadimplentes e faz qualify de leads — 24/7, sem pausas.",
    tags: ["Voz IA", "Telefonia", "WhatsApp", "Outbound", "Inbound"],
    actions: [
      "Atender ligações com voz natural em PT-BR", "Realizar cold calls outbound em escala", "Qualify de leads por telefone com scoring",
      "Negociar e fechar vendas por voz", "Cobrar inadimplentes com tom adaptativo", "Transferir para humano com contexto completo",
      "Agendar reuniões durante a ligação", "Transcrever e resumir cada chamada", "Detectar sentimento em tempo real",
      "Adaptar script conforme objeções", "Follow-up automático pós-ligação", "Integrar com discador automático",
      "Gravar e classificar todas as chamadas", "Gerar relatório de conversão por campanha", "A/B test de scripts de venda",
      "Compliance com gravação e LGPD", "Roteamento inteligente por skill", "Análise de pitch e tom de voz",
      "Retry automático em horários otimizados", "Dashboard de métricas de call center"
    ],
    integrations: ["Twilio", "VoIP SIP", "WhatsApp API", "CRM", "Discador"],
    tier: "enterprise",
    price: 997700,
    highlight: "🔥 #1 mais contratado",
    replaces: "5 operadores de call center",
  },
  {
    icon: Workflow,
    title: "Multi-Agent Orchestrator",
    desc: "Orquestra múltiplos agentes de IA que colaboram entre si. Um supervisor delega tarefas, monitora resultados e toma decisões autônomas em workflows complexos.",
    tags: ["Multi-Agent", "Orquestração", "Workflow", "Autonomous"],
    actions: [
      "Orquestrar 5+ agentes simultâneos", "Delegar tarefas automaticamente por especialidade", "Monitorar output de cada sub-agente",
      "Tomar decisões autônomas baseadas em resultados", "Escalar conflitos entre agentes", "Criar workflows multi-step dinâmicos",
      "Loop de auto-correção quando agente falha", "Priorizar filas de trabalho em tempo real", "Gerenciar dependências entre tarefas",
      "Retry inteligente com fallback agents", "Gerar relatório consolidado de todos os agentes", "Balancear carga entre instâncias",
      "Versionar e fazer rollback de workflows", "A/B testing de estratégias de orquestração", "Audit trail completo de decisões",
      "Comunicação inter-agentes via protocolo interno", "Self-healing: substituir agente com falha", "Parallel execution de tasks independentes",
      "Human-in-the-loop configurável por criticidade", "Dashboard de performance do swarm"
    ],
    integrations: ["API Interna", "Webhook", "Slack", "Jira", "N8N"],
    tier: "enterprise",
    price: 1299700,
    highlight: "⚡ Mais avançado",
    replaces: "1 gerente de operações + equipe",
  },
  {
    icon: Search,
    title: "Deep Research Agent — Analista Autônomo",
    desc: "Pesquisa, analisa e sintetiza informações de centenas de fontes em minutos. Gera relatórios executivos com citações, comparativos e recomendações estratégicas.",
    tags: ["RAG", "Pesquisa", "Relatórios", "Análise", "Web Scraping"],
    actions: [
      "Pesquisar 100+ fontes simultaneamente", "Sintetizar dados em relatório executivo", "Citar fontes com links verificáveis",
      "Análise comparativa de concorrentes", "Due diligence automatizada de empresas", "Monitorar notícias e tendências do setor",
      "Gerar briefings diários personalizados", "Analisar documentos jurídicos e contratos", "Extrair insights de PDFs e planilhas",
      "Cruzar dados de múltiplas bases", "Identificar riscos e oportunidades", "Gerar SWOT analysis automático",
      "Mapear mercado e players relevantes", "Traduzir e analisar fontes internacionais", "Alertar sobre mudanças regulatórias",
      "Criar apresentações executivas automáticas", "Fact-checking automático de claims", "Gerar benchmark de mercado",
      "Resumir earnings calls e reports", "Projeções e forecasting com IA"
    ],
    integrations: ["Web Scraping", "Google Scholar", "Bloomberg", "Notion", "Google Slides"],
    tier: "advanced",
    price: 799700,
    highlight: "🧠 Mais inteligente",
    replaces: "3 analistas de mercado",
  },
  {
    icon: Code,
    title: "Autonomous Coding Agent — Dev IA Full-Stack",
    desc: "Desenvolve features completas end-to-end: entende o ticket, escreve código, cria testes, faz PR review e deploya. Computer Use para operar qualquer ferramenta.",
    tags: ["GitHub", "CI/CD", "Full-Stack", "Computer Use", "DevOps"],
    actions: [
      "Entender tickets e transformar em código", "Escrever código full-stack (front + back)", "Code review com sugestões detalhadas",
      "Criar e rodar testes automatizados", "Deploy automático com rollback", "Usar Computer Use para operar IDEs e dashboards",
      "Refatorar codebase inteiro autonomamente", "Criar migrations e schemas de banco", "Implementar APIs RESTful e GraphQL",
      "Debug autônomo com análise de logs", "Configurar CI/CD pipelines completos", "Gerenciar infraestrutura como código (IaC)",
      "Criar documentação técnica automática", "Scan de segurança e fix de vulnerabilidades", "Performance profiling e otimização",
      "Integrar com Jira/Linear para tracking", "Pair programming com desenvolvedores", "Gerenciar microsserviços e containers",
      "Monitorar produção e resolver incidentes", "Estimar effort e timeline de features"
    ],
    integrations: ["GitHub", "Vercel", "Docker", "Linear", "Sentry", "AWS"],
    tier: "enterprise",
    price: 1199700,
    highlight: "🚀 Computer Use",
    replaces: "2 desenvolvedores full-stack",
  },
  {
    icon: MessageSquare,
    title: "Omnichannel AI — Atendimento Hyper-Personalizado",
    desc: "Atendimento com memória de longo prazo, personalização por perfil do cliente e resolução autônoma de 95% dos tickets sem intervenção humana.",
    tags: ["WhatsApp", "Instagram", "Chat", "E-mail", "Telegram"],
    actions: [
      "Memória de longo prazo por cliente", "Personalização baseada em histórico completo", "Resolução autônoma de tickets complexos",
      "Análise de sentimento em tempo real", "Escalonamento inteligente com contexto", "Resposta em 15+ idiomas nativamente",
      "Processamento de imagens e documentos enviados", "Criar e gerenciar tickets no CRM", "Follow-up proativo baseado em comportamento",
      "Detectar churn risk e acionar retenção", "Gerar FAQ dinâmica a partir de tickets", "Classificar urgência com SLA automático",
      "Enviar pesquisa CSAT contextualizada", "Transferência warm para humano com resumo", "Sugerir upsell/cross-sell contextual",
      "Operar múltiplos canais simultaneamente", "Gerar insights de padrões de contato", "Autotraining com novos casos resolvidos",
      "Compliance automático com LGPD", "Dashboard de NPS e CSAT em tempo real"
    ],
    integrations: ["WhatsApp Business API", "Instagram Graph", "Intercom", "Zendesk", "HubSpot"],
    tier: "advanced",
    price: 599700,
    highlight: "💬 95% resolução autônoma",
    replaces: "4 atendentes",
  },
  {
    icon: BarChart3,
    title: "Revenue Operations Agent — CFO Digital",
    desc: "Gestão financeira autônoma: conciliação, forecast, cobrança inteligente, DRE automática e análise preditiva de receita com IA.",
    tags: ["Financeiro", "PIX", "Cobrança", "Forecast", "Contábil"],
    actions: [
      "Conciliação bancária automática diária", "Forecast de receita com ML preditivo", "Cobrança escalonada com tom adaptativo",
      "Geração automática de DRE e balanço", "Fluxo de caixa projetado 90 dias", "Emissão automática de NF-e e NFS-e",
      "Gestão de contas a pagar e receber", "Análise de unit economics por produto", "Cálculo automático de CAC, LTV e churn",
      "Alertas de anomalias financeiras", "Geração de DARF e guias tributárias", "Controle de comissões e splits de pagamento",
      "Relatório de aging de recebíveis", "Auditoria automática de despesas", "Integração com gateway de pagamento",
      "Projeção de runway e burn rate", "Benchmarking financeiro do setor", "Gestão de múltiplas contas bancárias",
      "Compliance fiscal automatizado", "Board report mensal automático"
    ],
    integrations: ["Gateway PIX", "ERP", "Conta Azul", "Omie", "SEFAZ"],
    tier: "advanced",
    price: 699700,
    highlight: "📊 ML Preditivo",
    replaces: "2 analistas financeiros + 1 cobrador",
  },
  {
    icon: Briefcase,
    title: "Sales AI Agent — Closer Autônomo",
    desc: "Prospecta, qualifica, nutre e fecha vendas de forma autônoma. Usa dados comportamentais para personalizar cada abordagem e maximizar conversão.",
    tags: ["CRM", "LinkedIn", "WhatsApp", "Outbound", "Pipeline"],
    actions: [
      "Prospectar leads via LinkedIn e web scraping", "Qualify automático com BANT/MEDDIC scoring", "Enviar sequências de outbound personalizadas",
      "Nutrir leads com conteúdo segmentado", "Agendar demos e reuniões automaticamente", "Negociar propostas com autonomia configurável",
      "Follow-up inteligente baseado em engajamento", "Criar propostas comerciais personalizadas", "Prever probabilidade de fechamento por deal",
      "Gerenciar pipeline com movimentação automática", "Analisar motivos de perda e sugerir ajustes", "Integrar com assinatura digital de contratos",
      "A/B testing de cadências de prospecção", "Enriquecimento automático de dados do lead", "Social selling via LinkedIn e Twitter",
      "Gerar relatório de funil e conversão", "Alertar sobre deals em risco", "Coaching automático para SDRs humanos",
      "Calcular forecasting de vendas", "Dashboard de quota attainment"
    ],
    integrations: ["HubSpot", "Salesforce", "LinkedIn Sales Nav", "Apollo.io", "DocuSign"],
    tier: "advanced",
    price: 749700,
    highlight: "🎯 Pipeline autônomo",
    replaces: "3 SDRs + 1 closer",
  },
  {
    icon: Layers,
    title: "RAG Enterprise — Knowledge Management",
    desc: "Transforma toda documentação da empresa em uma base de conhecimento inteligente. Responde perguntas complexas cruzando milhares de documentos internos.",
    tags: ["RAG", "Knowledge Base", "Documentos", "Compliance", "Wiki"],
    actions: [
      "Indexar e vetorizar toda base documental", "Responder perguntas com citação de fonte", "Cruzar informações de múltiplos documentos",
      "Busca semântica em contratos e políticas", "Gerar resumos executivos de documentos longos", "Manter versioning de documentos",
      "Detectar inconsistências entre documentos", "Sugerir atualizações de políticas desatualizadas", "Classificar documentos por tema e relevância",
      "Integrar com SharePoint e Google Drive", "Controle de acesso por nível e departamento", "Audit trail de consultas e respostas",
      "Onboarding automatizado de novos funcionários", "Gerar FAQ dinâmica da base de conhecimento", "Traduzir documentos em tempo real",
      "Alertar sobre vencimentos contratuais", "Comparar versões de contratos", "Extrair cláusulas-chave automaticamente",
      "Compliance check automático contra políticas", "Dashboard de uso e gaps de conhecimento"
    ],
    integrations: ["SharePoint", "Google Drive", "Notion", "Confluence", "Slack"],
    tier: "intermediate",
    price: 499700,
    highlight: "📚 RAG Avançado",
    replaces: "2 analistas de documentação",
  },
  {
    icon: Cpu,
    title: "Computer Use Agent — Automação Visual",
    desc: "Opera qualquer software como um humano: clica, digita, navega e executa tarefas em ERPs, CRMs e sistemas legados que não possuem API.",
    tags: ["Computer Use", "RPA", "ERP", "Legacy", "Automação"],
    actions: [
      "Operar ERPs via interface visual (SAP, TOTVS)", "Preencher formulários web automaticamente", "Navegar e extrair dados de portais gov",
      "Emitir notas fiscais em sistemas sem API", "Lançar dados em planilhas e sistemas legados", "Screenshot e validação visual de telas",
      "Operar internet banking para conciliação", "Cadastrar produtos em marketplaces", "Extrair relatórios de sistemas fechados",
      "Realizar tarefas repetitivas em qualquer software", "Login e autenticação multi-fator automatizados", "Comparar dados entre sistemas diferentes",
      "Preencher obrigações acessórias em portais", "Gerar PDFs a partir de sistemas web", "Monitorar dashboards e alertar anomalias",
      "Operar CRMs legados sem API", "Migração de dados entre sistemas", "Teste de regressão visual automatizado",
      "Processar filas de trabalho em ERPs", "Relatório de todas as ações executadas"
    ],
    integrations: ["SAP", "TOTVS", "Qualquer ERP", "Portais Gov", "Bancos"],
    tier: "enterprise",
    price: 899700,
    highlight: "🖥️ Opera qualquer software",
    replaces: "3 operadores administrativos",
  },
  {
    icon: Sparkles,
    title: "Content Engine — Fábrica de Conteúdo IA",
    desc: "Produz conteúdo em escala industrial: posts, vídeos, blogs, emails, ads. Analisa performance e otimiza automaticamente baseado em dados reais.",
    tags: ["Social Media", "Blog", "Ads", "E-mail", "Vídeo"],
    actions: [
      "Gerar 100+ posts/mês por plataforma", "Criar roteiros de vídeo otimizados", "Escrever artigos SEO-first com dados",
      "Criar sequências de e-mail marketing", "Gerar criativos para ads (copy + conceito)", "Adaptar conteúdo por persona e plataforma",
      "Calendário editorial com publicação automática", "A/B testing de headlines e CTAs", "Analisar métricas e otimizar conteúdo",
      "Pesquisar trending topics em tempo real", "Gerar carrosséis e infográficos", "Monitorar e responder comentários",
      "Criar newsletters personalizadas por segmento", "Repurpose: transformar 1 conteúdo em 10 formatos", "SEO on-page automático",
      "Brand voice consistency checker", "Competitor content analysis", "Gerar thumbnails e descrições para YouTube",
      "Social listening e newsjacking", "ROI tracking por conteúdo publicado"
    ],
    integrations: ["Instagram API", "YouTube", "Mailchimp", "WordPress", "Meta Ads"],
    tier: "intermediate",
    price: 449700,
    highlight: "✨ 100+ posts/mês",
    replaces: "2 social media managers",
  },
  {
    icon: Shield,
    title: "Cyber Security Agent — SOC Autônomo",
    desc: "Centro de operações de segurança autônomo: monitora, detecta, analisa e responde a ameaças em tempo real. LGPD, SOC2 e ISO 27001 compliance.",
    tags: ["Segurança", "LGPD", "SOC2", "Threat Detection", "Zero Trust"],
    actions: [
      "Monitoramento contínuo de ameaças 24/7", "Detecção de intrusão com ML", "Resposta automática a incidentes (SOAR)",
      "Scan de vulnerabilidades em tempo real", "Análise forense digital automatizada", "Compliance LGPD automático com relatórios",
      "Gestão de identidade e acessos (IAM)", "Monitorar dark web por dados vazados", "Pentest automatizado periódico",
      "Alertas inteligentes (redução de 95% de falsos positivos)", "Gerar DPIA e relatórios de impacto", "Classificar dados sensíveis automaticamente",
      "Treinar equipe com simulações de phishing", "Gerenciar certificados SSL e criptografia", "Audit log de todas as ações do sistema",
      "Implementar Zero Trust architecture", "Backup e disaster recovery automatizado", "Análise de risco de terceiros e fornecedores",
      "Gerar relatórios SOC2 e ISO 27001", "Incident response playbooks automatizados"
    ],
    integrations: ["AWS Security Hub", "Azure Sentinel", "CrowdStrike", "SentinelOne", "Splunk"],
    tier: "enterprise",
    price: 1499700,
    highlight: "🛡️ SOC autônomo 24/7",
    replaces: "1 equipe de segurança (4-5 pessoas)",
  },
  {
    icon: Users,
    title: "HR & People Agent — RH Inteligente",
    desc: "Automatiza recrutamento, onboarding, gestão de performance, clima e people analytics. Do job posting ao offboarding, tudo autônomo.",
    tags: ["Recrutamento", "Onboarding", "Performance", "People Analytics"],
    actions: [
      "Criar e publicar vagas em múltiplas plataformas", "Triagem automática de CVs com IA", "Agendar entrevistas e enviar convites",
      "Conduzir entrevistas iniciais por chat/voz", "Scoring de candidatos por fit cultural e técnico", "Onboarding automatizado com trilha personalizada",
      "Pesquisa de clima organizacional contínua", "Avaliação de desempenho 360° automatizada", "People analytics com dashboards preditivos",
      "Gestão de benefícios e folha de ponto", "Alertar sobre riscos de turnover", "Plano de desenvolvimento individual (PDI)",
      "Controle de férias e licenças", "Offboarding automatizado com checklist", "Gerar relatórios trabalhistas",
      "Compliance com eSocial automatizado", "Análise de equidade salarial", "Employer branding com conteúdo automático",
      "Gestão de treinamentos e certificações", "Dashboard de headcount e budget"
    ],
    integrations: ["LinkedIn Recruiter", "Gupy", "Slack", "Google Workspace", "eSocial"],
    tier: "advanced",
    price: 649700,
    highlight: "👥 People Analytics",
    replaces: "2 analistas de RH + 1 recrutador",
  },
];

const tierLabels: Record<string, string> = {
  basic: "Básico",
  intermediate: "Intermediário",
  advanced: "Avançado",
  enterprise: "Enterprise",
};

const tierColors: Record<string, string> = {
  basic: "bg-muted/80 text-muted-foreground border-transparent",
  intermediate: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  advanced: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  enterprise: "bg-primary/10 text-primary border-primary/20",
};

const tiers = ["all", "intermediate", "advanced", "enterprise"];

const LibraryPage = () => {
  const [filter, setFilter] = useState("all");
  const [previewAgent, setPreviewAgent] = useState<{ name: string; desc: string } | null>(null);
  const [expandedActions, setExpandedActions] = useState<string | null>(null);

  const filteredTemplates = filter === "all" 
    ? templates 
    : templates.filter(t => t.tier === filter);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <Badge variant="outline" className="mb-4 border-primary/15 text-primary/80">
            <Rocket className="h-3 w-3 mr-1" />
            {templates.length} agentes de última geração
          </Badge>
          <h1 className="font-display text-3xl font-bold mb-2">Funcionários de IA — Next Gen</h1>
          <p className="text-muted-foreground max-w-xl">
            Agentes autônomos que operam com voz, visão computacional, multi-agentes e Computer Use. 
            Substitua equipes inteiras com IA de nível enterprise.
          </p>
        </div>
        
        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {tiers.map((tier) => (
            <Button
              key={tier}
              variant={filter === tier ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(tier)}
              className={`rounded-lg text-xs ${
                filter === tier 
                  ? "glow" 
                  : "border-border hover:border-primary/20"
              }`}
            >
              {tier === "all" ? "Todos" : tierLabels[tier]}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* ROI Calculator */}
      <ROICalculator />

      {/* Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredTemplates.map((t, i) => (
          <motion.div
            key={t.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            layout
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <div className="glass-card rounded-2xl p-6 glass-hover h-full flex flex-col relative overflow-hidden group">
              {/* Glow effect on hover */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Enterprise badge glow */}
              {t.tier === "enterprise" && (
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-[60px]" />
              )}

              {/* Highlight badge */}
              {t.highlight && (
                <div className="absolute top-4 right-4 z-20">
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-primary/15 text-primary font-semibold border border-primary/20 backdrop-blur-sm">
                    {t.highlight}
                  </span>
                </div>
              )}
              
              {/* Header */}
              <div className="flex items-start gap-4 mb-5 relative z-10 pr-24">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  t.tier === "enterprise" 
                     ? "bg-gradient-to-br from-primary/20 to-primary-glow/20" 
                     : t.tier === "advanced"
                     ? "bg-gradient-to-br from-cyan-500/10 to-primary/10"
                    : "bg-primary/5"
                }`}>
                  <t.icon className="h-7 w-7 text-primary/80" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-lg leading-tight mb-1">{t.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
                </div>
              </div>

              {/* Replaces badge */}
              {t.replaces && (
                <div className="mb-4 relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Users className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400">Substitui {t.replaces}</span>
                  </div>
                </div>
              )}

              {/* Price & Tier */}
              <div className="flex items-center justify-between mb-5 pb-5 border-b border-border relative z-10">
                <Badge variant="outline" className={`${tierColors[t.tier]} font-medium`}>
                  {tierLabels[t.tier]}
                </Badge>
                <div className="text-right">
                  <p className="font-display font-bold text-2xl gradient-text">
                    R$ {(t.price / 100).toLocaleString("pt-BR")}
                  </p>
                  <span className="text-xs text-muted-foreground">/mês</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
                {t.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="text-xs px-2.5 py-1 rounded-lg bg-card text-muted-foreground border border-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="mb-5 flex-1 relative z-10">
                <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-widest flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  {t.actions.length} Capacidades Autônomas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {t.actions.slice(0, expandedActions === t.title ? 20 : 6).map((a) => (
                    <span 
                      key={a} 
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-primary/[0.03] text-foreground/70 border border-primary/10"
                    >
                      {a}
                    </span>
                  ))}
                </div>
                {t.actions.length > 6 && (
                  <button 
                    onClick={() => setExpandedActions(expandedActions === t.title ? null : t.title)}
                    className="text-xs text-primary/70 hover:text-primary mt-2 transition-colors"
                  >
                    {expandedActions === t.title ? "Ver menos" : `+${t.actions.length - 6} capacidades`}
                  </button>
                )}
              </div>

              {/* Integrations preview */}
              <div className="mb-5 relative z-10">
                <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-widest">
                  Integrações
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {t.integrations.slice(0, 3).map((integration) => (
                      <div 
                        key={integration}
                        className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground"
                        title={integration}
                      >
                        {integration.charAt(0)}
                      </div>
                    ))}
                  </div>
                  {t.integrations.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{t.integrations.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="flex gap-2 relative z-10">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-12 border-border hover:border-primary/20"
                  onClick={() => setPreviewAgent({ name: t.title, desc: t.desc })}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Testar 60s
                </Button>
                <Link to="/auth" className="flex-1">
                  <Button className={`w-full rounded-xl group h-12 font-semibold ${
                    t.tier === "enterprise" 
                      ? "bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90" 
                      : "glow"
                  }`}>
                    Contratar
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Agent Live Preview Modal */}
      <AgentLivePreview
        agentName={previewAgent?.name || ""}
        agentDesc={previewAgent?.desc || ""}
        isOpen={!!previewAgent}
        onClose={() => setPreviewAgent(null)}
      />
    </div>
  );
};

export default LibraryPage;
