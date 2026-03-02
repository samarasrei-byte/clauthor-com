import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Package, Wrench, Building2, ArrowRight, Check,
  Phone, MessageSquare, Briefcase, BarChart3, Star, FileText,
  ShoppingCart, Shield, Sparkles, Plus, Flame, ChevronLeft,
  Megaphone, Target, Palette, Video, Globe, ClipboardList, Truck, GraduationCap, Bot
} from "lucide-react";
import { useTranslation } from "react-i18next";
import SquadConsultant from "./SquadConsultant";
import DepartmentMiniChat from "./DepartmentMiniChat";
import DepartmentFAQ from "./DepartmentFAQ";
import { getRegion, formatPrice } from "@/lib/pricing";

const squadPacks = [
  { id: "squad-3", agents: 3, discount: 10, icon: Users, recommended: false },
  { id: "squad-5", agents: 5, discount: 20, icon: Package, recommended: true },
  { id: "squad-10", agents: 10, discount: 35, icon: Building2, recommended: false },
];

const departments = [
  { 
    id: "tecnologia", icon: Wrench, color: "text-blue-400", 
    gradient: "from-blue-500/20 to-blue-500/5",
    borderActive: "border-blue-500/40",
    iconBg: "bg-blue-500/20",
    popular: false,
    tokens: "12M",
    actions: "15.000",
    agents: [
      { key: "coding", icon: Wrench, role: "Dev Full-Stack Sênior", tokens: "4M" },
      { key: "computer", icon: Building2, role: "DevOps / SRE", tokens: "3M" },
      { key: "project_management", icon: ClipboardList, role: "Gerente de Projetos", tokens: "2M" },
      { key: "security", icon: Shield, role: "CISO / Eng. Segurança", tokens: "3M" },
    ],
    headcount: 4, cltCost: 72000, prometheusCost: 4497, discount: 30,
  },
  { 
    id: "comercial", icon: Briefcase, color: "text-cyan-400", 
    gradient: "from-cyan-500/20 to-cyan-500/5",
    borderActive: "border-cyan-500/40",
    iconBg: "bg-cyan-500/20",
    popular: true,
    tokens: "8M",
    actions: "12.000",
    agents: [
      { key: "sales", icon: Briefcase, role: "SDR / Closer de Vendas", tokens: "2.5M" },
      { key: "customer_success", icon: Star, role: "Customer Success Manager", tokens: "1.5M" },
      { key: "sales_channel", icon: MessageSquare, role: "Canal de Vendas Multicanal", tokens: "2M" },
      { key: "voice_ai", icon: Phone, role: "Operador de Telefonia", tokens: "2M" },
    ],
    headcount: 4, cltCost: 52000, prometheusCost: 3497, discount: 25,
  },
  { 
    id: "marketing", icon: Megaphone, color: "text-primary", 
    gradient: "from-primary/20 to-primary/5",
    borderActive: "border-primary/40",
    iconBg: "bg-primary/20",
    popular: false,
    tokens: "7M",
    actions: "10.000",
    agents: [
      { key: "content", icon: Sparkles, role: "Copywriter Sênior", tokens: "2M" },
      { key: "marketing_automation", icon: Target, role: "Growth / Automação", tokens: "2M" },
      { key: "seo_growth", icon: Globe, role: "Analista SEO / Tráfego", tokens: "1.5M" },
      { key: "influencer", icon: Megaphone, role: "Social Media Manager", tokens: "1.5M" },
    ],
    headcount: 4, cltCost: 44000, prometheusCost: 2697, discount: 25,
  },
  { 
    id: "financeiro", icon: BarChart3, color: "text-amber-400", 
    gradient: "from-amber-500/20 to-amber-500/5",
    borderActive: "border-amber-500/40",
    iconBg: "bg-amber-500/20",
    popular: false,
    tokens: "6M",
    actions: "8.000",
    agents: [
      { key: "revenue", icon: BarChart3, role: "CFO / Controller", tokens: "2M" },
      { key: "legal", icon: FileText, role: "Analista Fiscal / Jurídico", tokens: "1.5M" },
      { key: "data_analytics", icon: BarChart3, role: "Analista de BI", tokens: "1.5M" },
      { key: "ecommerce", icon: ShoppingCart, role: "Gestor Financeiro", tokens: "1M" },
    ],
    headcount: 4, cltCost: 48000, prometheusCost: 2497, discount: 20,
  },
  { 
    id: "criacao", icon: Palette, color: "text-violet-400", 
    gradient: "from-violet-500/20 to-violet-500/5",
    borderActive: "border-violet-500/40",
    iconBg: "bg-violet-500/20",
    popular: false,
    tokens: "6M",
    actions: "8.000",
    agents: [
      { key: "creative_design", icon: Palette, role: "Designer Gráfico Sênior", tokens: "2M" },
      { key: "video_production", icon: Video, role: "Editor de Vídeo / Motion", tokens: "2M" },
      { key: "creative_writer", icon: Sparkles, role: "Redator Criativo", tokens: "1M" },
      { key: "content_producer", icon: Megaphone, role: "Produtor de Conteúdo", tokens: "1M" },
    ],
    headcount: 4, cltCost: 36000, prometheusCost: 2197, discount: 20,
  },
  { 
    id: "suporte", icon: MessageSquare, color: "text-emerald-400", 
    gradient: "from-emerald-500/20 to-emerald-500/5",
    borderActive: "border-emerald-500/40",
    iconBg: "bg-emerald-500/20",
    popular: false,
    tokens: "5M",
    actions: "10.000",
    agents: [
      { key: "support_channel", icon: MessageSquare, role: "Atendente N1 / N2", tokens: "1.5M" },
      { key: "support_lead", icon: Star, role: "Líder de Suporte", tokens: "1.5M" },
      { key: "voice_support", icon: Phone, role: "Operador Call Center", tokens: "1M" },
      { key: "rag", icon: FileText, role: "Base de Conhecimento", tokens: "1M" },
    ],
    headcount: 4, cltCost: 32000, prometheusCost: 1797, discount: 20,
  },
  { 
    id: "rh", icon: GraduationCap, color: "text-pink-400", 
    gradient: "from-pink-500/20 to-pink-500/5",
    borderActive: "border-pink-500/40",
    iconBg: "bg-pink-500/20",
    popular: false,
    tokens: "4M",
    actions: "6.000",
    agents: [
      { key: "hr", icon: Star, role: "Recrutador / BP", tokens: "1.5M" },
      { key: "training", icon: GraduationCap, role: "T&D / Onboarding", tokens: "1M" },
      { key: "people_analytics", icon: BarChart3, role: "People Analytics", tokens: "1M" },
      { key: "data_analytics", icon: BarChart3, role: "Analista de Dados RH", tokens: "0.5M" },
    ],
    headcount: 4, cltCost: 28000, prometheusCost: 1497, discount: 15,
  },
];

const availableAgents = [
  { key: "voice_ai", icon: Phone },
  { key: "sales_channel", icon: MessageSquare },
  { key: "sales", icon: Briefcase },
  { key: "revenue", icon: BarChart3 },
  { key: "customer_success", icon: Star },
  { key: "content", icon: Sparkles },
  { key: "data_analytics", icon: BarChart3 },
  { key: "legal", icon: FileText },
  { key: "security", icon: Shield },
  { key: "ecommerce", icon: ShoppingCart },
  { key: "research", icon: Sparkles },
  { key: "rag", icon: FileText },
  { key: "orchestrator", icon: Users },
  { key: "coding", icon: Wrench },
  { key: "computer", icon: Building2 },
  { key: "hr", icon: Star },
  { key: "influencer", icon: Megaphone },
  { key: "marketing_automation", icon: Target },
  { key: "creative_design", icon: Palette },
  { key: "video_production", icon: Video },
  { key: "seo_growth", icon: Globe },
  { key: "project_management", icon: ClipboardList },
  { key: "supply_chain", icon: Truck },
  { key: "training", icon: GraduationCap },
  { key: "creative_writer", icon: Sparkles },
  { key: "content_producer", icon: Megaphone },
  { key: "support_channel", icon: MessageSquare },
  { key: "support_lead", icon: Star },
  { key: "voice_support", icon: Phone },
  { key: "people_analytics", icon: BarChart3 },
];

function getTeamDiscount(count: number): number {
  if (count >= 10) return 35;
  if (count >= 7) return 30;
  if (count >= 5) return 20;
  if (count >= 3) return 10;
  return 0;
}

interface ActiveSquad {
  packId: string;
  maxAgents: number;
  discount: number;
}

function AgentSelectionGrid({
  selectedAgents,
  toggleAgent,
  maxAgents,
  t,
}: {
  selectedAgents: string[];
  toggleAgent: (key: string) => void;
  maxAgents?: number;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {availableAgents.map((agent) => {
        const isSelected = selectedAgents.includes(agent.key);
        const isDisabled = !isSelected && maxAgents !== undefined && selectedAgents.length >= maxAgents;
        const Icon = agent.icon;
        return (
          <motion.div
            key={agent.key}
            whileTap={{ scale: 0.97 }}
            className={`rounded-2xl border p-6 transition-all ${
              isDisabled
                ? "border-border bg-card/10 opacity-40 cursor-not-allowed"
                : isSelected
                ? "border-primary bg-primary/5 cursor-pointer"
                : "border-border bg-card/30 hover:border-primary/30 cursor-pointer"
            }`}
            onClick={() => !isDisabled && toggleAgent(agent.key)}
          >
            <div className="flex items-start gap-4 mb-3">
              <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold leading-tight block mb-1">
                  {t(`library_page.agents.${agent.key}_title`)}
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {t(`library_page.agents.${agent.key}_desc`)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground">
                {t(`library_page.agents.${agent.key}_replaces`)}
              </span>
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                }`}
              >
                {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function SquadPlans() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const region = getRegion(lang);
  const fp = (amount: number) => formatPrice(amount, lang);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [activeSquad, setActiveSquad] = useState<ActiveSquad | null>(null);
  const [squadSelectedAgents, setSquadSelectedAgents] = useState<string[]>([]);

  const toggleAgent = (key: string) => {
    setSelectedAgents((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleSquadAgent = (key: string) => {
    setSquadSelectedAgents((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectSquad = (pack: typeof squadPacks[0]) => {
    setActiveSquad({ packId: pack.id, maxAgents: pack.agents, discount: pack.discount });
    setSquadSelectedAgents([]);
  };

  const teamDiscount = getTeamDiscount(selectedAgents.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card rounded-2xl p-8 md:p-12 mb-16 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-60 h-60 bg-primary/5 rounded-full blur-[80px]" />
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-cyan-500/5 rounded-full blur-[60px]" />

      <div className="relative z-10">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4 border-primary/15 text-primary/80 px-4 py-2">
            <Flame className="h-4 w-4 mr-2" />
            {t("squads.badge")}
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
            {t("squads.title")} <span className="gradient-text">{t("squads.title_hl")}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("squads.subtitle")}
          </p>
        </div>

        <Tabs defaultValue="squads" className="mt-6">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 border border-border rounded-xl h-12">
            <TabsTrigger value="squads" className="gap-2 data-[state=active]:bg-primary/20 rounded-lg text-xs sm:text-sm" onClick={() => setActiveSquad(null)}>
              <Package className="h-3.5 w-3.5" /> {t("squads.tab_squads")}
            </TabsTrigger>
            <TabsTrigger value="builder" className="gap-2 data-[state=active]:bg-primary/20 rounded-lg text-xs sm:text-sm">
              <Wrench className="h-3.5 w-3.5" /> {t("squads.tab_builder")}
            </TabsTrigger>
            <TabsTrigger value="departments" className="gap-2 data-[state=active]:bg-primary/20 rounded-lg text-xs sm:text-sm">
              <Building2 className="h-3.5 w-3.5" /> {t("squads.tab_departments")}
            </TabsTrigger>
            <TabsTrigger value="consultant" className="gap-2 data-[state=active]:bg-primary/20 rounded-lg text-xs sm:text-sm">
              <Bot className="h-3.5 w-3.5" /> {t("squads.tab_consultant", { defaultValue: "Consultor IA" })}
            </TabsTrigger>
          </TabsList>

          {/* SQUAD PACKS */}
          <TabsContent value="squads" className="mt-6">
            <AnimatePresence mode="wait">
              {!activeSquad ? (
                <motion.div
                  key="packs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid md:grid-cols-3 gap-6"
                >
                  {squadPacks.map((pack, i) => (
                    <motion.div
                      key={pack.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`relative rounded-2xl border p-6 transition-all hover:border-primary/40 ${
                        pack.recommended ? "border-primary/30 bg-primary/5" : "border-border bg-card/30"
                      }`}
                    >
                      {pack.recommended && (
                        <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px]">
                          {t("squads.recommended")}
                        </Badge>
                      )}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <pack.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-xl">
                            {t("squads.squad_title", { count: pack.agents })}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {t("squads.squad_subtitle", { count: pack.agents })}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-emerald-400">{t("squads.discount")}</span>
                          <span className="font-display font-bold text-2xl text-emerald-400">-{pack.discount}%</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{t("squads.discount_desc")}</p>
                      </div>

                      <ul className="space-y-2 mb-6">
                        {["feature_agents", "feature_shared_tokens", "feature_dashboard", "feature_support"].map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary/70" />
                            {t(`squads.${f}`, { count: pack.agents })}
                          </li>
                        ))}
                      </ul>

                      <Button
                        className={`w-full rounded-xl h-12 font-semibold gap-2 ${pack.recommended ? "glow" : ""}`}
                        variant={pack.recommended ? "default" : "outline"}
                        onClick={() => handleSelectSquad(pack)}
                      >
                        {t("squads.select_squad")}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="selection"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Header with back + status */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-muted-foreground"
                      onClick={() => setActiveSquad(null)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t("squads.back_to_packs")}
                    </Button>
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-card/50 border border-border">
                      <span className="text-sm font-medium">{t("squads.selected")}</span>
                      <span className="font-display font-bold text-xl text-primary">
                        {squadSelectedAgents.length}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {activeSquad.maxAgents}
                      </span>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                        -{activeSquad.discount}% off
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground text-center">
                    {t("squads.pick_agents", { count: activeSquad.maxAgents })}
                  </p>

                  <AgentSelectionGrid
                    selectedAgents={squadSelectedAgents}
                    toggleAgent={toggleSquadAgent}
                    maxAgents={activeSquad.maxAgents}
                    t={t}
                  />

                  {squadSelectedAgents.length === activeSquad.maxAgents && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <Link to="/auth">
                        <Button className="glow rounded-xl px-8 h-12 font-semibold gap-2">
                          {t("squads.confirm_squad")}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </motion.div>
                  )}

                  {squadSelectedAgents.length > 0 && squadSelectedAgents.length < activeSquad.maxAgents && (
                    <p className="text-center text-sm text-muted-foreground">
                      {t("squads.remaining_agents", { remaining: activeSquad.maxAgents - squadSelectedAgents.length })}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* TEAM BUILDER */}
          <TabsContent value="builder" className="mt-6">
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  {t("squads.builder_desc")}
                </p>
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-card/50 border border-border">
                  <span className="text-sm font-medium">{t("squads.selected")}</span>
                  <span className="font-display font-bold text-xl text-primary">
                    {selectedAgents.length}
                  </span>
                  <span className="text-sm text-muted-foreground">{t("squads.agents_label")}</span>
                  {teamDiscount > 0 && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                      -{teamDiscount}% off
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex justify-center gap-2 flex-wrap">
                {[
                  { min: 3, discount: 10 },
                  { min: 5, discount: 20 },
                  { min: 7, discount: 30 },
                  { min: 10, discount: 35 },
                ].map((tier) => (
                  <div
                    key={tier.min}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      selectedAgents.length >= tier.min
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-card/30 border-border text-muted-foreground"
                    }`}
                  >
                    {tier.min}+ → <span className="font-bold">-{tier.discount}%</span>
                  </div>
                ))}
              </div>

              <AgentSelectionGrid
                selectedAgents={selectedAgents}
                toggleAgent={toggleAgent}
                t={t}
              />

              {selectedAgents.length >= 3 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                  <Link to="/auth">
                    <Button className="glow rounded-xl px-8 h-12 font-semibold gap-2">
                      {t("squads.build_team")}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </motion.div>
              )}

              {selectedAgents.length > 0 && selectedAgents.length < 3 && (
                <p className="text-center text-sm text-muted-foreground">
                  {t("squads.min_agents", { remaining: 3 - selectedAgents.length })}
                </p>
              )}
            </div>
          </TabsContent>

          {/* DEPARTMENTS — Premium redesign */}
          <TabsContent value="departments" className="mt-8">
            <div className="text-center mb-8">
              <p className="text-muted-foreground text-sm max-w-xl mx-auto">
                {t("squads.dept_intro", { defaultValue: "Contrate departamentos completos com preço baseado no consumo real de tokens de cada agente. Quanto mais complexo o setor, mais poder de IA ele recebe." })}
              </p>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {departments.map((dept, i) => {
                const DeptIcon = dept.icon;
                const deptKey = dept.id as keyof typeof region.departments;
                const deptPrice = region.departments[deptKey] ?? dept.prometheusCost;
                const deptClt = region.departmentClt[deptKey] ?? dept.cltCost;
                const savings = deptClt - deptPrice;
                const savingsPercent = Math.round((savings / deptClt) * 100);
                return (
                  <motion.div
                    key={dept.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`group relative rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.015] ${
                      dept.popular 
                        ? "ring-1 ring-primary/40 shadow-[0_0_60px_-15px_hsl(var(--primary)/0.25)]" 
                        : "ring-1 ring-white/[0.06] hover:ring-primary/20"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />
                    
                    {dept.popular && (
                      <div className="absolute top-3 right-3 z-10">
                        <Badge className="bg-primary text-primary-foreground text-[9px] font-bold px-2.5 py-1 shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
                          {t("squads.best_seller", { defaultValue: "MAIS VENDIDO" })}
                        </Badge>
                      </div>
                    )}

                    {/* Header + Price */}
                    <div className="relative p-5 pb-4">
                      <div className="flex items-start gap-3 mb-4">
                        <div className={`w-11 h-11 rounded-xl ${dept.iconBg} flex items-center justify-center border border-white/[0.06]`}>
                          <DeptIcon className={`h-5 w-5 ${dept.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-bold text-base">{t(`squads.dept_${dept.id}`)}</h3>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                            {dept.headcount} agentes · {dept.tokens} tokens
                          </p>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="font-display font-bold text-3xl tracking-tight">
                          {fp(deptPrice)}
                        </span>
                        <span className="text-xs text-muted-foreground/50">/{t("pricing_page.per_month").replace("/", "")}</span>
                        <span className="ml-auto text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          -{savingsPercent}%
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/40 mt-1">
                        <span className="line-through">{fp(deptClt)}</span> CLT equivalente
                      </p>
                    </div>

                    <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                    {/* Agents — compact 2-col grid */}
                    <div className="p-5 pt-4">
                      <div className="grid grid-cols-2 gap-1.5 mb-4">
                        {dept.agents.map((agent, idx) => {
                          const AgentIcon = agent.icon;
                          return (
                            <div
                              key={`${dept.id}-${agent.key}-${idx}`}
                              className="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.015] border border-white/[0.03]"
                            >
                              <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                                <AgentIcon className="h-3 w-3 text-primary/70" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-medium truncate text-foreground/80">
                                  {t(`library_page.agents.${agent.key}_title`).split("—")[0].trim().slice(0, 18)}
                                </p>
                                <p className="text-[8px] text-muted-foreground/40 font-mono">{agent.tokens}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Live orchestration — ALWAYS VISIBLE */}
                      <DepartmentMiniChat departmentId={dept.id} autoPlay compact />
                    </div>

                    {/* CTA */}
                    <div className="px-5 pb-5 pt-2">
                      <Link to="/auth">
                        <button className="group/btn relative w-full h-12 rounded-xl font-display font-semibold text-sm uppercase tracking-wider overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.97]">
                          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-primary bg-[length:200%_100%] animate-gradient-shift rounded-xl" />
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/40 via-primary-glow/40 to-primary/40 rounded-xl blur-lg opacity-0 group-hover/btn:opacity-80 transition-opacity duration-500" />
                          <span className="relative z-10 flex items-center justify-center gap-2 text-primary-foreground font-bold">
                            {t("squads.hire_dept", { defaultValue: "Contratar Departamento" })}
                            <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                          </span>
                        </button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* FAQ — separate clean section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <DepartmentFAQ departmentId="all" />
            </motion.div>

            {/* Bottom CTA — full company */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-10 text-center p-8 rounded-2xl ring-1 ring-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5"
            >
              <Flame className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-display font-bold text-xl mb-2">
                {t("squads.full_company_title", { defaultValue: "Empresa completa por menos que 3 funcionários CLT" })}
              </h3>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-2">
                7 {t("squads.tab_departments", { defaultValue: "departamentos" }).toLowerCase()} · 28 {t("squads.agents_label", { defaultValue: "agentes" })} · 48M tokens/{t("pricing_page.per_month", { defaultValue: "/mês" }).replace("/", "")}  · 24/7
              </p>
              <div className="flex items-center justify-center gap-6 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t("pricing_page.clt_header_traditional", { defaultValue: "CLT total" })}</p>
                  <p className="font-display font-bold text-lg line-through text-muted-foreground">{fp(Object.values(region.departmentClt).reduce((a, b) => a + b, 0))}/{t("pricing_page.per_month", { defaultValue: "/mês" }).replace("/", "")}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-400 font-medium">CLAUTHOR</p>
                  <p className="font-display font-bold text-lg text-emerald-400">{fp(Object.values(region.departments).reduce((a, b) => a + b, 0))}/{t("pricing_page.per_month", { defaultValue: "/mês" }).replace("/", "")}</p>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 font-bold text-sm px-3 py-1">
                  -{Math.round((1 - Object.values(region.departments).reduce((a, b) => a + b, 0) / Object.values(region.departmentClt).reduce((a, b) => a + b, 0)) * 100)}%
                </Badge>
              </div>
              <Link to="/auth">
                <Button className="glow rounded-xl px-8 h-12 font-semibold gap-2">
                  {t("squads.build_full_team", { defaultValue: "Montar Meu Time Completo" })}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </TabsContent>

          {/* AI CONSULTANT */}
          <TabsContent value="consultant" className="mt-6">
            <SquadConsultant />
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
