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
import ReputationBadge from "@/components/library/ReputationBadge";
import SquadConsultant from "@/components/pricing/SquadConsultant";
import AgentLivePreview from "@/components/library/AgentLivePreview";
import SmartAgentFinder from "@/components/library/SmartAgentFinder";
import AgentMiniChat from "@/components/library/AgentMiniChat";
import DepartmentMiniChat from "@/components/pricing/DepartmentMiniChat";
import DepartmentFAQ from "@/components/pricing/DepartmentFAQ";
import { getPriceDisplay, getPrice, type PriceTier, getRegion, formatPrice } from "@/lib/pricing";
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
  "concierge", "ceo", "startup_creator", "paid_traffic",
  "influencer_liveshop", "podcast_manager", "affiliate_manager", "community_mgr",
  "whatsapp_commerce", "ai_cfo", "scheduler", "reputation", "proposal_gen"
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
  paid_traffic: "paid-traffic-manager",
  influencer_liveshop: "influencer-liveshop",
  podcast_manager: "podcast-manager",
  affiliate_manager: "affiliate-manager",
  community_mgr: "community-manager",
  whatsapp_commerce: "whatsapp-commerce",
  ai_cfo: "ai-cfo",
  scheduler: "appointment-scheduler",
  reputation: "reputation-manager",
  proposal_gen: "proposal-generator",
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
  paid_traffic: Target,
  influencer_liveshop: Play,
  podcast_manager: Mic,
  affiliate_manager: TrendingUp,
  community_mgr: Users,
  whatsapp_commerce: ShoppingCart,
  ai_cfo: DollarSign,
  scheduler: Calendar,
  reputation: Award,
  proposal_gen: FileText,
};

const agentTiers: Record<string, string> = {
  voice_ai: "enterprise", orchestrator: "enterprise", research: "advanced", coding: "enterprise",
  omnichannel: "advanced", revenue: "advanced", sales: "advanced",
  rag: "intermediate", computer: "enterprise", content: "intermediate", security: "enterprise", hr: "advanced",
  customer_success: "advanced", data_analytics: "advanced", legal: "enterprise", ecommerce: "advanced",
  influencer: "advanced", marketing_automation: "advanced", creative_design: "basic",
  video_production: "advanced", seo_growth: "advanced", project_management: "basic",
  supply_chain: "advanced", training: "basic",
  concierge: "advanced", ceo: "enterprise", startup_creator: "advanced",
  paid_traffic: "advanced",
  influencer_liveshop: "advanced",
  podcast_manager: "advanced",
  affiliate_manager: "advanced",
  community_mgr: "basic",
  whatsapp_commerce: "advanced",
  ai_cfo: "enterprise",
  scheduler: "basic",
  reputation: "basic",
  proposal_gen: "basic",
};

const agentPriceTiers: Record<string, PriceTier> = {
  voice_ai: "premium", orchestrator: "premium", research: "mid", coding: "high",
  omnichannel: "mid", revenue: "mid", sales: "mid",
  rag: "entry", computer: "high", content: "entry", security: "premium", hr: "mid",
  customer_success: "mid", data_analytics: "mid", legal: "high", ecommerce: "mid",
  influencer: "mid", marketing_automation: "mid", creative_design: "starter",
  video_production: "mid", seo_growth: "mid", project_management: "starter",
  supply_chain: "mid", training: "starter",
  concierge: "mid", ceo: "premium", startup_creator: "mid",
  paid_traffic: "mid",
  influencer_liveshop: "mid",
  podcast_manager: "mid",
  affiliate_manager: "mid",
  community_mgr: "starter",
  whatsapp_commerce: "mid",
  ai_cfo: "premium",
  scheduler: "starter",
  reputation: "starter",
  proposal_gen: "starter",
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
  paid_traffic: ["Meta Ads", "Google Ads", "TikTok Ads", "Landing Page", "ROAS", "CPA"],
  influencer_liveshop: ["Live Commerce", "Influencers", "Conversão", "TikTok Shop", "Shopee Live"],
  podcast_manager: ["Podcast", "Roteiro", "Áudio", "SEO", "Distribuição"],
  affiliate_manager: ["Afiliados", "Funil", "Comissão", "Hotmart", "Performance"],
  community_mgr: ["Comunidade", "Moderação", "Engajamento", "Discord", "Telegram"],
  whatsapp_commerce: ["WhatsApp", "E-commerce", "Carrinho", "PIX", "Catálogo"],
  ai_cfo: ["DRE", "Fluxo de Caixa", "Tributário", "Conciliação", "Valuation"],
  scheduler: ["Agendamento", "WhatsApp", "No-show", "Clínica", "Salão"],
  reputation: ["Reviews", "Reclame Aqui", "Google Reviews", "Crise", "NPS"],
  proposal_gen: ["Proposta", "PDF", "Pricing", "Follow-up", "Assinatura"],
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
  paid_traffic: ["Meta Business Suite", "Google Ads API", "TikTok Ads Manager", "GA4", "GTM", "Hotjar"],
  influencer_liveshop: ["TikTok Shop", "Shopee Live", "Instagram Live", "OBS Studio", "Stripe"],
  podcast_manager: ["Spotify", "Apple Podcasts", "Descript", "Riverside", "Buzzsprout"],
  affiliate_manager: ["Hotmart", "Eduzz", "Monetizze", "ClickBank", "Impact"],
  community_mgr: ["Discord", "Telegram", "Slack", "Circle", "Mighty Networks"],
  whatsapp_commerce: ["WhatsApp Business API", "Stripe", "Mercado Pago", "Shopify", "Bling"],
  ai_cfo: ["Conta Azul", "Omie", "Nibo", "Bling ERP", "Power BI"],
  scheduler: ["Google Calendar", "Calendly", "WhatsApp API", "iClinic", "Trinks"],
  reputation: ["Google Business", "Reclame Aqui", "Trustpilot", "Hootsuite", "Sprinklr"],
  proposal_gen: ["DocuSign", "PandaDoc", "HubSpot", "Google Docs", "Canva"],
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
  paid_traffic: { companies: 312, rating: 4.9, savings: "R$ 28k" },
  influencer_liveshop: { companies: 198, rating: 4.8, savings: "R$ 22k" },
  podcast_manager: { companies: 134, rating: 4.7, savings: "R$ 14k" },
  affiliate_manager: { companies: 178, rating: 4.7, savings: "R$ 18k" },
  community_mgr: { companies: 212, rating: 4.6, savings: "R$ 10k" },
  whatsapp_commerce: { companies: 456, rating: 4.9, savings: "R$ 25k" },
  ai_cfo: { companies: 89, rating: 4.9, savings: "R$ 55k" },
  scheduler: { companies: 534, rating: 4.8, savings: "R$ 8k" },
  reputation: { companies: 267, rating: 4.8, savings: "R$ 15k" },
  proposal_gen: { companies: 312, rating: 4.7, savings: "R$ 18k" },
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
  paid_traffic: ["🎯 Meta Ads", "📊 ROAS", "🔥 Criativos"],
  influencer_liveshop: ["🎥 Live Commerce", "📣 Influencers", "💰 Conversão"],
  podcast_manager: ["🎙️ Roteiro", "🎧 Edição", "📈 Growth"],
  affiliate_manager: ["💰 Afiliados", "🎯 Funis", "📊 Performance"],
  community_mgr: ["👥 Moderação", "💬 Engajamento", "🛡️ Anti-Crise"],
  whatsapp_commerce: ["🛒 Carrinho", "💳 PIX in-chat", "📦 Catálogo"],
  ai_cfo: ["📊 DRE", "💰 Cash Flow", "📈 Valuation"],
  scheduler: ["📅 Agenda", "📲 WhatsApp", "🔔 Lembretes"],
  reputation: ["⭐ Reviews", "🛡️ Anti-Crise", "📊 Sentimento"],
  proposal_gen: ["📄 PDF Pro", "💲 Pricing", "✍️ Assinatura"],
};

const tierColors: Record<string, string> = {
  basic: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  intermediate: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  advanced: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  enterprise: "bg-primary/10 text-primary border-primary/20",
};

const tiers = ["all", "basic", "intermediate", "advanced", "enterprise"];

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
          // Use system_prompt (full professional prompt) as instructions, 
          // fallback to instructions field if system_prompt is empty
          instructions: template.system_prompt || template.instructions,
          objective: template.description,
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

      // Run audit & register with OpenClaw
      toast.info("Executando auditoria do agente...", { duration: 2000 });

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        const registerResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openclaw-register`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ agentId: agent.id }),
          }
        );

        const registerData = await registerResponse.json();

        if (!registerResponse.ok) {
          console.error("OpenClaw register error:", registerData);
          if (registerResponse.status === 422) {
            toast.warning(`Auditoria: ${registerData.issues?.join(", ") || "Verifique as configurações do agente"}`, { duration: 5000 });
          } else {
            toast.warning("Agente contratado, mas registro no OpenClaw pendente.", { duration: 4000 });
          }
        } else {
          toast.success(`${template.name} contratado e registrado! 🚀`, { duration: 3000 });
        }
      } catch (openclawErr) {
        console.error("OpenClaw registration failed:", openclawErr);
        toast.warning("Agente contratado! Registro OpenClaw será feito em breve.", { duration: 3000 });
      }

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

      {/* ============ AI CONCIERGE — Smart Agent Finder ============ */}
      <SmartAgentFinder
        agentMeta={Object.fromEntries(
          agentKeys.map((k) => [k, {
            icon: agentIcons[k],
            tier: agentTiers[k],
            socialProof: agentSocialProof[k],
            capabilities: agentCapabilities[k] || [],
            slug: agentSlugs[k],
          }])
        )}
        onHire={(key) => handleHire(key)}
        onPreview={(key) => setPreviewAgent({
          name: t(`library_page.agents.${key}_title`),
          desc: t(`library_page.agents.${key}_desc`),
        })}
        hiringSlug={hiringSlug}
      />

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
                        className="rounded-xl h-12 font-semibold glass-btn-primary text-primary-foreground gap-2"
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

      {/* ============ DEPARTMENTS — Rich Experience Cards ============ */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <h2 className="text-lg font-bold tracking-tight">
            Times de IA · Departamentos
          </h2>
          <div className="flex-1 h-px bg-border/30" />
          <Badge variant="outline" className="text-xs border-primary/20 text-primary/70">
            4 agentes orquestrados cada
          </Badge>
        </div>
        
        <div className="grid md:grid-cols-2 gap-5">
          {(["comercial", "tecnologia", "marketing", "suporte", "financeiro", "criacao", "rh"] as const).map((deptId, i) => {
            const regionData = getRegion(lang);
            const deptPrice = (regionData.departments as Record<string, number>)[deptId] ?? 0;
            const deptClt = (regionData.departmentClt as Record<string, number>)[deptId] ?? 0;
            const savingsPercent = deptClt > 0 ? Math.round((1 - deptPrice / deptClt) * 100) : 0;
            const deptName = t(`squads.dept_${deptId}`);
            const deptDesc = t(`squads.dept_${deptId}_desc`);

            // Department-specific data
            const deptDetails: Record<string, { icon: React.ElementType; agents: string[]; replaces: string[]; faq: { q: string; a: string }[] }> = {
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

            const dept = deptDetails[deptId];
            if (!dept) return null;
            const DeptIcon = dept.icon;

            return (
              <motion.div
                key={deptId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="group relative h-full flex flex-col rounded-2xl overflow-hidden ring-1 ring-border/50 hover:ring-primary/30 bg-card/30 hover:bg-card/60 transition-all duration-500 hover:translate-y-[-2px]">
                  {/* Gradient accent top */}
                  <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

                  <div className="relative p-6 flex flex-col flex-1">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.15)]">
                        <DeptIcon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base leading-tight mb-1">{deptName}</h3>
                        <p className="text-[12px] text-muted-foreground/60 leading-relaxed">{deptDesc}</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg shrink-0">
                        -{savingsPercent}% vs CLT
                      </span>
                    </div>

                    {/* 4 Agents roster */}
                    <div className="mb-4">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 font-semibold mb-2 block">Agentes do time</span>
                      <div className="grid grid-cols-2 gap-2">
                        {dept.agents.map((agent, j) => (
                          <div key={agent} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/20 ring-1 ring-border/30">
                            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                              <Bot className="h-3 w-3 text-primary/60" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] font-medium block leading-tight truncate">{agent}</span>
                              <span className="text-[9px] text-muted-foreground/40">Substitui: {dept.replaces[j]}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Live orchestration mini-chat */}
                    <DepartmentMiniChat departmentId={deptId} autoPlay compact />

                    {/* FAQ accordion */}
                    <div className="mt-4 space-y-1">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 font-semibold mb-1.5 block">Dúvidas frequentes</span>
                      {dept.faq.map((item, idx) => (
                        <details key={idx} className="group/faq rounded-lg ring-1 ring-border/20 overflow-hidden">
                          <summary className="px-3 py-2 text-[11px] font-medium cursor-pointer hover:bg-muted/20 transition-colors flex items-center justify-between list-none">
                            <span>{item.q}</span>
                            <ChevronRight className="h-3 w-3 text-muted-foreground/30 transition-transform group-open/faq:rotate-90" />
                          </summary>
                          <div className="px-3 pb-2.5 pt-0.5 text-[11px] text-muted-foreground/60 leading-relaxed">
                            {item.a}
                          </div>
                        </details>
                      ))}
                    </div>

                    <div className="flex-1" />

                    {/* Footer — Price + CTA */}
                    <div className="pt-4 mt-4">
                      <div className="h-px w-full bg-border/30 mb-4" />
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <p className="font-bold text-xl tracking-tight">{formatPrice(deptPrice, lang)}</p>
                            <span className="text-xs text-muted-foreground/40">/mês</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <TrendingUp className="h-3 w-3 text-emerald-400" />
                            <span className="text-[11px] text-emerald-400 font-medium">vs {formatPrice(deptClt, lang)}/mês CLT</span>
                          </div>
                        </div>
                        <Link to="/pricing">
                          <Button size="sm" className="h-10 px-5 rounded-xl text-xs font-bold uppercase tracking-wider gap-1.5">
                            <Flame className="h-3.5 w-3.5" />
                            Contratar Time
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ============ VISUAL SEPARATOR ============ */}
      <div className="relative py-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-6 text-[10px] tracking-[0.3em] uppercase text-primary/50 font-semibold flex items-center gap-2">
            <Bot className="h-3.5 w-3.5" />
            Agentes Individuais · Avulsos
            <Bot className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      {/* ============ AGENT GRID — Premium Marketplace Cards ============ */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg font-bold tracking-tight">
            {filteredAgents.length} Agentes Disponíveis
          </h2>
          <div className="flex-1" />
          <Badge variant="outline" className="text-xs border-primary/20 text-primary/70">
            Contratação individual
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {filteredAgents.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <p className="text-sm text-muted-foreground/50">Nenhum agente encontrado</p>
            </div>
          ) : filteredAgents.map((key, i) => {
            const tier = agentTiers[key];
            const Icon = agentIcons[key];
            const priceDisplay = getPriceDisplay(lang, agentPriceTiers[key]);
            const agentTitle = t(`library_page.agents.${key}_title`);
            const agentDesc = t(`library_page.agents.${key}_desc`);
            const social = agentSocialProof[key];
            const capabilities = agentCapabilities[key];
            const tags = agentTags[key] || [];
            const integrations = agentIntegrations[key] || [];
            const isHiring = hiringSlug === agentSlugs[key];

            // Quick FAQ from agentLandingData if available
            const agentFaq = [
              { q: `O que o ${agentTitle.split("—")[0].trim()} faz?`, a: agentDesc },
              { q: "Precisa de configuração?", a: "Setup em 3 minutos. O agente já vem pré-configurado com as melhores práticas do mercado." },
              { q: "Posso cancelar a qualquer momento?", a: "Sim. Sem fidelidade, sem multa. Cancele quando quiser." },
            ];

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.015 }}
                layout
              >
                <div className={`group relative h-full flex flex-col rounded-2xl overflow-hidden transition-all duration-500 hover:translate-y-[-2px] ${
                  tier === "enterprise" 
                    ? "ring-1 ring-primary/30 hover:ring-primary/50 shadow-[0_0_60px_-20px_hsl(var(--primary)/0.15)] bg-gradient-to-br from-primary/[0.04] to-transparent" 
                    : "ring-1 ring-border/50 hover:ring-primary/25 bg-card/30 hover:bg-card/60"
                }`}>
                  {tier === "enterprise" && (
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/[0.06] rounded-full blur-[60px] pointer-events-none" />
                  )}

                  <div className="relative p-6 flex flex-col flex-1">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                        tier === "enterprise" 
                          ? "bg-primary/15 border border-primary/25 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.2)]" 
                          : tier === "advanced"
                            ? "bg-cyan-500/10 border border-cyan-500/15"
                            : "bg-muted/50 border border-border group-hover:border-primary/20 group-hover:bg-primary/[0.05]"
                      }`}>
                        <Icon className={`h-6 w-6 transition-colors duration-500 ${
                          tier === "enterprise" ? "text-primary" 
                          : tier === "advanced" ? "text-cyan-400"
                          : "text-muted-foreground group-hover:text-primary/70"
                        }`} strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base leading-tight mb-1">{agentTitle}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 ${tierColors[tier]}`}>
                            {t(`tiers.${tier}`)}
                          </Badge>
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-primary/50 text-primary/50" />
                            <span className="text-[11px] text-muted-foreground/60 font-medium">{social.rating}</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground/40">{social.companies}+ empresas</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[13px] text-muted-foreground/70 leading-relaxed mb-4">{agentDesc}</p>

                    {/* Capabilities */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {capabilities.map((cap) => (
                        <span key={cap} className="text-[10px] px-2 py-1 rounded-md bg-muted/30 ring-1 ring-border/40 text-foreground/60 font-medium">
                          {cap}
                        </span>
                      ))}
                    </div>

                    {/* Tags + Integrations */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {tags.slice(0, 5).map((tag) => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/[0.04] text-primary/50 ring-1 ring-primary/[0.08]">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 mb-4">
                      <span className="text-[9px] text-muted-foreground/30 uppercase tracking-wider font-medium shrink-0">Integra:</span>
                      <div className="flex flex-wrap gap-1">
                        {integrations.slice(0, 4).map((intg) => (
                          <span key={intg} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/20 text-muted-foreground/50">
                            {intg}
                          </span>
                        ))}
                        {integrations.length > 4 && (
                          <span className="text-[9px] text-muted-foreground/30">+{integrations.length - 4}</span>
                        )}
                      </div>
                    </div>

                    {/* Mini Chat Demo */}
                    <AgentMiniChat agentKey={key} agentName={agentTitle} />

                    {/* FAQ section */}
                    <div className="mt-4 space-y-1">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 font-semibold mb-1.5 block">Dúvidas frequentes</span>
                      {agentFaq.map((item, idx) => (
                        <details key={idx} className="group/faq rounded-lg ring-1 ring-border/20 overflow-hidden">
                          <summary className="px-3 py-2 text-[11px] font-medium cursor-pointer hover:bg-muted/20 transition-colors flex items-center justify-between list-none">
                            <span>{item.q}</span>
                            <ChevronRight className="h-3 w-3 text-muted-foreground/30 transition-transform group-open/faq:rotate-90" />
                          </summary>
                          <div className="px-3 pb-2.5 pt-0.5 text-[11px] text-muted-foreground/60 leading-relaxed">
                            {item.a}
                          </div>
                        </details>
                      ))}
                    </div>

                    <div className="flex-1" />

                    {/* Footer */}
                    <div className="pt-4 mt-4">
                      <div className="h-px w-full bg-border/30 mb-4" />
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <p className="font-bold text-xl tracking-tight">{priceDisplay}</p>
                            <span className="text-xs text-muted-foreground/40">{t("library.per_month")}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <TrendingUp className="h-3 w-3 text-emerald-400" />
                            <span className="text-[11px] text-emerald-400 font-medium">Economia de {social.savings}/mês</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/agente/${agentSlugs[key]}`}>
                            <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl border-border/50 hover:border-primary/30 text-xs gap-1.5">
                              <Eye className="h-3.5 w-3.5" />
                              Detalhes
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            className="h-10 px-5 rounded-xl text-xs font-bold uppercase tracking-wider gap-1.5"
                            disabled={isHiring}
                            onClick={() => handleHire(key)}
                          >
                            {isHiring ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <Zap className="h-3.5 w-3.5" />
                                Contratar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
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
