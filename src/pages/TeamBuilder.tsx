import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, X, Plus, Minus, Search, ShoppingCart, ArrowRight, Layers3, CheckCircle2, Trash2, ChevronDown, Filter, Zap, Target, BookOpen, AlertTriangle, BarChart3, Lightbulb, Database, FileOutput, HelpCircle, ChevronRight } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { agentKeys, agentIcons, agentPriceTiers } from "@/data/libraryAgentData";
import { departments } from "@/data/departmentData";
import { getPrice, formatPrice, getRegion } from "@/lib/pricing";
import type { PriceTier } from "@/lib/pricing";
import type { HireIntent } from "@/pages/Auth";
import CheckoutSummaryDialog from "@/components/dashboard/CheckoutSummaryDialog";
import type { CheckoutSummaryData } from "@/components/dashboard/CheckoutSummaryDialog";
import { createPayPalPlan, handleInlineApproval } from "@/lib/paypal-helpers";
import { SLUG_TO_DEPT } from "@/data/departmentMap";
import { getAgentDescription } from "@/data/agentDescriptions";
import type { AgentDescription } from "@/data/agentDescriptions";

const categoryFilters = [
  { id: "all", label: "Todos" },
  { id: "comercial", label: "Vendas" },
  { id: "marketing", label: "Marketing" },
  { id: "suporte", label: "Suporte" },
  { id: "tecnologia", label: "Tecnologia" },
  { id: "financeiro", label: "Financeiro" },
  { id: "rh", label: "RH" },
  { id: "criacao", label: "Criação" },
  { id: "juridico", label: "Jurídico" },
];

function getAgentCategory(key: string): string {
  return SLUG_TO_DEPT[key] || "outros";
}

/* ─── Expandable Agent Detail Panel ─── */
function AgentDetailPanel({ description, isOpen }: { description: AgentDescription; isOpen: boolean }) {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { icon: Zap, label: "O que faz", content: description.sections.whatItDoes },
    { icon: Target, label: "Como funciona", content: description.sections.howItWorks },
    { icon: BookOpen, label: "Quando usar", content: description.sections.whenToUse },
    { icon: AlertTriangle, label: "Quando não usar", content: description.sections.whenNotToUse },
    { icon: BarChart3, label: "Resultados", content: description.sections.expectedResults },
    { icon: Lightbulb, label: "Exemplo real", content: description.sections.exampleInPractice },
    { icon: Database, label: "Dados de entrada", content: description.sections.dataInputs },
    { icon: FileOutput, label: "Saídas", content: description.sections.output },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden"
        >
          <div className="pt-4 mt-3 border-t border-border/10">
            {/* Impact & Category badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">
                {description.category}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  description.impactLevel === "high"
                    ? "border-emerald-500/30 text-emerald-500"
                    : description.impactLevel === "medium"
                    ? "border-amber-500/30 text-amber-500"
                    : "border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {description.impactLevel === "high" ? "⚡ Alto Impacto" : description.impactLevel === "medium" ? "● Médio Impacto" : "○ Baixo Impacto"}
              </Badge>
              <Badge variant="outline" className="text-[10px] border-border/20 text-muted-foreground">
                {description.sections.complexityLevel === "beginner" ? "🟢 Iniciante" : description.sections.complexityLevel === "intermediate" ? "🟡 Intermediário" : "🔴 Avançado"}
              </Badge>
              {description.labels.map((l) => (
                <Badge key={l} className="text-[10px] bg-primary/10 text-primary border-0">
                  {l}
                </Badge>
              ))}
            </div>

            {/* Expected outcome highlight */}
            <div className="p-3 rounded-xl bg-primary/[0.04] border border-primary/10 mb-4">
              <p className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                Resultado esperado
              </p>
              <p className="text-xs text-foreground/80 mt-1">{description.expectedOutcome}</p>
            </div>

            {/* Tabs navigation */}
            <div className="flex gap-1 overflow-x-auto pb-2 mb-3 scrollbar-hide">
              {tabs.map((tab, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setActiveTab(i); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${
                    activeTab === i
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border/10 text-muted-foreground hover:text-foreground hover:border-border/30"
                  }`}
                >
                  <tab.icon className="h-3 w-3" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="p-3 rounded-xl bg-card/50 border border-border/5 min-h-[80px]"
              >
                <p className="text-xs leading-relaxed text-foreground/80 whitespace-pre-line">
                  {tabs[activeTab].content}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* FAQ section */}
            {description.faq.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5 mb-2">
                  <HelpCircle className="h-3.5 w-3.5 text-primary" />
                  Perguntas Frequentes
                </p>
                <div className="space-y-2">
                  {description.faq.map((item, i) => (
                    <FAQItem key={i} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border/5 bg-background/50 overflow-hidden">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-[11px] font-medium text-foreground/80">{q}</span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-3 pb-2.5 text-[11px] text-muted-foreground leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Page ─── */
const TeamBuilder = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const lang = i18n.language || "pt";
  const region = getRegion(lang);

  const [cart, setCart] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [checkoutData, setCheckoutData] = useState<CheckoutSummaryData | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const agentList = useMemo(() => {
    return agentKeys.map((key) => {
      const tier = (agentPriceTiers[key] || "starter") as PriceTier;
      const price = getPrice(lang, tier);
      const Icon = agentIcons[key] || Bot;
      const category = getAgentCategory(key);
      const description = getAgentDescription(key);
      return { key, tier, price, Icon, category, description };
    });
  }, [lang]);

  const filteredAgents = useMemo(() => {
    return agentList.filter((a) => {
      const matchesCategory = activeCategory === "all" || a.category === activeCategory;
      const matchesSearch = !searchQuery || t(`library_page.agents.${a.key}.name`, { defaultValue: a.key }).toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [agentList, activeCategory, searchQuery, t]);

  const addToCart = useCallback((key: string) => {
    setCart((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  }, []);
  const removeFromCart = useCallback((key: string) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[key] > 1) next[key]--;
      else delete next[key];
      return next;
    });
  }, []);
  const clearFromCart = useCallback((key: string) => {
    setCart((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }, []);
  const clearCart = useCallback(() => setCart({}), []);

  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([key, qty]) => {
      const agent = agentList.find((a) => a.key === key);
      return { key, qty, price: agent?.price || 0, Icon: agent?.Icon || Bot };
    });
  }, [cart, agentList]);

  const totalAgents = useMemo(() => cartItems.reduce((sum, i) => sum + i.qty, 0), [cartItems]);
  const totalPrice = useMemo(() => cartItems.reduce((sum, i) => sum + i.price * i.qty, 0), [cartItems]);

  const handleCheckout = useCallback(() => {
    if (totalAgents === 0) { toast.error("Selecione pelo menos um agente"); return; }
    const slugs = cartItems.flatMap((i) => Array(i.qty).fill(i.key));
    if (!user) {
      const intent: HireIntent = { type: "squad", slugs, label: `Time Personalizado (${totalAgents} agentes)` };
      localStorage.setItem("hireIntent", JSON.stringify(intent));
      navigate("/auth", { state: { signup: true } });
      return;
    }
    const checkoutInfo: CheckoutSummaryData = {
      label: `Time Personalizado (${totalAgents} agentes)`,
      slugs, isDepartment: slugs.length > 1, price: totalPrice, currency: region.currency, lang,
    };
    setCheckoutData(checkoutInfo);
    const agentSlug = `custom-team-${Date.now()}`;
    createPayPalPlan(agentSlug, checkoutInfo.label, totalPrice, region.currency).then((planId) => {
      setCheckoutData((prev) => prev ? { ...prev, planId } : prev);
    });
  }, [totalAgents, totalPrice, cartItems, user, navigate, region, lang]);

  const handleApproveCheckout = useCallback((subscriptionId: string) => {
    if (!checkoutData) return;
    handleInlineApproval(subscriptionId, checkoutData, {
      is_department: true, department_id: "custom", department_slugs: checkoutData.slugs,
    });
  }, [checkoutData]);

  const toggleExpand = useCallback((key: string) => {
    setExpandedAgent((prev) => (prev === key ? null : key));
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 relative">
      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary px-4 py-2">
            <Layers3 className="h-4 w-4 mr-2" />
            Team Builder
          </Badge>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
            Monte seu <span className="text-primary">time ideal</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Selecione os agentes, veja detalhes completos e contrate tudo de uma vez.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Left - Agent Catalog */}
          <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar agente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-card border-border/20" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {categoryFilters.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border/10 text-muted-foreground hover:text-foreground hover:border-border/30"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Agent list */}
            <div className="space-y-2">
              {filteredAgents.map((agent) => {
                const qty = cart[agent.key] || 0;
                const name = t(`library_page.agents.${agent.key}.name`, { defaultValue: agent.key.replace(/_/g, " ") });
                const isExpanded = expandedAgent === agent.key;
                const desc = agent.description;

                return (
                  <motion.div
                    key={agent.key}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl p-4 border transition-all duration-200 cursor-pointer ${
                      isExpanded
                        ? "border-primary/20 bg-card shadow-lg shadow-primary/[0.03]"
                        : qty > 0
                        ? "border-primary/15 bg-primary/[0.02]"
                        : "border-border/10 bg-card hover:border-border/20"
                    }`}
                    onClick={() => toggleExpand(agent.key)}
                  >
                    {/* Main row */}
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        qty > 0 || isExpanded ? "bg-primary/10" : "bg-muted/50"
                      }`}>
                        <agent.Icon className={`h-5 w-5 ${qty > 0 || isExpanded ? "text-primary" : "text-muted-foreground"}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate capitalize">{name}</p>
                          {desc && desc.labels.length > 0 && (
                            <Badge className="text-[9px] bg-primary/10 text-primary border-0 hidden sm:inline-flex">
                              {desc.labels[0]}
                            </Badge>
                          )}
                        </div>
                        {desc ? (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{desc.oneLiner}</p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">Agente de IA autônomo</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <p className="text-xs font-bold text-primary whitespace-nowrap">{formatPrice(agent.price, lang)}<span className="text-muted-foreground font-normal">/mês</span></p>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {qty > 0 ? (
                            <>
                              <button onClick={() => removeFromCart(agent.key)} className="w-7 h-7 rounded-lg bg-card border border-border/20 flex items-center justify-center hover:bg-muted transition-colors">
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center text-sm font-bold">{qty}</span>
                              <button onClick={() => addToCart(agent.key)} className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/20 transition-colors">
                                <Plus className="h-3 w-3 text-primary" />
                              </button>
                            </>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => addToCart(agent.key)} className="h-7 px-2 text-xs gap-1 hover:bg-primary/10 hover:text-primary">
                              <Plus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                      </div>
                    </div>

                    {/* Expandable description panel */}
                    {desc && <AgentDetailPanel description={desc} isOpen={isExpanded} />}
                  </motion.div>
                );
              })}
            </div>

            {filteredAgents.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum agente encontrado</p>
              </div>
            )}
          </div>

          {/* Right - Cart sidebar */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-border/10 bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  <h3 className="font-display font-bold text-sm">Seu Time</h3>
                  {totalAgents > 0 && <Badge className="bg-primary/10 text-primary border-0 text-[10px]">{totalAgents}</Badge>}
                </div>
                {totalAgents > 0 && (
                  <button onClick={clearCart} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors">Limpar</button>
                )}
              </div>

              <div className="px-5 py-3 max-h-[400px] overflow-y-auto space-y-2">
                <AnimatePresence mode="popLayout">
                  {cartItems.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center">
                      <Bot className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
                      <p className="text-sm text-muted-foreground">Nenhum agente selecionado</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">Clique em "+" para começar</p>
                    </motion.div>
                  ) : (
                    cartItems.map((item) => {
                      const name = t(`library_page.agents.${item.key}.name`, { defaultValue: item.key.replace(/_/g, " ") });
                      return (
                        <motion.div key={item.key} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20, height: 0 }}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-background/50 border border-border/5"
                        >
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <item.Icon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate capitalize">{name}</p>
                            <p className="text-[10px] text-muted-foreground">{item.qty}× {formatPrice(item.price, lang)}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => removeFromCart(item.key)} className="w-6 h-6 rounded-md bg-card border border-border/10 flex items-center justify-center hover:bg-muted transition-colors">
                              <Minus className="h-2.5 w-2.5" />
                            </button>
                            <button onClick={() => addToCart(item.key)} className="w-6 h-6 rounded-md bg-primary/10 border border-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                              <Plus className="h-2.5 w-2.5 text-primary" />
                            </button>
                            <button onClick={() => clearFromCart(item.key)} className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-destructive/10 transition-colors ml-1">
                              <Trash2 className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>

              <div className="px-5 py-4 border-t border-border/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total mensal</span>
                  <span className="text-xl font-display font-bold text-primary">{formatPrice(totalPrice, lang)}</span>
                </div>
                <Button onClick={handleCheckout} disabled={totalAgents === 0} className="w-full gap-2 h-11 font-semibold">
                  <ShoppingCart className="h-4 w-4" />
                  {user ? "Confirmar Time" : "Criar Conta e Contratar"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-[10px] text-center text-muted-foreground/50">Pagamento seguro via PayPal • Cancele quando quiser</p>
              </div>
            </motion.div>

            {totalAgents === 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="mt-4 rounded-xl p-4 border border-border/5 bg-card"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary/60 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold mb-1">Não sabe por onde começar?</p>
                    <p className="text-[10px] text-muted-foreground mb-2">Veja nossos departamentos prontos ou use o guia de contratação.</p>
                    <div className="flex gap-2">
                      <Link to="/departamentos"><Button size="sm" variant="outline" className="h-7 text-[10px] px-2.5">Departamentos</Button></Link>
                      <Link to="/how-it-works"><Button size="sm" variant="ghost" className="h-7 text-[10px] px-2.5">Guia</Button></Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <CheckoutSummaryDialog data={checkoutData} onApprove={handleApproveCheckout} onCancel={() => setCheckoutData(null)} />
    </div>
  );
};

export default TeamBuilder;
