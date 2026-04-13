import {
  Users, Building2, Briefcase, BarChart3, Star, FileText,
  ShoppingCart, Shield, Wrench, Megaphone, Target, Palette,
  Video, Globe, ClipboardList, GraduationCap, Bot, Zap,
  CheckCircle2, TrendingUp, Coins, Network, Lightbulb, ThumbsUp,
  Crosshair, PenTool, Rocket, Store, Calendar, Award, Handshake,
  Search, UserPlus, Repeat, Hash, Gavel, ShieldCheck, Scale,
  Package, Factory, Receipt, Cog, ClipboardCheck, Truck,
  MessageSquare, Phone, Sparkles, Code, Briefcase as BriefcaseIcon,
  HeartHandshake, DollarSign
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface DepartmentAgent {
  key: string;
  icon: LucideIcon;
  role: string;
  tokens: string;
}

export interface Department {
  id: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  borderActive: string;
  iconBg: string;
  popular: boolean;
  tokens: string;
  actions: string;
  agents: DepartmentAgent[];
  headcount: number;
  cltCost: number;
  clauthorCost: number;
  discount: number;
}

export interface DeptDetail {
  icon: LucideIcon;
  agents: string[];
  replaces: string[];
  faq: { q: string; a: string }[];
}

export const departments: Department[] = [
  {
    id: "tecnologia", icon: Wrench, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "12M", actions: "15.000",
    agents: [
      { key: "coding", icon: Wrench, role: "Dev Full-Stack Sênior", tokens: "4M" },
      { key: "computer", icon: Building2, role: "DevOps / SRE", tokens: "3M" },
      { key: "project_management", icon: ClipboardList, role: "Gerente de Projetos", tokens: "2M" },
      { key: "security", icon: Shield, role: "CISO / Eng. Segurança", tokens: "3M" },
      { key: "data_engineer", icon: Building2, role: "Engenheiro de Dados", tokens: "2M" },
    ],
    headcount: 5, cltCost: 100000, prometheusCost: 5497, discount: 30,
  },
  {
    id: "comercial", icon: Briefcase, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: true, tokens: "8M", actions: "12.000",
    agents: [
      { key: "sales", icon: Briefcase, role: "SDR / Closer de Vendas", tokens: "2.5M" },
      { key: "customer_success", icon: Star, role: "Customer Success Manager", tokens: "1.5M" },
      { key: "sales_channel", icon: MessageSquare, role: "Canal de Vendas Multicanal", tokens: "2M" },
      { key: "voice_ai", icon: Phone, role: "Operador de Telefonia", tokens: "2M" },
      { key: "crm_manager", icon: Star, role: "Gestor de CRM", tokens: "1.5M" },
    ],
    headcount: 5, cltCost: 56000, prometheusCost: 4497, discount: 25,
  },
  {
    id: "marketing", icon: Megaphone, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "8.5M", actions: "11.000",
    agents: [
      { key: "content", icon: Sparkles, role: "Copywriter Sênior", tokens: "2M" },
      { key: "marketing_automation", icon: Target, role: "Growth / Automação", tokens: "2M" },
      { key: "seo_growth", icon: Globe, role: "Analista SEO / Tráfego", tokens: "1.5M" },
      { key: "influencer", icon: Megaphone, role: "Social Media Manager", tokens: "1.5M" },
      { key: "media_buyer", icon: Target, role: "Media Buyer", tokens: "1.5M" },
      { key: "community_mgr", icon: Users, role: "Community Manager", tokens: "1M" },
    ],
    headcount: 6, cltCost: 54000, prometheusCost: 3997, discount: 25,
  },
  {
    id: "financeiro", icon: BarChart3, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "10M", actions: "12.000",
    agents: [
      { key: "revenue", icon: BarChart3, role: "CFO / Controller", tokens: "2M" },
      { key: "data_analytics", icon: BarChart3, role: "Analista de BI", tokens: "1.5M" },
      { key: "ai_cfo", icon: DollarSign, role: "CFO Virtual / Controller", tokens: "1.5M" },
      { key: "tax_content", icon: FileText, role: "Conteúdo Tributário", tokens: "1M" },
      { key: "digital_accountant", icon: FileText, role: "Contador Digital", tokens: "1.5M" },
      { key: "tax_compliance", icon: Shield, role: "Analista Fiscal", tokens: "1.5M" },
      { key: "credit_recovery", icon: Star, role: "Regularizador de Crédito", tokens: "1M" },
    ],
    headcount: 7, cltCost: 66000, prometheusCost: 4497, discount: 25,
  },
  {
    id: "criacao", icon: Palette, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "6M", actions: "8.000",
    agents: [
      { key: "creative_design", icon: Palette, role: "Designer Gráfico Sênior", tokens: "2M" },
      { key: "video_production", icon: Video, role: "Editor de Vídeo / Motion", tokens: "2M" },
      { key: "creative_writer", icon: Sparkles, role: "Redator Criativo", tokens: "1M" },
      { key: "content_producer", icon: Megaphone, role: "Produtor de Conteúdo", tokens: "1M" },
      { key: "ux_researcher", icon: Sparkles, role: "UX Researcher", tokens: "1M" },
    ],
    headcount: 5, cltCost: 42000, prometheusCost: 2997, discount: 20,
  },
  {
    id: "suporte", icon: MessageSquare, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "7M", actions: "12.000",
    agents: [
      { key: "support_channel", icon: MessageSquare, role: "Atendente N1 / N2", tokens: "1.5M" },
      { key: "support_lead", icon: Star, role: "Líder de Suporte", tokens: "1.5M" },
      { key: "voice_support", icon: Phone, role: "Operador Call Center", tokens: "1M" },
      { key: "rag", icon: FileText, role: "Base de Conhecimento", tokens: "1M" },
      { key: "onboarding_specialist", icon: Star, role: "Especialista Onboarding", tokens: "1M" },
      { key: "omnichannel", icon: MessageSquare, role: "Omnichannel 24/7", tokens: "1M" },
    ],
    headcount: 6, cltCost: 36000, prometheusCost: 2997, discount: 20,
  },
  {
    id: "rh", icon: GraduationCap, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "3.5M", actions: "5.000",
    agents: [
      { key: "hr", icon: Star, role: "Recrutador / BP", tokens: "1.5M" },
      { key: "training", icon: GraduationCap, role: "T&D / Onboarding", tokens: "1M" },
      { key: "people_analytics", icon: BarChart3, role: "People Analytics", tokens: "1M" },
    ],
    headcount: 3, cltCost: 22000, prometheusCost: 1497, discount: 15,
  },
  {
    id: "prospeccao", icon: Crosshair, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: true, tokens: "14M", actions: "18.000",
    agents: [
      { key: "sdr_outbound", icon: Crosshair, role: "SDR Outbound", tokens: "2M" },
      { key: "sdr_inbound", icon: UserPlus, role: "SDR Inbound", tokens: "1.5M" },
      { key: "sdr_linkedin", icon: Hash, role: "SDR LinkedIn B2B", tokens: "1.5M" },
      { key: "sdr_whatsapp", icon: MessageSquare, role: "SDR WhatsApp", tokens: "1.5M" },
      { key: "sdr_instagram", icon: Target, role: "SDR Instagram", tokens: "1M" },
      { key: "sdr_social", icon: Globe, role: "SDR Social Selling", tokens: "1M" },
      { key: "sdr_database", icon: Search, role: "SDR Base de Dados", tokens: "1M" },
      { key: "sdr_events", icon: Calendar, role: "SDR Eventos", tokens: "1M" },
      { key: "sdr_partnerships", icon: Handshake, role: "SDR Parcerias", tokens: "1M" },
      { key: "pre_qualifier", icon: CheckCircle2, role: "Pré-Qualificador", tokens: "1M" },
      { key: "hunter", icon: Crosshair, role: "Hunter de Negócios", tokens: "1M" },
      { key: "farmer", icon: Repeat, role: "Farmer / Expansão", tokens: "1M" },
    ],
    headcount: 12, cltCost: 96000, prometheusCost: 6997, discount: 35,
  },
  {
    id: "comunicacao", icon: PenTool, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "7.5M", actions: "9.000",
    agents: [
      { key: "copywriting", icon: PenTool, role: "Copywriter de Conversão", tokens: "1.5M" },
      { key: "branding", icon: Award, role: "Brand Strategist", tokens: "1.5M" },
      { key: "positioning", icon: Target, role: "Estrategista de Mercado", tokens: "1M" },
      { key: "public_relations", icon: Megaphone, role: "Assessor de Imprensa", tokens: "1.5M" },
      { key: "social_proof", icon: ThumbsUp, role: "Gestor de Prova Social", tokens: "1M" },
      { key: "events_speaker", icon: Calendar, role: "Produtor de Eventos", tokens: "1M" },
    ],
    headcount: 6, cltCost: 48000, prometheusCost: 3997, discount: 30,
  },
  {
    id: "operacoes", icon: Rocket, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "12M", actions: "14.000",
    agents: [
      { key: "orchestrator", icon: Network, role: "Orquestrador Multi-Agente", tokens: "3M" },
      { key: "concierge", icon: Star, role: "Concierge Executivo", tokens: "2M" },
      { key: "ceo", icon: Building2, role: "CEO / Estrategista", tokens: "2M" },
      { key: "startup_creator", icon: Rocket, role: "Startup Creator", tokens: "1.5M" },
      { key: "scheduler", icon: Calendar, role: "Agendador Inteligente", tokens: "0.5M" },
      { key: "proposal_gen", icon: FileText, role: "Gerador de Propostas", tokens: "1M" },
      { key: "research", icon: Search, role: "Pesquisador / Analista", tokens: "2M" },
    ],
    headcount: 7, cltCost: 84000, prometheusCost: 5497, discount: 30,
  },
  {
    id: "ecommerce_growth", icon: Store, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "11M", actions: "13.000",
    agents: [
      { key: "paid_traffic", icon: TrendingUp, role: "Gestor de Tráfego Pago", tokens: "2M" },
      { key: "whatsapp_commerce", icon: MessageSquare, role: "WhatsApp Commerce", tokens: "1.5M" },
      { key: "influencer_liveshop", icon: Zap, role: "LiveShop & Influencer", tokens: "1.5M" },
      { key: "affiliate_manager", icon: Handshake, role: "Gestor de Afiliados", tokens: "1.5M" },
      { key: "podcast_manager", icon: Megaphone, role: "Podcast Manager", tokens: "1M" },
      { key: "reputation", icon: Award, role: "Gestor de Reputação", tokens: "1.5M" },
      { key: "ecommerce", icon: ShoppingCart, role: "E-commerce Operations", tokens: "2M" },
    ],
    headcount: 7, cltCost: 63000, prometheusCost: 4497, discount: 25,
  },
  {
    id: "juridico", icon: Gavel, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "10M", actions: "12.000",
    agents: [
      { key: "contract_analyst", icon: FileText, role: "Analista de Contratos", tokens: "2M" },
      { key: "compliance_officer", icon: ShieldCheck, role: "Compliance / DPO", tokens: "2M" },
      { key: "labor_law", icon: Scale, role: "Advogado Trabalhista", tokens: "2M" },
      { key: "litigation", icon: Gavel, role: "Advogado Contencioso", tokens: "2M" },
      { key: "legal", icon: FileText, role: "Analista Jurídico Geral", tokens: "2M" },
    ],
    headcount: 5, cltCost: 75000, prometheusCost: 4997, discount: 30,
  },
  {
    id: "compras", icon: Package, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "7M", actions: "9.000",
    agents: [
      { key: "procurement", icon: Package, role: "Comprador Sênior", tokens: "2M" },
      { key: "supplier_mgr", icon: Factory, role: "Gestor de Fornecedores", tokens: "1.5M" },
      { key: "cost_analyst", icon: Receipt, role: "Analista de Custos", tokens: "1.5M" },
      { key: "contract_negotiator", icon: Handshake, role: "Negociador", tokens: "2M" },
    ],
    headcount: 4, cltCost: 44000, prometheusCost: 2997, discount: 25,
  },
  {
    id: "logistica", icon: Truck, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "6M", actions: "8.000",
    agents: [
      { key: "logistics", icon: Truck, role: "Coordenador Logístico", tokens: "2M" },
      { key: "inventory", icon: Package, role: "Analista de Estoque", tokens: "1.5M" },
      { key: "supply_chain", icon: Network, role: "Supply Chain Manager", tokens: "2.5M" },
    ],
    headcount: 3, cltCost: 36000, prometheusCost: 2497, discount: 25,
  },
  {
    id: "qualidade", icon: ClipboardCheck, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "3M", actions: "4.000",
    agents: [
      { key: "quality", icon: ClipboardCheck, role: "Analista de Qualidade", tokens: "1.5M" },
      { key: "process_analyst", icon: Cog, role: "Analista de Processos", tokens: "1.5M" },
    ],
    headcount: 2, cltCost: 16000, prometheusCost: 1297, discount: 20,
  },
];

export const totalPrometheusCost = departments.reduce((a, d) => a + d.prometheusCost, 0);
export const totalCltCost = departments.reduce((a, d) => a + d.cltCost, 0);
export const totalTokens = "180M";
export const totalAgents = 200;
export const totalSavingsPercent = Math.round(((totalCltCost - totalPrometheusCost) / totalCltCost) * 100);

/** Department details for the rich cards in Library page */
export const deptDetails: Record<string, DeptDetail> = {
  comercial: {
    icon: Briefcase,
    agents: ["SDR Outbound", "Closer de Vendas", "Customer Success", "Atendente Omnichannel"],
    replaces: ["2 SDRs", "1 Closer", "1 CS Manager", "2 Atendentes"],
    faq: [
      { q: "Quantos leads o time processa?", a: "Até 500 leads/dia com qualificação automática, scoring e distribuição inteligente." },
      { q: "Integra com meu CRM?", a: "Sim. HubSpot, Salesforce, Pipedrive, RD Station e qualquer CRM via API." },
      { q: "E se o lead pedir um humano?", a: "O agente transfere automaticamente quando detecta essa necessidade." },
    ],
  },
  tecnologia: {
    icon: Code,
    agents: ["Dev Full-Stack", "CISO / Security", "DevOps Engineer", "Tech PM"],
    replaces: ["2 Devs Sênior", "1 Analista Segurança", "1 DevOps", "1 PM"],
    faq: [
      { q: "Que linguagens suporta?", a: "JavaScript, TypeScript, Python, Go, Rust, Java e mais. Full-stack com CI/CD integrado." },
      { q: "Faz deploy sozinho?", a: "Sim. Integra com GitHub, GitLab, Vercel, AWS. Pipeline completo automatizado." },
      { q: "E segurança?", a: "Scan de vulnerabilidades contínuo, LGPD compliance, SOC2 readiness e threat detection." },
    ],
  },
  marketing: {
    icon: Megaphone,
    agents: ["Copywriter IA", "Growth Hacker", "SEO Specialist", "Social Media Manager"],
    replaces: ["1 Copywriter", "1 Growth", "1 Analista SEO", "1 Social Media"],
    faq: [
      { q: "Cria conteúdo original?", a: "Sim. Posts, reels, carrosséis, blogs, emails — tudo com tom de voz da sua marca." },
      { q: "Faz tráfego pago?", a: "O Growth Hacker gerencia campanhas Meta Ads e Google Ads com otimização automática." },
      { q: "Mede resultados?", a: "Dashboard integrado com métricas de engajamento, conversão e ROI por canal." },
    ],
  },
  suporte: {
    icon: HeartHandshake,
    agents: ["Atendente N1 24/7", "Customer Success", "Call Center IA", "RAG Knowledge Base", "Onboarding", "Omnichannel"],
    replaces: ["3 Atendentes", "1 CS Manager", "2 Operadores Call", "1 Documentador", "1 Onboarding", "1 Omnichannel"],
    faq: [
      { q: "Qual o tempo de resposta?", a: "Média de 4 segundos. SLA garantido. CSAT médio: 98%." },
      { q: "Atende em quais canais?", a: "WhatsApp, Instagram, Chat, E-mail, Telegram e Telefone — tudo unificado." },
      { q: "Escala para humanos?", a: "Sim. Transferência inteligente quando a complexidade exige intervenção humana." },
    ],
  },
  financeiro: {
    icon: DollarSign,
    agents: ["CFO Virtual", "BI Financeiro", "AI CFO Controller", "Conteúdo Tributário", "Contador Digital", "Analista Fiscal", "Regularizador de Crédito"],
    replaces: ["1 Analista Financeiro", "1 Analista BI", "1 Controller", "1 Conteudista Fiscal", "1 Contador", "1 Analista Fiscal", "1 Analista de Crédito"],
    faq: [
      { q: "Emite nota fiscal?", a: "Integra com SEFAZ, Conta Azul, Omie e ERPs para emissão e conciliação automática." },
      { q: "Faz previsão de caixa?", a: "Sim. Forecast de 30, 60 e 90 dias com cenários otimista, neutro e pessimista." },
      { q: "E contabilidade e impostos?", a: "Escrituração completa, DAS, DCTF, SPED, EFD, apuração fiscal e regularização de crédito — tudo automatizado." },
    ],
  },
  criacao: {
    icon: Palette,
    agents: ["Designer IA", "Editor de Vídeo", "Redator Criativo", "Produtor de Conteúdo"],
    replaces: ["1 Designer", "1 Editor Vídeo", "1 Redator", "1 Produtor"],
    faq: [
      { q: "Cria em quais formatos?", a: "Banners, social kits, reels, shorts, thumbnails, presentations e materiais impressos." },
      { q: "Mantém identidade visual?", a: "Sim. Aprende seu brandbook e aplica consistentemente em todas as peças." },
      { q: "Faz edição de vídeo?", a: "Corte, legenda, motion graphics, correção de cor e thumbnail — tudo automático." },
    ],
  },
  rh: {
    icon: Users,
    agents: ["Recruiter IA", "T&D Manager", "People Analytics", "Analista RH"],
    replaces: ["1 Recruiter", "1 T&D Specialist", "1 People Analyst", "1 Analista RH"],
    faq: [
      { q: "Como faz triagem de CVs?", a: "Analisa fit cultural, skills técnicas e experiência. Ranking automático por score." },
      { q: "Faz onboarding?", a: "Trilhas de onboarding personalizadas de 30/60/90 dias com gamificação." },
      { q: "Mede clima organizacional?", a: "Pesquisas de eNPS automáticas, análise de sentimento e alertas de risco." },
    ],
  },
  prospeccao: {
    icon: Crosshair,
    agents: ["SDR Outbound", "SDR Inbound", "SDR LinkedIn B2B", "SDR WhatsApp", "SDR Instagram", "SDR Social Selling", "SDR Base de Dados", "SDR Eventos", "SDR Parcerias", "Pré-Qualificador", "Hunter", "Farmer"],
    replaces: ["4 SDRs Outbound", "2 SDRs Inbound", "2 SDRs Sociais", "1 Pré-Qualificador", "1 Hunter", "1 Farmer", "1 SDR Eventos"],
    faq: [
      { q: "Quantos leads prospecta por dia?", a: "Até 1.000 leads/dia com abordagem multicanal simultânea — LinkedIn, WhatsApp, Instagram, email e telefone." },
      { q: "Faz cold outreach automatizado?", a: "Sim. Sequências personalizadas com IA por LinkedIn, e-mail e WhatsApp com follow-up inteligente." },
      { q: "Como qualifica os leads?", a: "Scoring automático com BANT/MEDDIC, enriquecimento de dados e distribuição inteligente para closers." },
    ],
  },
  comunicacao: {
    icon: PenTool,
    agents: ["Copywriter de Conversão", "Brand Strategist", "Estrategista de Mercado", "Assessor de Imprensa", "Gestor de Prova Social", "Produtor de Eventos"],
    replaces: ["1 Copywriter Sênior", "1 Brand Manager", "1 Estrategista", "1 Assessor de Imprensa", "1 Social Proof Manager", "1 Produtor de Eventos"],
    faq: [
      { q: "Mantém o tom de voz da marca?", a: "Sim. Aprende o brandbook, guidelines e histórico de comunicação para manter 100% de consistência." },
      { q: "Faz assessoria de imprensa?", a: "Sim. Gera press releases, media kits, pitch para jornalistas e monitora menções na mídia." },
      { q: "Gerencia prova social?", a: "Coleta, organiza e publica depoimentos, cases e reviews automaticamente nos canais certos." },
    ],
  },
  operacoes: {
    icon: Rocket,
    agents: ["Orquestrador Multi-Agente", "Concierge Executivo", "CEO / Estrategista", "Startup Creator", "Agendador Inteligente", "Gerador de Propostas", "Pesquisador / Analista"],
    replaces: ["1 COO", "1 Assistente Executivo", "1 Estrategista", "1 PM", "1 Agendador", "1 Analista de Propostas", "1 Pesquisador"],
    faq: [
      { q: "O que o Orquestrador faz?", a: "Coordena todos os outros agentes, distribui tarefas, prioriza ações e garante que nada fique parado." },
      { q: "Gera propostas comerciais?", a: "Sim. Propostas personalizadas com precificação, escopo, cronograma e design profissional em minutos." },
      { q: "Faz pesquisa de mercado?", a: "Análise competitiva, tendências, benchmarks e insights estratégicos com dados em tempo real." },
    ],
  },
  ecommerce_growth: {
    icon: Store,
    agents: ["Gestor de Tráfego Pago", "WhatsApp Commerce", "LiveShop & Influencer", "Gestor de Afiliados", "Podcast Manager", "Gestor de Reputação", "E-commerce Operations"],
    replaces: ["1 Media Buyer", "1 WhatsApp Closer", "1 Influencer Manager", "1 Gestor Afiliados", "1 Podcast Producer", "1 Reputation Manager", "1 E-commerce Manager"],
    faq: [
      { q: "Gerencia campanhas de tráfego pago?", a: "Sim. Meta Ads, Google Ads, TikTok Ads com otimização de ROAS automática e A/B testing contínuo." },
      { q: "Faz vendas por WhatsApp?", a: "Catálogo, carrinho, pagamento e pós-venda — tudo dentro do WhatsApp com automação completa." },
      { q: "Gerencia afiliados?", a: "Recrutamento, onboarding, tracking de comissões e relatórios de performance por afiliado." },
    ],
  },
  juridico: {
    icon: Gavel,
    agents: ["Analista de Contratos", "Compliance / DPO", "Advogado Trabalhista", "Advogado Contencioso", "Analista Jurídico Geral"],
    replaces: ["1 Analista Contratos", "1 DPO / Compliance", "1 Advogado Trabalhista", "1 Advogado Contencioso", "1 Analista Jurídico"],
    faq: [
      { q: "Analisa contratos automaticamente?", a: "Sim. Identifica cláusulas de risco, sugere alterações e compara com templates padrão em segundos." },
      { q: "Faz compliance LGPD?", a: "Mapeamento de dados, termos de consentimento, DPIA, relatórios de impacto e alertas de conformidade." },
      { q: "Atua em contencioso?", a: "Pesquisa jurisprudência, prepara peças processuais, acompanha prazos e gera relatórios de casos." },
    ],
  },
  compras: {
    icon: Package,
    agents: ["Comprador Sênior", "Gestor de Fornecedores", "Analista de Custos", "Negociador"],
    replaces: ["1 Comprador Sênior", "1 Gestor de Fornecedores", "1 Analista de Custos", "1 Negociador"],
    faq: [
      { q: "Negocia com fornecedores?", a: "Sim. Cotações automáticas, comparação multicriterial e negociação baseada em dados históricos." },
      { q: "Reduz custos operacionais?", a: "Análise de TCO, identificação de savings, consolidação de compras e renegociação automática." },
      { q: "Gerencia fornecedores?", a: "Cadastro, avaliação de performance, SLA monitoring e gestão de contratos — tudo centralizado." },
    ],
  },
  logistica: {
    icon: Truck,
    agents: ["Coordenador Logístico", "Analista de Estoque", "Supply Chain Manager"],
    replaces: ["1 Coordenador Logístico", "1 Analista de Estoque", "1 Supply Chain Manager"],
    faq: [
      { q: "Otimiza rotas de entrega?", a: "Sim. Roteirização inteligente com redução de até 30% no custo de frete e tempo de entrega." },
      { q: "Controla estoque?", a: "Previsão de demanda, ponto de reposição automático, curva ABC e alertas de ruptura." },
      { q: "Integra com transportadoras?", a: "Sim. Correios, Jadlog, Total Express, Loggi e qualquer transportadora via API." },
    ],
  },
  qualidade: {
    icon: ClipboardCheck,
    agents: ["Analista de Qualidade", "Analista de Processos"],
    replaces: ["1 Analista de Qualidade", "1 Analista de Processos"],
    faq: [
      { q: "Faz auditoria de processos?", a: "Sim. Mapeamento, análise de gaps, sugestões de melhoria e acompanhamento de indicadores." },
      { q: "Implementa ISO/Lean?", a: "Checklists automáticos, documentação de processos, PDCA e Kaizen com tracking de resultados." },
      { q: "Monitora KPIs de qualidade?", a: "Dashboard em tempo real com OEE, taxa de defeito, CSAT interno e alertas de desvio." },
    ],
  },
};
