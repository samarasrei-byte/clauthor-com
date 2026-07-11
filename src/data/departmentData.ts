import { Users, Building2, Briefcase, BarChart3, Star, FileText, ShoppingCart, Shield, Wrench, Megaphone, Target, Palette, Video, Globe, ClipboardList, GraduationCap, Bot, Zap, CheckCircle2, TrendingUp, Coins, Network, Lightbulb, ThumbsUp, Crosshair, PenTool, Rocket, Store, Calendar, Award, Handshake, Search, UserPlus, Repeat, Hash, Gavel, ShieldCheck, Scale, Package, Factory, Receipt, Cog, ClipboardCheck, Truck, MessageSquare, Phone, Code, Briefcase as BriefcaseIcon, HeartHandshake, DollarSign } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
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
    popular: false, tokens: "18M", actions: "22.000",
    agents: [
      { key: "coding", icon: Wrench, role: "Dev Full-Stack Sênior", tokens: "3M" },
      { key: "frontend_specialist", icon: Code, role: "Especialista Frontend (React/Vue)", tokens: "2M" },
      { key: "backend_specialist", icon: Building2, role: "Especialista Backend (Node/Python)", tokens: "2M" },
      { key: "mobile_dev", icon: Phone, role: "Desenvolvedor Mobile (iOS/Android)", tokens: "2M" },
      { key: "computer", icon: Building2, role: "DevOps / SRE", tokens: "2M" },
      { key: "data_engineer", icon: Network, role: "Engenheiro de Dados", tokens: "2M" },
      { key: "qa_automation", icon: CheckCircle2, role: "QA / Automação de Testes", tokens: "1.5M" },
      { key: "project_management", icon: ClipboardList, role: "Gerente de Projetos Tech", tokens: "1.5M" },
      { key: "security", icon: Shield, role: "CISO / Eng. de Segurança", tokens: "2M" },
    ],
    headcount: 9, cltCost: 150000, clauthorCost: 1650, discount: 30,
  },
  {
    id: "comercial", icon: Briefcase, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: true, tokens: "12M", actions: "16.000",
    agents: [
      { key: "sales", icon: Briefcase, role: "SDR / Closer de Vendas", tokens: "2M" },
      { key: "account_executive", icon: Handshake, role: "Account Executive", tokens: "2M" },
      { key: "customer_success", icon: Star, role: "Customer Success Manager", tokens: "1.5M" },
      { key: "sales_ops", icon: BarChart3, role: "Sales Enablement / Ops", tokens: "1.5M" },
      { key: "proposal_writer", icon: FileText, role: "Redator de Propostas", tokens: "1.5M" },
      { key: "sales_channel", icon: MessageSquare, role: "Canal de Vendas Multicanal", tokens: "1.5M" },
      { key: "voice_ai", icon: Phone, role: "Operador de Telefonia", tokens: "1M" },
      { key: "crm_manager", icon: Star, role: "Gestor de CRM", tokens: "1M" },
    ],
    headcount: 8, cltCost: 78000, clauthorCost: 1547, discount: 25,
  },
  {
    id: "marketing", icon: Megaphone, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: true, tokens: "14M", actions: "18.000",
    agents: [
      { key: "content", icon: Sparkles, role: "Copywriter / Redator Sênior", tokens: "1.5M" },
      { key: "content_creator", icon: PenTool, role: "Criador de Conteúdo (blog, ebook, roteiro)", tokens: "1.5M" },
      { key: "designer", icon: Palette, role: "Designer de Peças (posts, banners, ads)", tokens: "1.5M" },
      { key: "video_editor", icon: Video, role: "Editor de Vídeo (Reels/Shorts/YouTube)", tokens: "1.5M" },
      { key: "social_media_mgr", icon: Megaphone, role: "Gestão de Mídias Sociais", tokens: "1.5M" },
      { key: "social_analyst", icon: BarChart3, role: "Analista de Métricas Sociais", tokens: "1M" },
      { key: "media_buyer", icon: Target, role: "Tráfego Pago (Meta/Google/TikTok)", tokens: "1.5M" },
      { key: "growth", icon: TrendingUp, role: "Growth / Automação", tokens: "1M" },
      { key: "seo_growth", icon: Globe, role: "Analista SEO", tokens: "1M" },
      { key: "email_marketing", icon: FileText, role: "Email Marketing Manager", tokens: "1M" },
      { key: "community_mgr", icon: Users, role: "Community Manager", tokens: "1M" },
    ],
    headcount: 11, cltCost: 88000, clauthorCost: 1447, discount: 30,
  },
  {
    id: "financeiro", icon: BarChart3, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "12M", actions: "14.000",
    agents: [
      { key: "revenue", icon: BarChart3, role: "CFO / Controller", tokens: "2M" },
      { key: "data_analytics", icon: BarChart3, role: "Analista de BI Financeiro", tokens: "1.5M" },
      { key: "ai_cfo", icon: DollarSign, role: "CFO Virtual / Estratégia", tokens: "1.5M" },
      { key: "accounts_payable", icon: Receipt, role: "Analista de Contas a Pagar", tokens: "1M" },
      { key: "accounts_receivable", icon: Coins, role: "Analista de Cobrança (AR)", tokens: "1M" },
      { key: "tax_content", icon: FileText, role: "Conteúdo Tributário", tokens: "1M" },
      { key: "digital_accountant", icon: FileText, role: "Contador Digital", tokens: "1.5M" },
      { key: "tax_compliance", icon: Shield, role: "Analista Fiscal", tokens: "1.5M" },
      { key: "credit_recovery", icon: Star, role: "Regularizador de Crédito", tokens: "1M" },
    ],
    headcount: 9, cltCost: 84000, clauthorCost: 1497, discount: 25,
  },
  {
    id: "criacao", icon: Palette, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "10M", actions: "12.000",
    agents: [
      { key: "creative_design", icon: Palette, role: "Designer Gráfico Sênior", tokens: "1.5M" },
      { key: "motion_designer", icon: Zap, role: "Motion Designer", tokens: "1.5M" },
      { key: "video_production", icon: Video, role: "Editor de Vídeo / Pós-produção", tokens: "1.5M" },
      { key: "illustrator", icon: PenTool, role: "Ilustrador Digital", tokens: "1M" },
      { key: "product_photographer", icon: Star, role: "Fotógrafo de Produto (AI)", tokens: "1M" },
      { key: "creative_writer", icon: Sparkles, role: "Redator Criativo", tokens: "1M" },
      { key: "content_producer", icon: Megaphone, role: "Produtor de Conteúdo", tokens: "1M" },
      { key: "presentation_designer", icon: FileText, role: "Designer de Apresentações", tokens: "1M" },
      { key: "ux_researcher", icon: Lightbulb, role: "UX Researcher", tokens: "1M" },
    ],
    headcount: 9, cltCost: 70000, clauthorCost: 2997, discount: 20,
  },
  {
    id: "suporte", icon: MessageSquare, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "9M", actions: "15.000",
    agents: [
      { key: "support_channel", icon: MessageSquare, role: "Atendente N1 / N2", tokens: "1.5M" },
      { key: "support_lead", icon: Star, role: "Líder de Suporte", tokens: "1.5M" },
      { key: "voice_support", icon: Phone, role: "Operador Call Center", tokens: "1M" },
      { key: "rag", icon: FileText, role: "Base de Conhecimento", tokens: "1M" },
      { key: "onboarding_specialist", icon: UserPlus, role: "Especialista Onboarding", tokens: "1M" },
      { key: "escalation_mgr", icon: TrendingUp, role: "Escalation Manager", tokens: "1M" },
      { key: "qa_support", icon: CheckCircle2, role: "QA de Atendimento", tokens: "1M" },
      { key: "omnichannel", icon: Network, role: "Omnichannel 24/7", tokens: "1M" },
    ],
    headcount: 8, cltCost: 52000, clauthorCost: 2997, discount: 20,
  },
  {
    id: "rh", icon: GraduationCap, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "6M", actions: "8.000",
    agents: [
      { key: "hr", icon: Star, role: "Recrutador / Business Partner", tokens: "1.5M" },
      { key: "training", icon: GraduationCap, role: "T&D / Onboarding", tokens: "1M" },
      { key: "people_analytics", icon: BarChart3, role: "People Analytics", tokens: "1M" },
      { key: "payroll", icon: Receipt, role: "Analista de Folha / Payroll", tokens: "1M" },
      { key: "employer_branding", icon: Award, role: "Employer Branding", tokens: "1M" },
      { key: "labor_compliance", icon: ShieldCheck, role: "Compliance Trabalhista", tokens: "1M" },
    ],
    headcount: 6, cltCost: 42000, clauthorCost: 1497, discount: 20,
  },
  {
    id: "prospeccao", icon: Crosshair, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: true, tokens: "16M", actions: "20.000",
    agents: [
      { key: "sdr_outbound", icon: Crosshair, role: "SDR Outbound", tokens: "1.5M" },
      { key: "sdr_inbound", icon: UserPlus, role: "SDR Inbound", tokens: "1.5M" },
      { key: "sdr_linkedin", icon: Hash, role: "SDR LinkedIn B2B", tokens: "1.5M" },
      { key: "sdr_whatsapp", icon: MessageSquare, role: "SDR WhatsApp", tokens: "1.5M" },
      { key: "sdr_instagram", icon: Target, role: "SDR Instagram", tokens: "1M" },
      { key: "sdr_social", icon: Globe, role: "SDR Social Selling", tokens: "1M" },
      { key: "sdr_database", icon: Search, role: "SDR Base de Dados", tokens: "1M" },
      { key: "sdr_events", icon: Calendar, role: "SDR Eventos", tokens: "1M" },
      { key: "sdr_partnerships", icon: Handshake, role: "SDR Parcerias", tokens: "1M" },
      { key: "sdr_cold_email", icon: FileText, role: "SDR Cold Email", tokens: "1M" },
      { key: "sdr_video", icon: Video, role: "SDR Vídeo Personalizado", tokens: "1M" },
      { key: "pre_qualifier", icon: CheckCircle2, role: "Pré-Qualificador", tokens: "1M" },
      { key: "hunter", icon: Crosshair, role: "Hunter de Negócios", tokens: "1M" },
      { key: "farmer", icon: Repeat, role: "Farmer / Expansão", tokens: "1M" },
    ],
    headcount: 14, cltCost: 112000, clauthorCost: 1697, discount: 35,
  },
  {
    id: "comunicacao", icon: PenTool, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "10M", actions: "12.000",
    agents: [
      { key: "copywriting", icon: PenTool, role: "Copywriter de Conversão", tokens: "1.5M" },
      { key: "branding", icon: Award, role: "Brand Strategist", tokens: "1.5M" },
      { key: "positioning", icon: Target, role: "Estrategista de Mercado", tokens: "1M" },
      { key: "public_relations", icon: Megaphone, role: "Assessor de Imprensa", tokens: "1M" },
      { key: "social_proof", icon: ThumbsUp, role: "Gestor de Prova Social", tokens: "1M" },
      { key: "events_speaker", icon: Calendar, role: "Produtor de Eventos", tokens: "1M" },
      { key: "linkedin_ghost", icon: Hash, role: "Ghostwriter LinkedIn (Executivos)", tokens: "1M" },
      { key: "newsletter_editor", icon: FileText, role: "Editor de Newsletter", tokens: "1M" },
      { key: "podcast_host", icon: Phone, role: "Podcast Host / Produtor", tokens: "1M" },
    ],
    headcount: 9, cltCost: 68000, clauthorCost: 1397, discount: 30,
  },
  {
    id: "operacoes", icon: Rocket, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "15M", actions: "18.000",
    agents: [
      { key: "orchestrator", icon: Network, role: "Orquestrador Multi-Agente (Thor)", tokens: "2.5M" },
      { key: "concierge", icon: Star, role: "Concierge Executivo", tokens: "1.5M" },
      { key: "ceo", icon: Building2, role: "CEO Virtual / Estrategista", tokens: "1.5M" },
      { key: "chief_of_staff", icon: ClipboardList, role: "Chief of Staff", tokens: "1.5M" },
      { key: "startup_creator", icon: Rocket, role: "Startup Creator", tokens: "1.5M" },
      { key: "business_analyst", icon: BarChart3, role: "Business Analyst", tokens: "1.5M" },
      { key: "rpa_automation", icon: Cog, role: "Automação de Processos (RPA)", tokens: "1M" },
      { key: "scheduler", icon: Calendar, role: "Agendador Inteligente", tokens: "0.5M" },
      { key: "proposal_gen", icon: FileText, role: "Gerador de Propostas", tokens: "1M" },
      { key: "research", icon: Search, role: "Pesquisador / Analista", tokens: "2M" },
    ],
    headcount: 10, cltCost: 120000, clauthorCost: 1650, discount: 30,
  },
  {
    id: "ecommerce_growth", icon: Store, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "14M", actions: "16.000",
    agents: [
      { key: "paid_traffic", icon: TrendingUp, role: "Gestor de Tráfego Pago", tokens: "1.5M" },
      { key: "ads_copywriter", icon: PenTool, role: "Copywriter de Anúncios", tokens: "1M" },
      { key: "cro_specialist", icon: Target, role: "Otimizador de Conversão (CRO)", tokens: "1.5M" },
      { key: "whatsapp_commerce", icon: MessageSquare, role: "WhatsApp Commerce", tokens: "1.5M" },
      { key: "marketplace_mgr", icon: ShoppingCart, role: "Gestor de Marketplaces (ML/Amazon/Shopee)", tokens: "1.5M" },
      { key: "influencer_liveshop", icon: Zap, role: "LiveShop & Influencer", tokens: "1M" },
      { key: "affiliate_manager", icon: Handshake, role: "Gestor de Afiliados", tokens: "1M" },
      { key: "podcast_manager", icon: Megaphone, role: "Podcast Manager", tokens: "1M" },
      { key: "reputation", icon: Award, role: "Gestor de Reputação", tokens: "1M" },
      { key: "ecommerce", icon: Store, role: "E-commerce Operations", tokens: "2M" },
    ],
    headcount: 10, cltCost: 90000, clauthorCost: 1497, discount: 30,
  },
  {
    id: "juridico", icon: Gavel, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "13M", actions: "14.000",
    agents: [
      { key: "contract_analyst", icon: FileText, role: "Analista de Contratos", tokens: "2M" },
      { key: "compliance_officer", icon: ShieldCheck, role: "Compliance / DPO", tokens: "1.5M" },
      { key: "labor_law", icon: Scale, role: "Advogado Trabalhista", tokens: "1.5M" },
      { key: "litigation", icon: Gavel, role: "Advogado Contencioso", tokens: "2M" },
      { key: "tax_lawyer", icon: Receipt, role: "Advogado Tributário", tokens: "1.5M" },
      { key: "digital_lawyer", icon: Shield, role: "Advogado Digital / LGPD", tokens: "1.5M" },
      { key: "paralegal", icon: ClipboardList, role: "Paralegal / Assistente", tokens: "1M" },
      { key: "legal", icon: FileText, role: "Analista Jurídico Geral", tokens: "2M" },
    ],
    headcount: 8, cltCost: 108000, clauthorCost: 1597, discount: 30,
  },
  {
    id: "compras", icon: Package, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "9M", actions: "11.000",
    agents: [
      { key: "procurement", icon: Package, role: "Comprador Sênior", tokens: "1.5M" },
      { key: "supplier_mgr", icon: Factory, role: "Gestor de Fornecedores", tokens: "1.5M" },
      { key: "cost_analyst", icon: Receipt, role: "Analista de Custos", tokens: "1.5M" },
      { key: "contract_negotiator", icon: Handshake, role: "Negociador", tokens: "1.5M" },
      { key: "sourcing_analyst", icon: Search, role: "Sourcing Analyst", tokens: "1.5M" },
      { key: "contract_manager", icon: FileText, role: "Contract Manager", tokens: "1.5M" },
    ],
    headcount: 6, cltCost: 66000, clauthorCost: 2997, discount: 25,
  },
  {
    id: "logistica", icon: Truck, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "9M", actions: "11.000",
    agents: [
      { key: "logistics", icon: Truck, role: "Coordenador Logístico", tokens: "1.5M" },
      { key: "inventory", icon: Package, role: "Analista de Estoque", tokens: "1.5M" },
      { key: "supply_chain", icon: Network, role: "Supply Chain Manager", tokens: "2M" },
      { key: "last_mile", icon: Truck, role: "Última Milha / Roteirização", tokens: "1.5M" },
      { key: "returns_mgr", icon: Repeat, role: "Gestor de Devoluções", tokens: "1M" },
      { key: "fleet_mgr", icon: Truck, role: "Coordenador de Frota", tokens: "1.5M" },
    ],
    headcount: 6, cltCost: 60000, clauthorCost: 2497, discount: 25,
  },
  {
    id: "qualidade", icon: ClipboardCheck, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "5M", actions: "6.000",
    agents: [
      { key: "quality", icon: ClipboardCheck, role: "Analista de Qualidade", tokens: "1.5M" },
      { key: "process_analyst", icon: Cog, role: "Analista de Processos", tokens: "1.5M" },
      { key: "iso_auditor", icon: ShieldCheck, role: "Auditor ISO / Compliance", tokens: "1M" },
      { key: "continuous_improvement", icon: TrendingUp, role: "Melhoria Contínua (Lean/Kaizen)", tokens: "1M" },
    ],
    headcount: 4, cltCost: 30000, clauthorCost: 1297, discount: 20,
  },
  {
    id: "dados", icon: BarChart3, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "12M", actions: "14.000",
    agents: [
      { key: "bi_analyst", icon: BarChart3, role: "Analista de BI / Dashboards", tokens: "2M" },
      { key: "data_scientist", icon: Network, role: "Cientista de Dados", tokens: "2M" },
      { key: "ml_engineer", icon: Cog, role: "Engenheiro de ML", tokens: "2M" },
      { key: "data_analyst", icon: Search, role: "Analista de Dados", tokens: "1.5M" },
      { key: "forecasting", icon: TrendingUp, role: "Forecasting & Previsão", tokens: "1.5M" },
      { key: "data_governance", icon: ShieldCheck, role: "Data Governance / LGPD", tokens: "1.5M" },
      { key: "dashboard_designer", icon: Palette, role: "Designer de Dashboards", tokens: "1.5M" },
    ],
    headcount: 7, cltCost: 91000, clauthorCost: 1697, discount: 30,
  },
  {
    id: "produto", icon: Lightbulb, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "10M", actions: "12.000",
    agents: [
      { key: "product_manager", icon: ClipboardList, role: "Product Manager", tokens: "2M" },
      { key: "product_designer", icon: Palette, role: "Product Designer (UI/UX)", tokens: "1.5M" },
      { key: "ux_writer", icon: PenTool, role: "UX Writer", tokens: "1M" },
      { key: "user_researcher", icon: Search, role: "User Researcher", tokens: "1.5M" },
      { key: "product_analytics", icon: BarChart3, role: "Product Analytics", tokens: "1.5M" },
      { key: "product_ops", icon: Cog, role: "Product Ops", tokens: "1M" },
      { key: "discovery_lead", icon: Lightbulb, role: "Discovery Lead", tokens: "1.5M" },
    ],
    headcount: 7, cltCost: 84000, clauthorCost: 1597, discount: 30,
  },
  {
    id: "inovacao", icon: Rocket, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "9M", actions: "10.000",
    agents: [
      { key: "innovation_lead", icon: Lightbulb, role: "Líder de Inovação", tokens: "1.5M" },
      { key: "rd_researcher", icon: Search, role: "Pesquisador P&D", tokens: "1.5M" },
      { key: "trend_scanner", icon: TrendingUp, role: "Trend Scanner / Foresight", tokens: "1M" },
      { key: "patent_analyst", icon: FileText, role: "Analista de Patentes/IP", tokens: "1.5M" },
      { key: "corporate_venture", icon: Handshake, role: "Corporate Venture / M&A", tokens: "1.5M" },
      { key: "prototyper", icon: Zap, role: "Prototipador Rápido", tokens: "1M" },
    ],
    headcount: 6, cltCost: 78000, clauthorCost: 1897, discount: 25,
  },
  {
    id: "sustentabilidade", icon: Award, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "7M", actions: "8.000",
    agents: [
      { key: "esg_lead", icon: Award, role: "Líder ESG", tokens: "1.5M" },
      { key: "carbon_analyst", icon: BarChart3, role: "Analista de Emissões / Carbono", tokens: "1.5M" },
      { key: "esg_reporting", icon: FileText, role: "Relatórios ESG (GRI/SASB)", tokens: "1.5M" },
      { key: "social_impact", icon: ThumbsUp, role: "Impacto Social", tokens: "1M" },
      { key: "sustainability_supplier", icon: Factory, role: "Fornecedores Sustentáveis", tokens: "1M" },
      { key: "esg_compliance", icon: ShieldCheck, role: "Compliance ESG", tokens: "1M" },
    ],
    headcount: 6, cltCost: 60000, clauthorCost: 1497, discount: 25,
  },
  {
    id: "parcerias", icon: Handshake, color: "text-primary",
    gradient: "from-primary/10 to-transparent",
    borderActive: "border-primary/30",
    iconBg: "bg-primary/10",
    popular: false, tokens: "8M", actions: "10.000",
    agents: [
      { key: "partnership_lead", icon: Handshake, role: "Head de Parcerias", tokens: "1.5M" },
      { key: "channel_manager", icon: Network, role: "Gestor de Canais / Revendas", tokens: "1.5M" },
      { key: "alliance_manager", icon: Building2, role: "Alliance Manager (Big Tech)", tokens: "1.5M" },
      { key: "affiliate_lead", icon: Star, role: "Gestor de Afiliados & Indicações", tokens: "1M" },
      { key: "co_marketing", icon: Megaphone, role: "Co-Marketing / Co-Selling", tokens: "1M" },
      { key: "developer_relations", icon: Code, role: "Developer Relations (DevRel)", tokens: "1.5M" },
    ],
    headcount: 6, cltCost: 72000, clauthorCost: 1497, discount: 25,
  },
];

export const totalClauthorCost = departments.reduce((a, d) => a + d.clauthorCost, 0);
export const totalCltCost = departments.reduce((a, d) => a + d.cltCost, 0);
export const totalTokens = "180M";
export const totalAgents = 200;
export const totalSavingsPercent = Math.round(((totalCltCost - totalClauthorCost) / totalCltCost) * 100);

/** Department details for the rich cards in Library page */
export const deptDetails: Record<string, DeptDetail> = {
  comercial: {
    icon: Briefcase,
    agents: ["SDR / Closer", "Account Executive", "Customer Success", "Sales Ops", "Redator de Propostas", "Canal Multicanal", "Telefonia IA", "Gestor de CRM"],
    replaces: ["2 SDRs", "1 Account Executive", "1 CS Manager", "1 Sales Ops", "1 Redator", "2 Atendentes"],
    faq: [
      { q: "Quantos leads o time processa?", a: "Até 500 leads/dia com qualificação automática, scoring e distribuição inteligente." },
      { q: "Integra com meu CRM?", a: "Sim. HubSpot, Salesforce, Pipedrive, RD Station e qualquer CRM via API." },
      { q: "E se o lead pedir um humano?", a: "O agente transfere automaticamente quando detecta essa necessidade." },
    ],
  },
  tecnologia: {
    icon: Code,
    agents: ["Dev Full-Stack", "Frontend Specialist", "Backend Specialist", "Mobile Dev", "DevOps / SRE", "Data Engineer", "QA Automation", "Tech PM", "CISO"],
    replaces: ["2 Devs Sênior", "1 Frontend", "1 Backend", "1 Mobile", "1 DevOps", "1 QA", "1 PM", "1 CISO"],
    faq: [
      { q: "Que linguagens suporta?", a: "JavaScript, TypeScript, Python, Go, Rust, Java e mais. Full-stack com CI/CD integrado." },
      { q: "Faz deploy sozinho?", a: "Sim. Integra com GitHub, GitLab, Vercel, AWS. Pipeline completo automatizado." },
      { q: "E segurança?", a: "Scan de vulnerabilidades contínuo, LGPD compliance, SOC2 readiness e threat detection." },
    ],
  },
  marketing: {
    icon: Megaphone,
    agents: ["Copywriter Sênior", "Criador de Conteúdo", "Designer de Peças", "Editor de Vídeo", "Gestão de Mídias Sociais", "Analista de Métricas Sociais", "Tráfego Pago", "Growth", "SEO", "Email Marketing", "Community Manager"],
    replaces: ["1 Copywriter", "1 Criador de Conteúdo", "1 Designer", "1 Editor de Vídeo", "1 Social Media", "1 Analista Social", "1 Media Buyer", "1 Growth", "1 SEO", "1 Email Marketing", "1 Community"],
    faq: [
      { q: "Cria conteúdo original?", a: "Sim. Posts, reels, carrosséis, blogs, ebooks, roteiros de vídeo, emails — tudo com o tom de voz da sua marca." },
      { q: "Faz tráfego pago?", a: "Meta Ads, Google Ads e TikTok Ads com otimização automática de ROAS, criativos gerados pelo designer e A/B testing contínuo." },
      { q: "Mede resultados?", a: "Analista de Métricas Sociais entrega dashboard diário com engajamento, alcance, CTR, CPL, ROAS e recomendações acionáveis." },
    ],
  },
  suporte: {
    icon: HeartHandshake,
    agents: ["Atendente N1/N2", "Líder de Suporte", "Call Center IA", "Base de Conhecimento", "Onboarding", "Escalation Manager", "QA de Atendimento", "Omnichannel 24/7"],
    replaces: ["3 Atendentes", "1 Líder", "2 Operadores Call", "1 Documentador", "1 Onboarding", "1 QA", "1 Omnichannel"],
    faq: [
      { q: "Qual o tempo de resposta?", a: "Média de 4 segundos. SLA garantido. CSAT médio: 98%." },
      { q: "Atende em quais canais?", a: "WhatsApp, Instagram, Chat, E-mail, Telegram e Telefone - tudo unificado." },
      { q: "Escala para humanos?", a: "Sim. Transferência inteligente quando a complexidade exige intervenção humana." },
    ],
  },
  financeiro: {
    icon: DollarSign,
    agents: ["CFO / Controller", "BI Financeiro", "CFO Virtual", "Contas a Pagar", "Cobrança (AR)", "Conteúdo Tributário", "Contador Digital", "Analista Fiscal", "Regularizador de Crédito"],
    replaces: ["1 CFO", "1 Analista BI", "1 Controller", "1 AP", "1 AR", "1 Conteudista Fiscal", "1 Contador", "1 Analista Fiscal", "1 Analista de Crédito"],
    faq: [
      { q: "Emite nota fiscal?", a: "Integra com SEFAZ, Conta Azul, Omie e ERPs para emissão e conciliação automática." },
      { q: "Faz previsão de caixa?", a: "Sim. Forecast de 30, 60 e 90 dias com cenários otimista, neutro e pessimista." },
      { q: "E contabilidade e impostos?", a: "Escrituração completa, DAS, DCTF, SPED, EFD, apuração fiscal e regularização de crédito - tudo automatizado." },
    ],
  },
  criacao: {
    icon: Palette,
    agents: ["Designer Sênior", "Motion Designer", "Editor de Vídeo", "Ilustrador Digital", "Foto de Produto (AI)", "Redator Criativo", "Produtor de Conteúdo", "Designer de Apresentações", "UX Researcher"],
    replaces: ["1 Designer", "1 Motion", "1 Editor Vídeo", "1 Ilustrador", "1 Fotógrafo", "1 Redator", "1 Produtor", "1 Slide Designer", "1 UX"],
    faq: [
      { q: "Cria em quais formatos?", a: "Banners, social kits, reels, shorts, thumbnails, apresentações, ilustrações, packshots e materiais impressos." },
      { q: "Mantém identidade visual?", a: "Sim. Aprende seu brandbook e aplica consistentemente em todas as peças." },
      { q: "Faz edição de vídeo?", a: "Corte, legenda, motion graphics, correção de cor e thumbnail - tudo automático." },
    ],
  },
  rh: {
    icon: Users,
    agents: ["Recruiter / BP", "T&D Manager", "People Analytics", "Folha / Payroll", "Employer Branding", "Compliance Trabalhista"],
    replaces: ["1 Recruiter", "1 T&D", "1 People Analyst", "1 Payroll", "1 Employer Branding", "1 Compliance"],
    faq: [
      { q: "Como faz triagem de CVs?", a: "Analisa fit cultural, skills técnicas e experiência. Ranking automático por score." },
      { q: "Faz onboarding?", a: "Trilhas de onboarding personalizadas de 30/60/90 dias com gamificação." },
      { q: "Mede clima organizacional?", a: "Pesquisas de eNPS automáticas, análise de sentimento e alertas de risco." },
    ],
  },
  prospeccao: {
    icon: Crosshair,
    agents: ["SDR Outbound", "SDR Inbound", "SDR LinkedIn", "SDR WhatsApp", "SDR Instagram", "SDR Social", "SDR Base de Dados", "SDR Eventos", "SDR Parcerias", "SDR Cold Email", "SDR Vídeo", "Pré-Qualificador", "Hunter", "Farmer"],
    replaces: ["4 SDRs Outbound", "2 SDRs Inbound", "2 SDRs Sociais", "1 Pré-Qualificador", "1 Hunter", "1 Farmer", "1 SDR Eventos"],
    faq: [
      { q: "Quantos leads prospecta por dia?", a: "Até 1.000 leads/dia com abordagem multicanal simultânea - LinkedIn, WhatsApp, Instagram, email e telefone." },
      { q: "Faz cold outreach automatizado?", a: "Sim. Sequências personalizadas com IA por LinkedIn, e-mail e WhatsApp com follow-up inteligente." },
      { q: "Como qualifica os leads?", a: "Scoring automático com BANT/MEDDIC, enriquecimento de dados e distribuição inteligente para closers." },
    ],
  },
  comunicacao: {
    icon: PenTool,
    agents: ["Copywriter", "Brand Strategist", "Estrategista de Mercado", "Assessor de Imprensa", "Prova Social", "Produtor de Eventos", "Ghostwriter LinkedIn", "Editor de Newsletter", "Podcast Host"],
    replaces: ["1 Copywriter Sênior", "1 Brand Manager", "1 Estrategista", "1 Assessor de Imprensa", "1 Social Proof", "1 Produtor de Eventos", "1 Ghostwriter", "1 Newsletter Editor", "1 Podcast Producer"],
    faq: [
      { q: "Mantém o tom de voz da marca?", a: "Sim. Aprende o brandbook, guidelines e histórico de comunicação para manter 100% de consistência." },
      { q: "Faz assessoria de imprensa?", a: "Sim. Gera press releases, media kits, pitch para jornalistas e monitora menções na mídia." },
      { q: "Gerencia prova social?", a: "Coleta, organiza e publica depoimentos, cases e reviews automaticamente nos canais certos." },
    ],
  },
  operacoes: {
    icon: Rocket,
    agents: ["Orquestrador Thor", "Concierge Executivo", "CEO Virtual", "Chief of Staff", "Startup Creator", "Business Analyst", "RPA / Automação", "Agendador", "Gerador de Propostas", "Pesquisador"],
    replaces: ["1 COO", "1 Assistente Executivo", "1 CEO Advisor", "1 Chief of Staff", "1 PM", "1 BA", "1 Analista RPA", "1 Agendador", "1 Analista Propostas", "1 Pesquisador"],
    faq: [
      { q: "O que o Orquestrador faz?", a: "Coordena todos os outros agentes, distribui tarefas, prioriza ações e garante que nada fique parado." },
      { q: "Gera propostas comerciais?", a: "Sim. Propostas personalizadas com precificação, escopo, cronograma e design profissional em minutos." },
      { q: "Faz pesquisa de mercado?", a: "Análise competitiva, tendências, benchmarks e insights estratégicos com dados em tempo real." },
    ],
  },
  ecommerce_growth: {
    icon: Store,
    agents: ["Tráfego Pago", "Copy de Anúncios", "CRO Specialist", "WhatsApp Commerce", "Gestor de Marketplaces", "LiveShop & Influencer", "Afiliados", "Podcast Manager", "Gestor de Reputação", "E-commerce Ops"],
    replaces: ["1 Media Buyer", "1 Copywriter Ads", "1 CRO", "1 WhatsApp Closer", "1 Marketplace Manager", "1 Influencer Manager", "1 Afiliados", "1 Podcast Producer", "1 Reputation Manager", "1 E-com Manager"],
    faq: [
      { q: "Gerencia campanhas de tráfego pago?", a: "Sim. Meta Ads, Google Ads, TikTok Ads com otimização de ROAS automática e A/B testing contínuo." },
      { q: "Faz vendas por WhatsApp?", a: "Catálogo, carrinho, pagamento e pós-venda - tudo dentro do WhatsApp com automação completa." },
      { q: "Vende em marketplaces?", a: "Cadastro, precificação dinâmica, gestão de reviews e SLA no Mercado Livre, Amazon, Shopee e Magalu." },
    ],
  },
  juridico: {
    icon: Gavel,
    agents: ["Analista de Contratos", "Compliance / DPO", "Trabalhista", "Contencioso", "Tributário", "Digital / LGPD", "Paralegal", "Jurídico Geral"],
    replaces: ["1 Contratos", "1 DPO", "1 Trabalhista", "1 Contencioso", "1 Tributário", "1 Digital", "1 Paralegal", "1 Jurídico"],
    faq: [
      { q: "Analisa contratos automaticamente?", a: "Sim. Identifica cláusulas de risco, sugere alterações e compara com templates padrão em segundos." },
      { q: "Faz compliance LGPD?", a: "Mapeamento de dados, termos de consentimento, DPIA, relatórios de impacto e alertas de conformidade." },
      { q: "Atua em contencioso?", a: "Pesquisa jurisprudência, prepara peças processuais, acompanha prazos e gera relatórios de casos." },
    ],
  },
  compras: {
    icon: Package,
    agents: ["Comprador Sênior", "Gestor de Fornecedores", "Analista de Custos", "Negociador", "Sourcing Analyst", "Contract Manager"],
    replaces: ["1 Comprador", "1 Gestor Fornecedores", "1 Analista Custos", "1 Negociador", "1 Sourcing", "1 Contract Mgr"],
    faq: [
      { q: "Negocia com fornecedores?", a: "Sim. Cotações automáticas, comparação multicriterial e negociação baseada em dados históricos." },
      { q: "Reduz custos operacionais?", a: "Análise de TCO, identificação de savings, consolidação de compras e renegociação automática." },
      { q: "Gerencia fornecedores?", a: "Cadastro, avaliação de performance, SLA monitoring e gestão de contratos - tudo centralizado." },
    ],
  },
  logistica: {
    icon: Truck,
    agents: ["Coordenador Logístico", "Analista de Estoque", "Supply Chain Manager", "Última Milha", "Devoluções", "Coordenador de Frota"],
    replaces: ["1 Coordenador", "1 Analista Estoque", "1 Supply Chain", "1 Last Mile", "1 Devoluções", "1 Frota"],
    faq: [
      { q: "Otimiza rotas de entrega?", a: "Sim. Roteirização inteligente com redução de até 30% no custo de frete e tempo de entrega." },
      { q: "Controla estoque?", a: "Previsão de demanda, ponto de reposição automático, curva ABC e alertas de ruptura." },
      { q: "Integra com transportadoras?", a: "Sim. Correios, Jadlog, Total Express, Loggi e qualquer transportadora via API." },
    ],
  },
  qualidade: {
    icon: ClipboardCheck,
    agents: ["Analista de Qualidade", "Analista de Processos", "Auditor ISO", "Melhoria Contínua"],
    replaces: ["1 Qualidade", "1 Processos", "1 Auditor ISO", "1 Lean/Kaizen"],
    faq: [
      { q: "Faz auditoria de processos?", a: "Sim. Mapeamento, análise de gaps, sugestões de melhoria e acompanhamento de indicadores." },
      { q: "Implementa ISO/Lean?", a: "Checklists automáticos, documentação de processos, PDCA e Kaizen com tracking de resultados." },
      { q: "Monitora KPIs de qualidade?", a: "Dashboard em tempo real com OEE, taxa de defeito, CSAT interno e alertas de desvio." },
    ],
  },
};
