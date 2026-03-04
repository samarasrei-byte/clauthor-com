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
  prometheusCost: number;
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
    id: "tecnologia", icon: Wrench, color: "text-blue-400",
    gradient: "from-blue-500/20 to-blue-500/5",
    borderActive: "border-blue-500/40",
    iconBg: "bg-blue-500/20",
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
    id: "comercial", icon: Briefcase, color: "text-cyan-400",
    gradient: "from-cyan-500/20 to-cyan-500/5",
    borderActive: "border-cyan-500/40",
    iconBg: "bg-cyan-500/20",
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
    gradient: "from-primary/20 to-primary/5",
    borderActive: "border-primary/40",
    iconBg: "bg-primary/20",
    popular: false, tokens: "7M", actions: "10.000",
    agents: [
      { key: "content", icon: Sparkles, role: "Copywriter Sênior", tokens: "2M" },
      { key: "marketing_automation", icon: Target, role: "Growth / Automação", tokens: "2M" },
      { key: "seo_growth", icon: Globe, role: "Analista SEO / Tráfego", tokens: "1.5M" },
      { key: "influencer", icon: Megaphone, role: "Social Media Manager", tokens: "1.5M" },
      { key: "media_buyer", icon: Target, role: "Media Buyer", tokens: "1.5M" },
    ],
    headcount: 5, cltCost: 48000, prometheusCost: 3497, discount: 25,
  },
  {
    id: "financeiro", icon: BarChart3, color: "text-amber-400",
    gradient: "from-amber-500/20 to-amber-500/5",
    borderActive: "border-amber-500/40",
    iconBg: "bg-amber-500/20",
    popular: false, tokens: "6M", actions: "8.000",
    agents: [
      { key: "revenue", icon: BarChart3, role: "CFO / Controller", tokens: "2M" },
      { key: "legal", icon: FileText, role: "Analista Fiscal / Jurídico", tokens: "1.5M" },
      { key: "data_analytics", icon: BarChart3, role: "Analista de BI", tokens: "1.5M" },
      { key: "ecommerce", icon: ShoppingCart, role: "Gestor Financeiro", tokens: "1M" },
    ],
    headcount: 4, cltCost: 44000, prometheusCost: 2997, discount: 20,
  },
  {
    id: "criacao", icon: Palette, color: "text-violet-400",
    gradient: "from-violet-500/20 to-violet-500/5",
    borderActive: "border-violet-500/40",
    iconBg: "bg-violet-500/20",
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
    id: "suporte", icon: MessageSquare, color: "text-emerald-400",
    gradient: "from-emerald-500/20 to-emerald-500/5",
    borderActive: "border-emerald-500/40",
    iconBg: "bg-emerald-500/20",
    popular: false, tokens: "5M", actions: "10.000",
    agents: [
      { key: "support_channel", icon: MessageSquare, role: "Atendente N1 / N2", tokens: "1.5M" },
      { key: "support_lead", icon: Star, role: "Líder de Suporte", tokens: "1.5M" },
      { key: "voice_support", icon: Phone, role: "Operador Call Center", tokens: "1M" },
      { key: "rag", icon: FileText, role: "Base de Conhecimento", tokens: "1M" },
      { key: "onboarding_specialist", icon: Star, role: "Especialista Onboarding", tokens: "1M" },
    ],
    headcount: 5, cltCost: 30000, prometheusCost: 2497, discount: 20,
  },
  {
    id: "rh", icon: GraduationCap, color: "text-pink-400",
    gradient: "from-pink-500/20 to-pink-500/5",
    borderActive: "border-pink-500/40",
    iconBg: "bg-pink-500/20",
    popular: false, tokens: "4M", actions: "6.000",
    agents: [
      { key: "hr", icon: Star, role: "Recrutador / BP", tokens: "1.5M" },
      { key: "training", icon: GraduationCap, role: "T&D / Onboarding", tokens: "1M" },
      { key: "people_analytics", icon: BarChart3, role: "People Analytics", tokens: "1M" },
      { key: "data_analytics", icon: BarChart3, role: "Analista de Dados RH", tokens: "0.5M" },
    ],
    headcount: 4, cltCost: 28000, prometheusCost: 1797, discount: 15,
  },
  {
    id: "prospeccao", icon: Crosshair, color: "text-orange-400",
    gradient: "from-orange-500/20 to-orange-500/5",
    borderActive: "border-orange-500/40",
    iconBg: "bg-orange-500/20",
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
    id: "comunicacao", icon: PenTool, color: "text-rose-400",
    gradient: "from-rose-500/20 to-rose-500/5",
    borderActive: "border-rose-500/40",
    iconBg: "bg-rose-500/20",
    popular: false, tokens: "8M", actions: "10.000",
    agents: [
      { key: "copywriting", icon: PenTool, role: "Copywriter de Conversão", tokens: "1.5M" },
      { key: "branding", icon: Award, role: "Brand Strategist", tokens: "1.5M" },
      { key: "positioning", icon: Target, role: "Estrategista de Mercado", tokens: "1M" },
      { key: "public_relations", icon: Megaphone, role: "Assessor de Imprensa", tokens: "1.5M" },
      { key: "social_proof", icon: ThumbsUp, role: "Gestor de Prova Social", tokens: "1M" },
      { key: "events_speaker", icon: Calendar, role: "Produtor de Eventos", tokens: "1M" },
      { key: "tax_content", icon: FileText, role: "Conteúdo Tributário", tokens: "0.5M" },
    ],
    headcount: 7, cltCost: 56000, prometheusCost: 4497, discount: 30,
  },
  {
    id: "operacoes", icon: Rocket, color: "text-indigo-400",
    gradient: "from-indigo-500/20 to-indigo-500/5",
    borderActive: "border-indigo-500/40",
    iconBg: "bg-indigo-500/20",
    popular: false, tokens: "10M", actions: "12.000",
    agents: [
      { key: "orchestrator", icon: Network, role: "Orquestrador Multi-Agente", tokens: "3M" },
      { key: "concierge", icon: Star, role: "Concierge Executivo", tokens: "2M" },
      { key: "ceo", icon: Building2, role: "CEO / Estrategista", tokens: "2M" },
      { key: "startup_creator", icon: Rocket, role: "Startup Creator", tokens: "1.5M" },
      { key: "scheduler", icon: Calendar, role: "Agendador Inteligente", tokens: "0.5M" },
      { key: "proposal_gen", icon: FileText, role: "Gerador de Propostas", tokens: "1M" },
    ],
    headcount: 6, cltCost: 72000, prometheusCost: 4997, discount: 30,
  },
  {
    id: "ecommerce_growth", icon: Store, color: "text-teal-400",
    gradient: "from-teal-500/20 to-teal-500/5",
    borderActive: "border-teal-500/40",
    iconBg: "bg-teal-500/20",
    popular: false, tokens: "9M", actions: "11.000",
    agents: [
      { key: "paid_traffic", icon: TrendingUp, role: "Gestor de Tráfego Pago", tokens: "2M" },
      { key: "whatsapp_commerce", icon: MessageSquare, role: "WhatsApp Commerce", tokens: "1.5M" },
      { key: "influencer_liveshop", icon: Zap, role: "LiveShop & Influencer", tokens: "1.5M" },
      { key: "affiliate_manager", icon: Handshake, role: "Gestor de Afiliados", tokens: "1.5M" },
      { key: "podcast_manager", icon: Megaphone, role: "Podcast Manager", tokens: "1M" },
      { key: "reputation", icon: Award, role: "Gestor de Reputação", tokens: "1.5M" },
    ],
    headcount: 6, cltCost: 54000, prometheusCost: 3997, discount: 25,
  },
  {
    id: "juridico", icon: Gavel, color: "text-slate-400",
    gradient: "from-slate-500/20 to-slate-500/5",
    borderActive: "border-slate-500/40",
    iconBg: "bg-slate-500/20",
    popular: false, tokens: "8M", actions: "10.000",
    agents: [
      { key: "contract_analyst", icon: FileText, role: "Analista de Contratos", tokens: "2M" },
      { key: "compliance_officer", icon: ShieldCheck, role: "Compliance / DPO", tokens: "2M" },
      { key: "labor_law", icon: Scale, role: "Advogado Trabalhista", tokens: "2M" },
      { key: "litigation", icon: Gavel, role: "Advogado Contencioso", tokens: "2M" },
    ],
    headcount: 4, cltCost: 60000, prometheusCost: 4497, discount: 30,
  },
  {
    id: "compras", icon: Package, color: "text-lime-400",
    gradient: "from-lime-500/20 to-lime-500/5",
    borderActive: "border-lime-500/40",
    iconBg: "bg-lime-500/20",
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
    id: "logistica", icon: Truck, color: "text-sky-400",
    gradient: "from-sky-500/20 to-sky-500/5",
    borderActive: "border-sky-500/40",
    iconBg: "bg-sky-500/20",
    popular: false, tokens: "8M", actions: "10.000",
    agents: [
      { key: "logistics", icon: Truck, role: "Coordenador Logístico", tokens: "2M" },
      { key: "inventory", icon: Package, role: "Analista de Estoque", tokens: "1.5M" },
      { key: "supply_chain", icon: Network, role: "Supply Chain Manager", tokens: "2.5M" },
      { key: "omnichannel", icon: MessageSquare, role: "Omnichannel / Rastreamento", tokens: "2M" },
    ],
    headcount: 4, cltCost: 48000, prometheusCost: 3497, discount: 25,
  },
  {
    id: "qualidade", icon: ClipboardCheck, color: "text-yellow-400",
    gradient: "from-yellow-500/20 to-yellow-500/5",
    borderActive: "border-yellow-500/40",
    iconBg: "bg-yellow-500/20",
    popular: false, tokens: "5M", actions: "7.000",
    agents: [
      { key: "quality", icon: ClipboardCheck, role: "Analista de Qualidade", tokens: "1.5M" },
      { key: "process_analyst", icon: Cog, role: "Analista de Processos", tokens: "1.5M" },
      { key: "research", icon: Search, role: "Pesquisador / Auditor", tokens: "1M" },
      { key: "community_mgr", icon: Users, role: "Gestão de Comunidade", tokens: "1M" },
    ],
    headcount: 4, cltCost: 32000, prometheusCost: 1997, discount: 20,
  },
];

export const totalPrometheusCost = departments.reduce((a, d) => a + d.prometheusCost, 0);
export const totalCltCost = departments.reduce((a, d) => a + d.cltCost, 0);
export const totalTokens = "110M";
export const totalAgents = 80;
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
    agents: ["Atendente N1 24/7", "Customer Success", "Call Center IA", "RAG Knowledge Base"],
    replaces: ["3 Atendentes", "1 CS Manager", "2 Operadores Call", "1 Documentador"],
    faq: [
      { q: "Qual o tempo de resposta?", a: "Média de 4 segundos. SLA garantido. CSAT médio: 98%." },
      { q: "Atende em quais canais?", a: "WhatsApp, Instagram, Chat, E-mail, Telegram e Telefone — tudo unificado." },
      { q: "Escala para humanos?", a: "Sim. Transferência inteligente quando a complexidade exige intervenção humana." },
    ],
  },
  financeiro: {
    icon: DollarSign,
    agents: ["CFO Virtual", "Analista Fiscal", "BI Financeiro", "Controller"],
    replaces: ["1 Analista Financeiro", "1 Contador", "1 Analista BI", "1 Controller"],
    faq: [
      { q: "Emite nota fiscal?", a: "Integra com SEFAZ, Conta Azul, Omie e ERPs para emissão e conciliação automática." },
      { q: "Faz previsão de caixa?", a: "Sim. Forecast de 30, 60 e 90 dias com cenários otimista, neutro e pessimista." },
      { q: "E tributário?", a: "Análise tributária automática, alertas de vencimento e sugestões de economia fiscal." },
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
};
