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

const squadPacks = [
  { id: "squad-3", agents: 3, discount: 10, icon: Users, recommended: false },
  { id: "squad-5", agents: 5, discount: 20, icon: Package, recommended: true },
  { id: "squad-10", agents: 10, discount: 35, icon: Building2, recommended: false },
];

const departments = [
  { 
    id: "comercial", icon: Briefcase, color: "text-cyan-400", 
    gradient: "from-cyan-500/20 to-cyan-500/5",
    borderActive: "border-cyan-500/40",
    iconBg: "bg-cyan-500/20",
    agents: [
      { key: "sales", icon: Briefcase, role: "SDR / Closer" },
      { key: "customer_success", icon: Star, role: "Customer Success" },
      { key: "omnichannel", icon: MessageSquare, role: "Atendente Multicanal" },
      { key: "voice_ai", icon: Phone, role: "Operador de Telefonia" },
    ],
    headcount: 4, cltCost: 30240, prometheusCost: 2200, discount: 25,
  },
  { 
    id: "marketing", icon: Megaphone, color: "text-primary", 
    gradient: "from-primary/20 to-primary/5",
    borderActive: "border-primary/40",
    iconBg: "bg-primary/20",
    agents: [
      { key: "content", icon: Sparkles, role: "Copywriter / Content" },
      { key: "marketing_automation", icon: Target, role: "Automação de Marketing" },
      { key: "seo_growth", icon: Globe, role: "Analista SEO" },
      { key: "influencer", icon: Megaphone, role: "Social Media Manager" },
    ],
    headcount: 4, cltCost: 30240, prometheusCost: 2200, discount: 25,
  },
  { 
    id: "financeiro", icon: BarChart3, color: "text-amber-400", 
    gradient: "from-amber-500/20 to-amber-500/5",
    borderActive: "border-amber-500/40",
    iconBg: "bg-amber-500/20",
    agents: [
      { key: "revenue", icon: BarChart3, role: "CFO / Controller" },
      { key: "legal", icon: FileText, role: "Analista Fiscal / Jurídico" },
      { key: "data_analytics", icon: BarChart3, role: "Analista de Dados" },
      { key: "ecommerce", icon: ShoppingCart, role: "Gestor Financeiro E-com" },
    ],
    headcount: 4, cltCost: 30240, prometheusCost: 2200, discount: 25,
  },
  { 
    id: "suporte", icon: MessageSquare, color: "text-emerald-400", 
    gradient: "from-emerald-500/20 to-emerald-500/5",
    borderActive: "border-emerald-500/40",
    iconBg: "bg-emerald-500/20",
    agents: [
      { key: "omnichannel", icon: MessageSquare, role: "Atendente N1 / N2" },
      { key: "customer_success", icon: Star, role: "CS Manager" },
      { key: "voice_ai", icon: Phone, role: "Operador Call Center" },
      { key: "rag", icon: FileText, role: "Base de Conhecimento" },
    ],
    headcount: 4, cltCost: 30240, prometheusCost: 2200, discount: 25,
  },
  { 
    id: "criacao", icon: Palette, color: "text-violet-400", 
    gradient: "from-violet-500/20 to-violet-500/5",
    borderActive: "border-violet-500/40",
    iconBg: "bg-violet-500/20",
    agents: [
      { key: "creative_design", icon: Palette, role: "Designer Gráfico" },
      { key: "video_production", icon: Video, role: "Editor de Vídeo" },
      { key: "content", icon: Sparkles, role: "Redator Criativo" },
      { key: "influencer", icon: Megaphone, role: "Produtor de Conteúdo" },
    ],
    headcount: 4, cltCost: 30240, prometheusCost: 2200, discount: 25,
  },
  { 
    id: "tecnologia", icon: Wrench, color: "text-blue-400", 
    gradient: "from-blue-500/20 to-blue-500/5",
    borderActive: "border-blue-500/40",
    iconBg: "bg-blue-500/20",
    agents: [
      { key: "coding", icon: Wrench, role: "Dev Full-Stack" },
      { key: "computer", icon: Building2, role: "DevOps / Infra" },
      { key: "project_management", icon: ClipboardList, role: "Gerente de Projetos" },
      { key: "security", icon: Shield, role: "CISO / Segurança" },
    ],
    headcount: 4, cltCost: 30240, prometheusCost: 2200, discount: 25,
  },
  { 
    id: "rh", icon: GraduationCap, color: "text-pink-400", 
    gradient: "from-pink-500/20 to-pink-500/5",
    borderActive: "border-pink-500/40",
    iconBg: "bg-pink-500/20",
    agents: [
      { key: "hr", icon: Star, role: "Recrutador / BP" },
      { key: "training", icon: GraduationCap, role: "T&D / Onboarding" },
      { key: "customer_success", icon: Star, role: "People Analytics" },
      { key: "data_analytics", icon: BarChart3, role: "Analista de Dados RH" },
    ],
    headcount: 4, cltCost: 30240, prometheusCost: 2200, discount: 25,
  },
];

const availableAgents = [
  { key: "voice_ai", icon: Phone },
  { key: "omnichannel", icon: MessageSquare },
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
  const { t } = useTranslation();
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

          {/* DEPARTMENTS — Innovative org-chart style */}
          <TabsContent value="departments" className="mt-8">
            <div className="text-center mb-8">
              <p className="text-muted-foreground text-sm max-w-xl mx-auto">
                Monte seu time de IA por departamento. Cada setor vem com os agentes certos — prontos para substituir operações CLT inteiras.
              </p>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {departments.map((dept, i) => {
                const DeptIcon = dept.icon;
                const savings = dept.cltCost - dept.prometheusCost;
                const savingsPercent = Math.round((savings / dept.cltCost) * 100);
                return (
                  <motion.div
                    key={dept.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`group relative rounded-2xl border border-border bg-card/20 overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_40px_-12px_hsl(var(--primary)/0.15)]`}
                  >
                    {/* Gradient header */}
                    <div className={`relative p-5 bg-gradient-to-br ${dept.gradient}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl ${dept.iconBg} flex items-center justify-center`}>
                            <DeptIcon className={`h-6 w-6 ${dept.color}`} />
                          </div>
                          <div>
                            <h3 className="font-display font-bold text-lg">{t(`squads.dept_${dept.id}`)}</h3>
                            <p className="text-[11px] text-muted-foreground">{dept.headcount} agentes especializados</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[11px] font-bold">
                          -{dept.discount}%
                        </Badge>
                      </div>
                    </div>

                    {/* Agents org-chart */}
                    <div className="p-5 space-y-2">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-3">
                        Agentes do departamento
                      </p>
                      {dept.agents.map((agent, idx) => {
                        const AgentIcon = agent.icon;
                        return (
                          <div
                            key={`${dept.id}-${agent.key}-${idx}`}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-transparent hover:border-white/[0.06] transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                              <AgentIcon className="h-3.5 w-3.5 text-primary-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {t(`library_page.agents.${agent.key}_title`)}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Substitui: <span className="text-foreground/60">{agent.role}</span>
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer — savings CTA */}
                    <div className="px-5 pb-5 space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <div>
                          <p className="text-[10px] text-muted-foreground">CLT equivalente</p>
                          <p className="text-sm font-bold line-through text-muted-foreground">
                            R$ {dept.cltCost.toLocaleString("pt-BR")}/mês
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-emerald-400 font-medium">Com PROMETHEUS</p>
                          <p className="text-sm font-bold text-emerald-400">
                            R$ {dept.prometheusCost.toLocaleString("pt-BR")}/mês
                          </p>
                        </div>
                      </div>

                      <div className="text-center">
                        <span className="text-xs text-muted-foreground">
                          Economia de <span className="text-emerald-400 font-bold">R$ {savings.toLocaleString("pt-BR")}/mês</span>{" "}
                          <span className="text-emerald-400">({savingsPercent}%)</span>
                        </span>
                      </div>

                      <Link to="/auth">
                        <Button variant="outline" className={`w-full rounded-xl h-11 font-semibold gap-2 border-border hover:${dept.borderActive} transition-colors`}>
                          Contratar Departamento
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom CTA — full company */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-10 text-center p-8 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5"
            >
              <Flame className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-display font-bold text-xl mb-2">
                Contrate a empresa inteira por menos que 2 funcionários CLT
              </h3>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-4">
                7 departamentos × 4 agentes = <span className="text-foreground font-semibold">28 funcionários de IA</span> operando 24/7.
                Enquanto o CLT custa R$ 211.680/mês, o PROMETHEUS entrega tudo por uma fração.
              </p>
              <Link to="/auth">
                <Button className="glow rounded-xl px-8 h-12 font-semibold gap-2">
                  Montar Meu Time Completo
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
