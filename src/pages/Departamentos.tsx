import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { HireIntent } from "./Auth";
import {
  Users, Building2, ArrowRight, Flame, Sparkles,
  Phone, MessageSquare, Briefcase, BarChart3, Star, FileText,
  ShoppingCart, Shield, Wrench, Megaphone, Target, Palette,
  Video, Globe, ClipboardList, GraduationCap, Bot, Zap,
  CheckCircle2, TrendingUp, Coins, Network, Lightbulb, ThumbsUp, Send
} from "lucide-react";
import { useTranslation } from "react-i18next";
import SquadConsultant from "@/components/pricing/SquadConsultant";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    headcount: 4, cltCost: 84000, prometheusCost: 4997, discount: 30,
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
      { key: "omnichannel", icon: MessageSquare, role: "Atendente Multicanal", tokens: "2M" },
      { key: "voice_ai", icon: Phone, role: "Operador de Telefonia", tokens: "2M" },
    ],
    headcount: 4, cltCost: 48000, prometheusCost: 3997, discount: 25,
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
    headcount: 4, cltCost: 40000, prometheusCost: 2997, discount: 25,
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
    headcount: 4, cltCost: 44000, prometheusCost: 2997, discount: 20,
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
      { key: "content", icon: Sparkles, role: "Redator Criativo", tokens: "1M" },
      { key: "influencer", icon: Megaphone, role: "Produtor de Conteúdo", tokens: "1M" },
    ],
    headcount: 4, cltCost: 36000, prometheusCost: 2497, discount: 20,
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
      { key: "omnichannel", icon: MessageSquare, role: "Atendente N1 / N2", tokens: "1.5M" },
      { key: "customer_success", icon: Star, role: "CS Manager", tokens: "1.5M" },
      { key: "voice_ai", icon: Phone, role: "Operador Call Center", tokens: "1M" },
      { key: "rag", icon: FileText, role: "Base de Conhecimento", tokens: "1M" },
    ],
    headcount: 4, cltCost: 24000, prometheusCost: 1997, discount: 20,
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
      { key: "customer_success", icon: Star, role: "People Analytics", tokens: "1M" },
      { key: "data_analytics", icon: BarChart3, role: "Analista de Dados RH", tokens: "0.5M" },
    ],
    headcount: 4, cltCost: 28000, prometheusCost: 1797, discount: 15,
  },
];

const totalPrometheusCost = departments.reduce((a, d) => a + d.prometheusCost, 0);
const totalCltCost = departments.reduce((a, d) => a + d.cltCost, 0);
const totalTokens = "48M";
const totalAgents = 28;
const totalSavingsPercent = Math.round(((totalCltCost - totalPrometheusCost) / totalCltCost) * 100);

const Departamentos = () => {
  const { t } = useTranslation();
  const [suggestionName, setSuggestionName] = useState("");
  const [suggestionReason, setSuggestionReason] = useState("");
  const [suggestionEmail, setSuggestionEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<{ department_name: string; votes: number }[]>([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const { data } = await supabase
        .from("department_suggestions")
        .select("department_name, votes")
        .order("votes", { ascending: false })
        .limit(10);
      if (data) {
        // Aggregate by name
        const map = new Map<string, number>();
        data.forEach((s) => {
          const name = s.department_name.toLowerCase().trim();
          map.set(name, (map.get(name) || 0) + s.votes);
        });
        setSuggestions(
          Array.from(map.entries())
            .map(([department_name, votes]) => ({ department_name, votes }))
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 5)
        );
      }
    };
    fetchSuggestions();
  }, []);

  const handleSuggestionSubmit = async () => {
    if (!suggestionName.trim()) return;
    setIsSubmitting(true);
    const { error } = await supabase.from("department_suggestions").insert({
      department_name: suggestionName.trim().slice(0, 100),
      reason: suggestionReason.trim().slice(0, 500) || null,
      email: suggestionEmail.trim().slice(0, 255) || null,
    });
    setIsSubmitting(false);
    if (error) {
      toast.error("Erro ao enviar sugestão. Tente novamente.");
    } else {
      toast.success("Sugestão enviada! Obrigado pelo feedback.");
      setSuggestionName("");
      setSuggestionReason("");
      setSuggestionEmail("");
      // Refresh suggestions
      const { data } = await supabase
        .from("department_suggestions")
        .select("department_name, votes")
        .order("votes", { ascending: false })
        .limit(10);
      if (data) {
        const map = new Map<string, number>();
        data.forEach((s) => {
          const name = s.department_name.toLowerCase().trim();
          map.set(name, (map.get(name) || 0) + s.votes);
        });
        setSuggestions(
          Array.from(map.entries())
            .map(([department_name, votes]) => ({ department_name, votes }))
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 5)
        );
      }
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 relative">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle, hsl(266 100% 50%) 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-primary/[0.04] to-transparent rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-t from-primary/[0.03] to-transparent rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-6 border-primary/15 text-primary/80 px-5 py-2.5">
            <Network className="h-4 w-4 mr-2" />
            Times de IA por Departamento
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
            Sua empresa inteira<br />
            <span className="gradient-text">operada por IA</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            7 departamentos. 28 agentes autônomos. Cada um substitui um profissional CLT — 
            por uma <span className="text-primary font-bold">fração do custo</span>.
          </p>

          {/* Hero Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
            {[
              { icon: Bot, value: "28", label: "Agentes" },
              { icon: Building2, value: "7", label: "Departamentos" },
              { icon: Coins, value: totalTokens, label: "Tokens/mês" },
              { icon: Zap, value: "24/7", label: "Operação" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/30 border border-border">
                <stat.icon className="h-4 w-4 text-primary/70" />
                <span className="font-display font-bold text-foreground">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Department Cards Grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mb-16">
          {departments.map((dept, i) => {
            const DeptIcon = dept.icon;
            const savings = dept.cltCost - dept.prometheusCost;
            const savingsPercent = Math.round((savings / dept.cltCost) * 100);
            return (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_-12px_hsl(var(--primary)/0.15)] ${
                  dept.popular 
                    ? "border-primary/40 bg-primary/[0.03]" 
                    : "border-border bg-card/20 hover:border-primary/30"
                }`}
              >
                {dept.popular && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1">
                      MAIS VENDIDO
                    </Badge>
                  </div>
                )}

                <div className={`relative p-5 bg-gradient-to-br ${dept.gradient}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${dept.iconBg} flex items-center justify-center`}>
                      <DeptIcon className={`h-6 w-6 ${dept.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-lg">{t(`squads.dept_${dept.id}`)}</h3>
                      <p className="text-[11px] text-muted-foreground">{dept.headcount} agentes · {dept.tokens} tokens · {dept.actions} ações/mês</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-end gap-2">
                    <span className="font-display font-bold text-2xl text-foreground">
                      R$ {dept.prometheusCost.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-sm text-muted-foreground mb-0.5">/mês</span>
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px] font-bold ml-auto">
                      -{dept.discount}% pack
                    </Badge>
                  </div>
                </div>

                <div className="p-5 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-2">
                    Agentes inclusos
                  </p>
                  {dept.agents.map((agent, idx) => {
                    const AgentIcon = agent.icon;
                    return (
                      <div
                        key={`${dept.id}-${agent.key}-${idx}`}
                        className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-transparent hover:border-white/[0.06] transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <AgentIcon className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate">
                            {t(`library_page.agents.${agent.key}_title`)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Substitui: {agent.role}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground bg-white/[0.03] px-2 py-0.5 rounded-md shrink-0">
                          {agent.tokens}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="px-5 pb-5 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <div>
                      <p className="text-[10px] text-muted-foreground">CLT equivalente</p>
                      <p className="text-sm font-bold line-through text-muted-foreground">
                        R$ {dept.cltCost.toLocaleString("pt-BR")}/mês
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-emerald-400 font-semibold">Economia</p>
                      <p className="text-sm font-bold text-emerald-400">
                        -{savingsPercent}% ({`R$ ${savings.toLocaleString("pt-BR")}`})
                      </p>
                    </div>
                  </div>

                  <Link 
                    to="/auth" 
                    state={{ 
                      hireIntent: { 
                        type: "department", 
                        label: t(`squads.dept_${dept.id}`),
                        departmentId: dept.id,
                        slugs: dept.agents.map(a => a.key),
                      } as HireIntent 
                    }}
                  >
                    <button className="group relative w-full h-16 rounded-2xl font-display font-bold text-base uppercase tracking-widest overflow-hidden transition-all duration-500 hover:scale-[1.04] active:scale-[0.96] cursor-pointer">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-primary bg-[length:200%_100%] animate-gradient-shift rounded-2xl" />
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary/60 via-primary-glow/60 to-primary/60 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute inset-0 bg-white/[0.06] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                      <div className="absolute inset-0 rounded-2xl border border-white/[0.15] group-hover:border-white/[0.3] transition-colors duration-500" />
                      <span className="relative z-10 flex items-center justify-center gap-3 text-primary-foreground font-bold text-[15px] drop-shadow-[0_0_12px_hsl(var(--primary)/0.5)]">
                        <Flame className="h-5 w-5 animate-pulse" />
                        Contratar Departamento
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                      </span>
                    </button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Full Company CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center p-10 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5 mb-16"
        >
          <Flame className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl sm:text-3xl mb-3">
            Empresa completa por menos que 3 funcionários CLT
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-4">
            7 departamentos · 28 agentes · {totalTokens} tokens/mês · operação 24/7
          </p>
          <div className="flex items-center justify-center gap-6 mb-6">
            <div>
              <p className="text-xs text-muted-foreground">CLT total</p>
              <p className="font-display font-bold text-xl line-through text-muted-foreground">
                R$ {totalCltCost.toLocaleString("pt-BR")}/mês
              </p>
            </div>
            <div>
              <p className="text-xs text-emerald-400 font-medium">CLAUTHOR</p>
              <p className="font-display font-bold text-xl text-emerald-400">
                R$ {totalPrometheusCost.toLocaleString("pt-BR")}/mês
              </p>
            </div>
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 font-bold text-sm px-3 py-1">
              -{totalSavingsPercent}%
            </Badge>
          </div>
          <Link 
            to="/auth" 
            state={{ 
              hireIntent: { 
                type: "department", 
                label: "Empresa Completa (7 departamentos)",
                departmentId: "all",
                slugs: departments.flatMap(d => d.agents.map(a => a.key)),
              } as HireIntent 
            }}
          >
            <Button className="glow rounded-xl px-10 h-14 font-semibold gap-2 text-lg">
              Montar Meu Time Completo
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </motion.div>

        {/* AI Consultant */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-8 md:p-12 relative overflow-hidden mb-16"
        >
          <div className="absolute top-0 left-0 w-60 h-60 bg-primary/5 rounded-full blur-[80px]" />
          <div className="relative z-10">
            <div className="text-center mb-6">
              <h2 className="font-display text-2xl font-bold mb-2 flex items-center justify-center gap-3">
                <Bot className="h-6 w-6 text-primary" />
                Consultor IA de Squads
              </h2>
              <p className="text-sm text-muted-foreground">Descreva sua empresa e receba uma recomendação personalizada de departamentos</p>
            </div>
            <SquadConsultant />
          </div>
        </motion.div>

        {/* Suggest New Departments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-8 md:p-12 mb-16"
        >
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="h-7 w-7 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">
              Qual departamento você <span className="gradient-text">gostaria de ver</span>?
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Sugira novos departamentos e ajude a moldar o futuro da plataforma. Sua voz define o que construímos.
            </p>
          </div>

          <div className="max-w-xl mx-auto space-y-4">
            <Input
              placeholder="Nome do departamento (ex: Jurídico, Operações, Data Science...)"
              value={suggestionName}
              onChange={(e) => setSuggestionName(e.target.value)}
              maxLength={100}
              className="bg-card/40 border-border"
            />
            <Textarea
              placeholder="Por que esse departamento seria útil para sua empresa? (opcional)"
              value={suggestionReason}
              onChange={(e) => setSuggestionReason(e.target.value)}
              maxLength={500}
              rows={3}
              className="bg-card/40 border-border resize-none"
            />
            <Input
              type="email"
              placeholder="Seu e-mail (opcional — avisamos quando lançar)"
              value={suggestionEmail}
              onChange={(e) => setSuggestionEmail(e.target.value)}
              maxLength={255}
              className="bg-card/40 border-border"
            />
            <Button
              onClick={handleSuggestionSubmit}
              disabled={!suggestionName.trim() || isSubmitting}
              className="w-full h-12 gap-2 text-sm font-bold"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Enviando..." : "Enviar Sugestão"}
            </Button>
          </div>

          {suggestions.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold text-center mb-4">
                Mais votados pela comunidade
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {suggestions.map((s) => (
                  <button
                    key={s.department_name}
                    onClick={() => setSuggestionName(s.department_name)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/40 border border-border hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <ThumbsUp className="h-3.5 w-3.5 text-primary/60" />
                    <span className="text-sm capitalize">{s.department_name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {s.votes}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Bottom comparison */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-8 md:p-12"
        >
          <h2 className="font-display text-2xl font-bold text-center mb-8">
            Por que contratar <span className="gradient-text">departamentos inteiros</span>?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: TrendingUp, title: "93% mais barato", desc: "Que uma equipe CLT equivalente" },
              { icon: Zap, title: "Operação 24/7", desc: "Sem férias, sem faltas, sem hora extra" },
              { icon: Network, title: "Agentes orquestrados", desc: "Times que se comunicam entre si" },
              { icon: CheckCircle2, title: "Setup em minutos", desc: "Sem recrutamento, sem onboarding" },
            ].map((item) => (
              <div key={item.title} className="text-center group">
                <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                  <item.icon className="h-6 w-6 text-primary/70" />
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Departamentos;
