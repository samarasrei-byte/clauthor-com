import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MessageSquare, FileText, DollarSign,
  Calendar, Receipt, Star, ShoppingCart, ArrowRight,
  Code, Brain, Shield, Mic, Bot, Eye, Workflow,
  Phone, Search, Users, Briefcase, BarChart3,
  Layers, Cpu, Sparkles, Globe, Rocket
} from "lucide-react";
import ROICalculator from "@/components/library/ROICalculator";
import AgentLivePreview from "@/components/library/AgentLivePreview";
import { getPriceDisplay, type PriceTier } from "@/lib/pricing";

// Agent keys map to i18n keys under library_page.agents.*
const agentKeys = [
  "voice_ai", "orchestrator", "research", "coding", "omnichannel",
  "revenue", "sales", "rag", "computer", "content", "security", "hr"
] as const;

const agentIcons: Record<string, React.ElementType> = {
  voice_ai: Phone, orchestrator: Workflow, research: Search, coding: Code,
  omnichannel: MessageSquare, revenue: BarChart3, sales: Briefcase,
  rag: Layers, computer: Cpu, content: Sparkles, security: Shield, hr: Users,
};

const agentTiers: Record<string, string> = {
  voice_ai: "enterprise", orchestrator: "enterprise", research: "advanced", coding: "enterprise",
  omnichannel: "advanced", revenue: "advanced", sales: "advanced",
  rag: "intermediate", computer: "enterprise", content: "intermediate", security: "enterprise", hr: "advanced",
};

const agentPriceTiers: Record<string, PriceTier> = {
  voice_ai: "premium", orchestrator: "premium", research: "mid", coding: "high",
  omnichannel: "mid", revenue: "mid", sales: "mid",
  rag: "entry", computer: "high", content: "entry", security: "premium", hr: "mid",
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
};

const tierColors: Record<string, string> = {
  intermediate: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  advanced: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  enterprise: "bg-primary/10 text-primary border-primary/20",
};

const tiers = ["all", "intermediate", "advanced", "enterprise"];

const LibraryPage = () => {
  const [filter, setFilter] = useState("all");
  const [previewAgent, setPreviewAgent] = useState<{ name: string; desc: string } | null>(null);
  const [expandedActions, setExpandedActions] = useState<string | null>(null);
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "pt";

  const filteredAgents = filter === "all"
    ? agentKeys
    : agentKeys.filter(k => agentTiers[k] === filter);

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
            {t("library_page.badge_count", { count: agentKeys.length })}
          </Badge>
          <h1 className="font-display text-3xl font-bold mb-2">{t("library_page.title")}</h1>
          <p className="text-muted-foreground max-w-xl">{t("library_page.subtitle")}</p>
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
                filter === tier ? "glow" : "border-border hover:border-primary/20"
              }`}
            >
              {tier === "all" ? t("library_page.all") : t(`tiers.${tier}`)}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* ROI Calculator */}
      <ROICalculator />

      {/* Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredAgents.map((key, i) => {
          const tier = agentTiers[key];
          const Icon = agentIcons[key];
          const priceDisplay = getPriceDisplay(lang, agentPriceTiers[key]);
          const agentTitle = t(`library_page.agents.${key}_title`);
          const agentDesc = t(`library_page.agents.${key}_desc`);
          const highlight = t(`library_page.agents.${key}_highlight`);
          const replaces = t(`library_page.agents.${key}_replaces`);
          const tags = agentTags[key];
          const integrations = agentIntegrations[key];

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              layout
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="glass-card rounded-2xl p-6 glass-hover h-full flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {tier === "enterprise" && (
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-[60px]" />
                )}

                {highlight && (
                  <div className="absolute top-4 right-4 z-20">
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-primary/15 text-primary font-semibold border border-primary/20 backdrop-blur-sm">
                      {highlight}
                    </span>
                  </div>
                )}
                
                {/* Header */}
                <div className="flex items-start gap-4 mb-5 relative z-10 pr-24">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    tier === "enterprise" 
                       ? "bg-gradient-to-br from-primary/20 to-primary-glow/20" 
                       : tier === "advanced"
                       ? "bg-gradient-to-br from-cyan-500/10 to-primary/10"
                      : "bg-primary/5"
                  }`}>
                    <Icon className="h-7 w-7 text-primary/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-lg leading-tight mb-1">{agentTitle}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{agentDesc}</p>
                  </div>
                </div>

                {/* Replaces badge */}
                {replaces && (
                  <div className="mb-4 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <Users className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-400">
                        {t("library_page.replaces_label")} {replaces}
                      </span>
                    </div>
                  </div>
                )}

                {/* Price & Tier */}
                <div className="flex items-center justify-between mb-5 pb-5 border-b border-border relative z-10">
                  <Badge variant="outline" className={`${tierColors[tier]} font-medium`}>
                    {t(`tiers.${tier}`)}
                  </Badge>
                  <div className="text-right">
                    <p className="font-display font-bold text-2xl gradient-text">
                      {priceDisplay}
                    </p>
                    <span className="text-xs text-muted-foreground">{t("library.per_month")}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
                  {tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="text-xs px-2.5 py-1 rounded-lg bg-card text-muted-foreground border border-border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Integrations preview */}
                <div className="mb-5 flex-1 relative z-10">
                  <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-widest">
                    {t("library_page.integrations_label")}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {integrations.slice(0, 3).map((integration) => (
                        <div 
                          key={integration}
                          className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground"
                          title={integration}
                        >
                          {integration.charAt(0)}
                        </div>
                      ))}
                    </div>
                    {integrations.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{integrations.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div className="flex gap-2 relative z-10">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-12 border-border hover:border-primary/20"
                    onClick={() => setPreviewAgent({ name: agentTitle, desc: agentDesc })}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {t("library_page.test_btn")}
                  </Button>
                  <Link to="/auth" className="flex-1">
                    <Button className={`w-full rounded-xl group h-12 font-semibold ${
                      tier === "enterprise" 
                        ? "bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90" 
                        : "glow"
                    }`}>
                      {t("library_page.hire_btn")}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
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
