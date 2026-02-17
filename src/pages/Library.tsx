import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  MessageSquare, FileText, DollarSign,
  Calendar, Receipt, Star, ShoppingCart, ArrowRight,
  Code, Brain, Shield, Mic, Bot, Eye, Workflow,
  Phone, Search, Users, Briefcase, BarChart3,
  Layers, Cpu, Sparkles, Globe, Rocket, Loader2,
  Megaphone, Target, Palette, Video, ClipboardList, Truck, GraduationCap,
  HeartHandshake, Crown, Play, TrendingUp, Zap, Activity,
  ChevronRight, Flame, Award
} from "lucide-react";
import ROICalculator from "@/components/library/ROICalculator";
import SquadConsultant from "@/components/pricing/SquadConsultant";
import AgentLivePreview from "@/components/library/AgentLivePreview";
import { getPriceDisplay, getPrice, type PriceTier } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Agent keys map to i18n keys under library_page.agents.*
const agentKeys = [
  "voice_ai", "orchestrator", "research", "coding", "omnichannel",
  "revenue", "sales", "rag", "computer", "content", "security", "hr",
  "customer_success", "data_analytics", "legal", "ecommerce",
  "influencer", "marketing_automation", "creative_design", "video_production",
  "seo_growth", "project_management", "supply_chain", "training",
  "concierge", "ceo", "startup_creator"
] as const;

// Featured agents for the hero carousel
const featuredKeys = ["voice_ai", "orchestrator", "ceo"] as const;

// Map library keys to DB template slugs
const agentSlugs: Record<string, string> = {
  voice_ai: "voice_ai", orchestrator: "orchestrator", research: "research", coding: "coding",
  omnichannel: "omnichannel", revenue: "revenue", sales: "sales",
  rag: "rag", computer: "computer", content: "content", security: "security", hr: "hr",
  customer_success: "customer_success", data_analytics: "data_analytics", legal: "legal", ecommerce: "ecommerce",
  influencer: "influencer", marketing_automation: "marketing_automation", creative_design: "creative_design",
  video_production: "video_production", seo_growth: "seo_growth", project_management: "project_management",
  supply_chain: "supply_chain", training: "training",
  concierge: "concierge", ceo: "ceo", startup_creator: "startup_creator",
};

const agentIcons: Record<string, React.ElementType> = {
  voice_ai: Phone, orchestrator: Workflow, research: Search, coding: Code,
  omnichannel: MessageSquare, revenue: BarChart3, sales: Briefcase,
  rag: Layers, computer: Cpu, content: Sparkles, security: Shield, hr: Users,
  customer_success: Star, data_analytics: Eye, legal: FileText, ecommerce: ShoppingCart,
  influencer: Megaphone, marketing_automation: Target, creative_design: Palette,
  video_production: Video, seo_growth: Globe, project_management: ClipboardList,
  supply_chain: Truck, training: GraduationCap,
  concierge: HeartHandshake, ceo: Crown, startup_creator: Rocket,
};

const agentTiers: Record<string, string> = {
  voice_ai: "enterprise", orchestrator: "enterprise", research: "advanced", coding: "enterprise",
  omnichannel: "advanced", revenue: "advanced", sales: "advanced",
  rag: "intermediate", computer: "enterprise", content: "intermediate", security: "enterprise", hr: "advanced",
  customer_success: "advanced", data_analytics: "advanced", legal: "enterprise", ecommerce: "advanced",
  influencer: "advanced", marketing_automation: "advanced", creative_design: "intermediate",
  video_production: "advanced", seo_growth: "advanced", project_management: "intermediate",
  supply_chain: "advanced", training: "intermediate",
  concierge: "advanced", ceo: "enterprise", startup_creator: "advanced",
};

const agentPriceTiers: Record<string, PriceTier> = {
  voice_ai: "premium", orchestrator: "premium", research: "mid", coding: "high",
  omnichannel: "mid", revenue: "mid", sales: "mid",
  rag: "entry", computer: "high", content: "entry", security: "premium", hr: "mid",
  customer_success: "mid", data_analytics: "mid", legal: "high", ecommerce: "mid",
  influencer: "mid", marketing_automation: "mid", creative_design: "entry",
  video_production: "mid", seo_growth: "mid", project_management: "entry",
  supply_chain: "mid", training: "entry",
  concierge: "mid", ceo: "premium", startup_creator: "mid",
};

const agentTags: Record<string, string[]> = {
  voice_ai: ["Voz IA", "Telefonia", "WhatsApp", "Outbound", "Inbound"],
  orchestrator: ["Multi-Agent", "Orquestração", "Workflow", "Autonomous"],
  research: ["RAG", "Research", "Reports", "Analysis", "Web Scraping"],
  coding: ["GitHub", "CI/CD", "Full-Stack", "Computer Use", "DevOps"],
  omnichannel: ["WhatsApp", "Instagram", "Chat", "E-mail", "Telegram"],
  revenue: ["Finance", "PIX", "Billing", "Forecast", "Accounting"],
  sales: ["CRM", "LinkedIn", "WhatsApp", "Outbound", "Pipeline"],
  rag: ["RAG", "Knowledge Base", "Documents", "Compliance", "Wiki"],
  computer: ["Computer Use", "RPA", "ERP", "Legacy", "Automation"],
  content: ["Social Media", "Blog", "Ads", "E-mail", "Video"],
  security: ["Security", "LGPD", "SOC2", "Threat Detection", "Zero Trust"],
  hr: ["Recruiting", "Onboarding", "Performance", "People Analytics"],
  customer_success: ["Churn", "NPS", "Health Score", "Retention", "Onboarding"],
  data_analytics: ["BI", "SQL", "Dashboards", "Insights", "Predictive"],
  legal: ["Contracts", "Compliance", "LGPD", "Due Diligence", "Risk"],
  ecommerce: ["Marketplace", "Pricing", "Catalog", "Logistics", "Conversion"],
  influencer: ["Influencer", "UGC", "Creators", "Social Media", "Brand"],
  marketing_automation: ["Funis", "Lead Scoring", "Email", "Growth", "Nurturing"],
  creative_design: ["Design", "Banners", "Social Kit", "Branding", "Visual"],
  video_production: ["Reels", "Shorts", "Edição", "Thumbnails", "YouTube"],
  seo_growth: ["SEO", "Keywords", "Link Building", "Tráfego", "Growth"],
  project_management: ["Agile", "Sprints", "Timeline", "Riscos", "PMO"],
  supply_chain: ["Estoque", "Logística", "Fornecedores", "Demanda", "Rotas"],
  training: ["LMS", "Onboarding", "Gamificação", "Trilhas", "Avaliações"],
  concierge: ["Assistente", "Produtividade", "Agenda", "E-mail", "Pessoal"],
  ceo: ["Estratégia", "C-Level", "Decisões", "Previsão", "Board"],
  startup_creator: ["Startup", "MVP", "Pitch Deck", "Validação", "Empreendedorismo"],
};

const agentIntegrations: Record<string, string[]> = {
  voice_ai: ["Twilio", "VoIP SIP", "WhatsApp API", "CRM", "Dialer"],
  orchestrator: ["Internal API", "Webhook", "Slack", "Jira", "N8N"],
  research: ["Web Scraping", "Google Scholar", "Bloomberg", "Notion", "Google Slides"],
  coding: ["GitHub", "Vercel", "Docker", "Linear", "Sentry", "AWS"],
  omnichannel: ["WhatsApp Business API", "Instagram Graph", "Intercom", "Zendesk", "HubSpot"],
  revenue: ["PIX Gateway", "ERP", "Conta Azul", "Omie", "SEFAZ"],
  sales: ["HubSpot", "Salesforce", "LinkedIn Sales Nav", "Apollo.io", "DocuSign"],
  rag: ["SharePoint", "Google Drive", "Notion", "Confluence", "Slack"],
  computer: ["SAP", "TOTVS", "Any ERP", "Gov Portals", "Banks"],
  content: ["Instagram API", "YouTube", "Mailchimp", "WordPress", "Meta Ads"],
  security: ["AWS Security Hub", "Azure Sentinel", "CrowdStrike", "SentinelOne", "Splunk"],
  hr: ["LinkedIn Recruiter", "Gupy", "Slack", "Google Workspace", "eSocial"],
  customer_success: ["HubSpot", "Salesforce", "Intercom", "Mixpanel", "Stripe"],
  data_analytics: ["BigQuery", "PostgreSQL", "Metabase", "Looker", "Google Sheets"],
  legal: ["DocuSign", "Google Drive", "SharePoint", "Notion", "SAP"],
  ecommerce: ["Shopify", "Mercado Livre", "Amazon", "Stripe", "Google Ads"],
  influencer: ["Instagram API", "TikTok API", "YouTube API", "Hootsuite", "Sprout Social"],
  marketing_automation: ["HubSpot", "Mailchimp", "ActiveCampaign", "Google Ads", "RD Station"],
  creative_design: ["Canva", "Figma", "Adobe Suite", "Unsplash", "Shutterstock"],
  video_production: ["YouTube API", "CapCut", "Descript", "Eleven Labs", "TikTok API"],
  seo_growth: ["Google Search Console", "Ahrefs", "SEMrush", "Screaming Frog", "Surfer SEO"],
  project_management: ["Jira", "Asana", "Trello", "Monday.com", "Notion"],
  supply_chain: ["SAP", "Oracle ERP", "TOTVS", "WMS", "Google Maps API"],
  training: ["LMS", "Google Classroom", "Notion", "Moodle", "Microsoft Teams"],
  concierge: ["Google Calendar", "Outlook", "Gmail", "WhatsApp", "Slack", "Notion"],
  ceo: ["ERP", "CRM", "Power BI", "Google Sheets", "Financeiro", "RH"],
  startup_creator: ["Lean Canvas", "Google Slides", "Notion", "Figma", "GitHub", "Stripe"],
};

// Simulated social proof data
const agentSocialProof: Record<string, { companies: number; rating: number; savings: string }> = {
  voice_ai: { companies: 248, rating: 4.9, savings: "R$ 25k" },
  orchestrator: { companies: 132, rating: 4.8, savings: "R$ 40k" },
  research: { companies: 189, rating: 4.7, savings: "R$ 18k" },
  coding: { companies: 156, rating: 4.8, savings: "R$ 35k" },
  omnichannel: { companies: 312, rating: 4.9, savings: "R$ 20k" },
  revenue: { companies: 201, rating: 4.7, savings: "R$ 22k" },
  sales: { companies: 267, rating: 4.8, savings: "R$ 30k" },
  rag: { companies: 145, rating: 4.6, savings: "R$ 12k" },
  computer: { companies: 98, rating: 4.7, savings: "R$ 28k" },
  content: { companies: 334, rating: 4.8, savings: "R$ 15k" },
  security: { companies: 87, rating: 4.9, savings: "R$ 45k" },
  hr: { companies: 178, rating: 4.7, savings: "R$ 20k" },
  customer_success: { companies: 156, rating: 4.8, savings: "R$ 18k" },
  data_analytics: { companies: 198, rating: 4.7, savings: "R$ 22k" },
  legal: { companies: 112, rating: 4.8, savings: "R$ 35k" },
  ecommerce: { companies: 289, rating: 4.8, savings: "R$ 25k" },
  influencer: { companies: 167, rating: 4.6, savings: "R$ 16k" },
  marketing_automation: { companies: 234, rating: 4.7, savings: "R$ 18k" },
  creative_design: { companies: 278, rating: 4.6, savings: "R$ 14k" },
  video_production: { companies: 198, rating: 4.7, savings: "R$ 16k" },
  seo_growth: { companies: 212, rating: 4.7, savings: "R$ 15k" },
  project_management: { companies: 156, rating: 4.6, savings: "R$ 12k" },
  supply_chain: { companies: 89, rating: 4.7, savings: "R$ 20k" },
  training: { companies: 134, rating: 4.6, savings: "R$ 10k" },
  concierge: { companies: 167, rating: 4.8, savings: "R$ 12k" },
  ceo: { companies: 78, rating: 4.9, savings: "R$ 50k" },
  startup_creator: { companies: 145, rating: 4.7, savings: "R$ 15k" },
};

// Capability badges per agent
const agentCapabilities: Record<string, string[]> = {
  voice_ai: ["🎙️ Voz", "📞 Telefonia", "🧠 NLP"],
  orchestrator: ["🤖 Multi-Agent", "⚡ Autonomous", "🔄 Workflow"],
  research: ["🔍 Deep Search", "📊 Analytics", "📄 Reports"],
  coding: ["💻 Full-Stack", "🖥️ Computer Use", "🚀 CI/CD"],
  omnichannel: ["💬 Omnichannel", "🧠 Memory", "🎯 95% Auto"],
  revenue: ["📈 Forecast", "💰 Billing", "🤖 ML"],
  sales: ["🎯 Pipeline", "📧 Outbound", "🤝 Closing"],
  rag: ["📚 RAG", "🔗 Cross-Ref", "📋 Compliance"],
  computer: ["🖥️ Computer Use", "🤖 RPA", "🏢 Legacy"],
  content: ["✍️ Content", "📱 Social", "📊 Analytics"],
  security: ["🛡️ SOC 24/7", "🔐 Zero Trust", "📋 LGPD"],
  hr: ["👥 Recruiting", "📈 Analytics", "🎓 Training"],
  customer_success: ["📊 Health Score", "🔄 Anti-Churn", "📈 NPS"],
  data_analytics: ["📊 BI", "🗣️ NL→SQL", "🔮 Predictive"],
  legal: ["⚖️ Contracts", "📋 Compliance", "🔍 Due Diligence"],
  ecommerce: ["🛒 Catalog", "💲 Dynamic Price", "📦 Logistics"],
  influencer: ["📣 Creators", "📊 ROI", "🤝 Management"],
  marketing_automation: ["🎯 Funnels", "📧 Nurturing", "📊 Lead Score"],
  creative_design: ["🎨 Design", "🖼️ Branding", "📱 Social Kit"],
  video_production: ["🎬 Reels", "📹 Shorts", "🖼️ Thumbnails"],
  seo_growth: ["🔍 SEO", "📈 Growth", "🔗 Link Building"],
  project_management: ["📋 Agile", "⏱️ Timeline", "📊 Reports"],
  supply_chain: ["📦 Inventory", "🚛 Routes", "📈 Forecast"],
  training: ["🎓 LMS", "🎮 Gamification", "📊 Skills"],
  concierge: ["📅 Agenda", "📧 E-mail", "⚡ +4h/dia"],
  ceo: ["👑 Strategy", "📊 Scenarios", "🎯 Decisions"],
  startup_creator: ["🚀 MVP", "📊 Validation", "💡 Pitch Deck"],
};

const tierColors: Record<string, string> = {
  intermediate: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  advanced: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  enterprise: "bg-primary/10 text-primary border-primary/20",
};

const tiers = ["all", "intermediate", "advanced", "enterprise"];

const LibraryPage = () => {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewAgent, setPreviewAgent] = useState<{ name: string; desc: string } | null>(null);
  const [hiringSlug, setHiringSlug] = useState<string | null>(null);
  const [activeFeatured, setActiveFeatured] = useState(0);
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "pt";
  const { user } = useAuth();
  const navigate = useNavigate();

  const filteredAgents = useMemo(() => agentKeys.filter((k) => {
    // Exclude featured from the grid
    if ((featuredKeys as readonly string[]).includes(k)) return false;
    if (filter !== "all" && agentTiers[k] !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = t(`library_page.agents.${k}_title`).toLowerCase();
      const desc = t(`library_page.agents.${k}_desc`).toLowerCase();
      const tags = agentTags[k].join(" ").toLowerCase();
      if (!title.includes(q) && !desc.includes(q) && !tags.includes(q)) return false;
    }
    return true;
  }), [filter, searchQuery, t]);

  const handleHire = async (key: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const slug = agentSlugs[key];
    setHiringSlug(slug);

    try {
      const { data: template, error: tplError } = await supabase
        .from("agent_templates")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (tplError || !template) {
        toast.error("Template não encontrado");
        return;
      }

      const tier = template.tier as "basic" | "intermediate" | "advanced" | "enterprise";
      const priceTier = agentPriceTiers[key];
      const priceInCents = getPrice(lang, priceTier) * 100;

      const { data: agent, error: agentError } = await supabase
        .from("agents")
        .insert({
          user_id: user.id,
          name: template.name,
          description: template.description,
          instructions: template.instructions,
          tier,
          monthly_price: priceInCents,
          status: "active",
          channels: template.default_channels,
          integrations: template.default_integrations,
          actions: template.default_actions,
        })
        .select()
        .single();

      if (agentError) throw agentError;

      toast.success(`${template.name} contratado com sucesso! 🎉`);
      navigate("/agents");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao contratar agente. Tente novamente.");
    } finally {
      setHiringSlug(null);
    }
  };

  // Featured hero agent data
  const featuredAgent = featuredKeys[activeFeatured];
  const featuredIcon = agentIcons[featuredAgent];
  const FeaturedIcon = featuredIcon;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      
      {/* ============ HERO SECTION — Featured Agents ============ */}
      <section className="relative">
        {/* Background glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Hero badge */}
          <div className="flex items-center justify-center mb-6">
            <Badge variant="outline" className="border-primary/20 text-primary/90 px-4 py-1.5 text-sm">
              <Flame className="h-3.5 w-3.5 mr-1.5" />
              {t("library_page.badge_count", { count: agentKeys.length })}
            </Badge>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-3 tracking-tight">
            {t("library_page.title")}
          </h1>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-10 text-base md:text-lg">
            {t("library_page.subtitle")}
          </p>

          {/* Featured agent — cinematic card */}
          <div className="relative max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={featuredAgent}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.5 }}
                className="relative rounded-3xl overflow-hidden"
              >
                {/* Cinematic gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-card to-primary-glow/10" />
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-primary-glow/8 rounded-full blur-[80px]" />
                
                {/* Scan line effect */}
                <div className="absolute inset-0 scan-line pointer-events-none" />
                
                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center">
                  {/* Left — Icon & Identity */}
                  <div className="flex-shrink-0 flex flex-col items-center md:items-start gap-4">
                    <motion.div 
                      className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center border border-primary/20 animate-pulse-glow"
                    >
                      <FeaturedIcon className="h-12 w-12 md:h-14 md:w-14 text-primary" />
                    </motion.div>
                    
                    {/* Social proof */}
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-1.5">
                        {[...Array(4)].map((_, j) => (
                          <div key={j} className="w-6 h-6 rounded-full bg-gradient-to-br from-muted to-card border-2 border-background" />
                        ))}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{agentSocialProof[featuredAgent].companies}+ empresas</p>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} className="h-2.5 w-2.5 fill-primary text-primary" />
                          ))}
                          <span className="text-[10px] text-muted-foreground ml-1">{agentSocialProof[featuredAgent].rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right — Content */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                      <Badge variant="outline" className={`${tierColors[agentTiers[featuredAgent]]} font-semibold`}>
                        {t(`tiers.${agentTiers[featuredAgent]}`)}
                      </Badge>
                      <span className="text-xs px-3 py-1 rounded-full bg-primary/15 text-primary font-semibold border border-primary/20">
                        {t(`library_page.agents.${featuredAgent}_highlight`)}
                      </span>
                    </div>

                    <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                      {t(`library_page.agents.${featuredAgent}_title`)}
                    </h2>
                    <p className="text-muted-foreground mb-5 leading-relaxed max-w-lg">
                      {t(`library_page.agents.${featuredAgent}_desc`)}
                    </p>

                    {/* Capability badges */}
                    <div className="flex flex-wrap gap-2 mb-5 justify-center md:justify-start">
                      {agentCapabilities[featuredAgent].map((cap) => (
                        <span key={cap} className="text-xs px-3 py-1.5 rounded-lg bg-card/80 border border-border text-foreground font-medium">
                          {cap}
                        </span>
                      ))}
                    </div>

                    {/* ROI & Stats row */}
                    <div className="flex items-center gap-6 mb-6 justify-center md:justify-start">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-400">{agentSocialProof[featuredAgent].savings}/mês</p>
                          <p className="text-[10px] text-muted-foreground">economia média</p>
                        </div>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{t(`library_page.agents.${featuredAgent}_replaces`)}</p>
                          <p className="text-[10px] text-muted-foreground">{t("library_page.replaces_label")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Price & CTAs */}
                    <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
                      <div>
                        <p className="font-display text-3xl font-bold gradient-text">
                          {getPriceDisplay(lang, agentPriceTiers[featuredAgent])}
                        </p>
                        <span className="text-xs text-muted-foreground">{t("library.per_month")}</span>
                      </div>
                      <Button
                        className="rounded-xl h-12 font-semibold bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 neon-glow gap-2"
                        disabled={hiringSlug === agentSlugs[featuredAgent]}
                        onClick={() => handleHire(featuredAgent)}
                      >
                        {hiringSlug === agentSlugs[featuredAgent] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            {t("library_page.hire_btn")}
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Featured selector pills */}
            <div className="flex items-center justify-center gap-3 mt-6">
              {featuredKeys.map((key, i) => {
                const Icon = agentIcons[key];
                const isActive = i === activeFeatured;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveFeatured(i)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-primary/15 border border-primary/30 text-foreground neon-glow"
                        : "bg-card/50 border border-border text-muted-foreground hover:text-foreground hover:border-primary/15"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                    <span className="text-xs font-medium hidden sm:inline">
                      {t(`library_page.agents.${key}_title`).split("—")[0].trim()}
                    </span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ============ FILTERS & SEARCH ============ */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Tier filters */}
          <div className="flex gap-2 flex-wrap">
            {tiers.map((tier) => (
              <Button
                key={tier}
                variant={filter === tier ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(tier)}
                className={`rounded-xl text-xs ${
                  filter === tier ? "neon-glow" : "border-border hover:border-primary/20"
                }`}
              >
                {tier === "all" ? t("library_page.all") : t(`tiers.${tier}`)}
              </Button>
            ))}
          </div>
          
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar agentes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass border-border h-10 rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* ============ ROI Calculator ============ */}
      <ROICalculator />

      {/* ============ Squad Consultant ============ */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <div className="glass-card rounded-2xl p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-60 h-60 bg-primary/5 rounded-full blur-[80px]" />
          <div className="relative z-10">
            <SquadConsultant />
          </div>
        </div>
      </motion.div>

      {/* ============ AGENT GRID — Cinematic Cards ============ */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold">Todos os Agentes</h2>
          <span className="text-xs text-muted-foreground">({filteredAgents.length})</span>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredAgents.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Nenhum agente encontrado para "{searchQuery}"
            </div>
          ) : filteredAgents.map((key, i) => {
            const tier = agentTiers[key];
            const Icon = agentIcons[key];
            const priceDisplay = getPriceDisplay(lang, agentPriceTiers[key]);
            const agentTitle = t(`library_page.agents.${key}_title`);
            const agentDesc = t(`library_page.agents.${key}_desc`);
            const highlight = t(`library_page.agents.${key}_highlight`);
            const replaces = t(`library_page.agents.${key}_replaces`);
            const social = agentSocialProof[key];
            const capabilities = agentCapabilities[key];
            const integrations = agentIntegrations[key];
            const isHiring = hiringSlug === agentSlugs[key];

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                layout
              >
                <div className="group relative h-full flex flex-col rounded-2xl border border-border/40 bg-card/30 backdrop-blur-md overflow-hidden transition-all duration-500 hover:border-primary/25 hover:shadow-[0_0_40px_-12px_hsl(var(--primary)/0.15)]">
                  {/* Top accent bar */}
                  <div className={`h-[2px] w-full ${
                    tier === "enterprise" 
                      ? "bg-gradient-to-r from-transparent via-primary to-transparent" 
                      : tier === "advanced"
                      ? "bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
                      : "bg-gradient-to-r from-transparent via-border to-transparent"
                  }`} />

                  <div className="p-6 flex flex-col flex-1">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 ${
                        tier === "enterprise" 
                          ? "bg-gradient-to-br from-primary/15 to-primary-glow/10 border border-primary/20 shadow-[0_0_20px_-6px_hsl(var(--primary)/0.3)]" 
                          : "bg-primary/5 border border-border/50"
                      }`}>
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-base leading-snug mb-1.5 line-clamp-1">{agentTitle}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${tierColors[tier]} text-[11px] py-0.5 px-2`}>
                            {t(`tiers.${tier}`)}
                          </Badge>
                          {highlight && (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold whitespace-nowrap">
                              {highlight}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-5">{agentDesc}</p>

                    {/* Capability pills */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {capabilities.slice(0, 3).map((cap) => (
                        <span key={cap} className="text-[11px] px-2.5 py-1 rounded-lg bg-card/80 border border-border/60 text-foreground/70 font-medium">
                          {cap}
                        </span>
                      ))}
                    </div>

                    {/* ROI & Social Proof */}
                    <div className="flex items-center justify-between mb-5 py-3.5 px-4 rounded-xl bg-background/40 border border-border/30">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-emerald-400">{social.savings}/mês</span>
                      </div>
                      <div className="w-px h-5 bg-border/50" />
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        <span className="text-sm font-medium">{social.rating}</span>
                      </div>
                      <div className="w-px h-5 bg-border/50" />
                      <span className="text-xs text-muted-foreground font-medium">{social.companies}+ empresas</span>
                    </div>

                    {/* Replaces */}
                    {replaces && (
                      <div className="flex items-center gap-2 mb-5">
                        <Users className="h-3.5 w-3.5 text-emerald-400/80" />
                        <span className="text-xs text-emerald-400/80 font-medium">
                          {t("library_page.replaces_label")} {replaces}
                        </span>
                      </div>
                    )}

                    {/* Integrations */}
                    <div className="mb-5 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {integrations.slice(0, 4).map((int) => (
                            <div
                              key={int}
                              className="w-7 h-7 rounded-lg bg-card border border-border/60 flex items-center justify-center text-[10px] font-bold text-muted-foreground"
                              title={int}
                            >
                              {int.charAt(0)}
                            </div>
                          ))}
                        </div>
                        {integrations.length > 4 && (
                          <span className="text-xs text-muted-foreground">+{integrations.length - 4}</span>
                        )}
                      </div>
                    </div>

                    {/* Price + CTA */}
                    <div className="pt-5 border-t border-border/30 mt-auto">
                      <div className="flex items-end justify-between mb-4">
                        <div>
                          <p className="font-display font-bold text-2xl gradient-text leading-none">{priceDisplay}</p>
                          <span className="text-xs text-muted-foreground mt-1 block">{t("library.per_month")}</span>
                        </div>
                      </div>
                      <Button
                        className={`w-full rounded-xl h-11 text-sm font-semibold gap-1.5 transition-all duration-300 ${
                          tier === "enterprise"
                            ? "bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 shadow-[0_0_20px_-6px_hsl(var(--primary)/0.4)]"
                            : "glow"
                        }`}
                        disabled={isHiring}
                        onClick={() => handleHire(key)}
                      >
                        {isHiring ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            {t("library_page.hire_btn")}
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

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
