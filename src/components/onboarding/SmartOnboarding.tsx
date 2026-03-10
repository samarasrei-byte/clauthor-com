import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Sparkles, ArrowRight, X, CheckCircle2, ChevronRight, ChevronLeft,
  Building2, ShoppingCart, Code, Briefcase, HeartHandshake,
  GraduationCap, Factory, Rocket, Target, Zap, Shield,
  Users, MessageSquare, BarChart3, Headphones, PenTool,
  Receipt, Globe, DollarSign, Megaphone, LineChart, Cpu,
  HelpCircle, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SquadConsultant from "@/components/pricing/SquadConsultant";

/* ─── Typing Hook ─── */
const useTyping = (text: string, speed = 30, delay = 0) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(""); setDone(false);
    let i = 0;
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
        else { setDone(true); clearInterval(iv); }
      }, speed);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [text, speed, delay]);
  return { displayed, done };
};

/* ─── Data ─── */
const industries = [
  { id: "saas", label: "SaaS / Tech", icon: Code, gradient: "from-cyan-500 to-blue-600" },
  { id: "ecommerce", label: "E-commerce", icon: ShoppingCart, gradient: "from-emerald-500 to-teal-600" },
  { id: "services", label: "Serviços", icon: Briefcase, gradient: "from-amber-500 to-orange-600" },
  { id: "health", label: "Saúde", icon: HeartHandshake, gradient: "from-rose-500 to-pink-600" },
  { id: "education", label: "Educação", icon: GraduationCap, gradient: "from-violet-500 to-purple-600" },
  { id: "industry", label: "Indústria", icon: Factory, gradient: "from-slate-400 to-zinc-600" },
  { id: "startup", label: "Startup", icon: Rocket, gradient: "from-primary to-primary-glow" },
  { id: "agency", label: "Agência / Marketing", icon: Target, gradient: "from-pink-500 to-fuchsia-600" },
  { id: "retail", label: "Varejo", icon: Building2, gradient: "from-orange-500 to-red-600" },
  { id: "finance", label: "Finanças / Contábil", icon: Receipt, gradient: "from-yellow-500 to-amber-600" },
  { id: "logistics", label: "Logística", icon: Globe, gradient: "from-sky-500 to-indigo-600" },
  { id: "other", label: "Outro", icon: Sparkles, gradient: "from-muted to-muted-foreground" },
];

const popularChallenges = new Set(["sales", "support", "marketing"]);

const challenges = [
  { id: "sales", label: "Sell more and prospect clients", icon: DollarSign, agents: ["sales", "sdr_outbound", "voice_ai", "crm_manager"], dept: "Sales" },
  { id: "support", label: "24/7 customer support", icon: Headphones, agents: ["support_channel", "omnichannel", "voice_support", "rag"], dept: "Support" },
  { id: "marketing", label: "Create content and attract leads", icon: Megaphone, agents: ["content", "seo_growth", "marketing_automation", "media_buyer"], dept: "Marketing" },
  { id: "finance", label: "Financial control and billing", icon: Receipt, agents: ["revenue", "ai_cfo", "data_analytics"], dept: "Finance" },
  { id: "operations", label: "Organize processes and projects", icon: BarChart3, agents: ["orchestrator", "project_management", "scheduler"], dept: "Operations" },
  { id: "hr", label: "Recruit and train your team", icon: Users, agents: ["hr", "training", "people_analytics"], dept: "HR" },
  { id: "tech", label: "Develop software or infrastructure", icon: Cpu, agents: ["coding", "computer", "data_engineer"], dept: "Technology" },
  { id: "creative", label: "Design, video and branding", icon: PenTool, agents: ["creative_design", "video_production", "branding"], dept: "Creative" },
  { id: "legal", label: "Legal and compliance", icon: Shield, agents: ["legal", "contract_analyst", "compliance_officer"], dept: "Legal" },
  { id: "ecommerce", label: "Scale e-commerce and traffic", icon: LineChart, agents: ["ecommerce", "paid_traffic", "affiliate_manager"], dept: "E-commerce" },
];

const teamSizes = [
  { id: "micro", label: "Just me (Freelancer)", maxAgents: 2, savings: "$600" },
  { id: "small", label: "2-10 people", maxAgents: 4, savings: "$2.4k" },
  { id: "medium", label: "11-50 people", maxAgents: 7, savings: "$7k" },
  { id: "large", label: "50+ people", maxAgents: 12, savings: "$16k+" },
];

interface SmartOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

const SmartOnboarding = ({ isOpen, onClose }: SmartOnboardingProps) => {
  const [phase, setPhase] = useState(0);
  const [industry, setIndustry] = useState("");
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState("");
  const [extraAgents, setExtraAgents] = useState<string[]>([]);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Chat-like messages
  const messages = [
    "Hello! Welcome to CLAUTHOR.",
    "Let's build the ideal team for your company in under 1 minute.",
    "To get started, what's your company's industry?",
  ];

  const msg0 = useTyping(messages[0], 25, 400);
  const msg1 = useTyping(messages[1], 20, msg0.done ? 200 : 99999);
  const msg2 = useTyping(messages[2], 25, msg1.done ? 300 : 99999);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [phase, msg0.done, msg1.done, msg2.done]);

  if (!isOpen) return null;

  const toggleChallenge = (id: string) => {
    setSelectedChallenges(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const getRecommendedAgents = () => {
    const agentSet = new Set<string>();
    selectedChallenges.forEach(c => {
      const ch = challenges.find(ch => ch.id === c);
      ch?.agents.forEach(a => agentSet.add(a));
    });
    const max = teamSizes.find(t => t.id === teamSize)?.maxAgents || 4;
    return Array.from(agentSet).slice(0, max);
  };

  const getDiscount = () => {
    const count = getRecommendedAgents().length;
    if (count >= 10) return { pct: 35, label: "35% off — Enterprise Squad" };
    if (count >= 7) return { pct: 30, label: "30% off — Power Squad" };
    if (count >= 5) return { pct: 20, label: "20% off — Growth Squad" };
    if (count >= 3) return { pct: 10, label: "10% off — Starter Squad" };
    return { pct: 0, label: "Individual agent" };
  };

  const getDepts = () => {
    const depts = new Set<string>();
    selectedChallenges.forEach(c => {
      const ch = challenges.find(ch => ch.id === c);
      if (ch) depts.add(ch.dept);
    });
    return Array.from(depts);
  };

  const handleFinish = () => {
    const slugs = getRecommendedAgents();
    const allSlugs = [...new Set([...slugs, ...extraAgents])];
    onClose();
    navigate("/auth", {
      state: {
        signup: true,
        hireIntent: allSlugs.length > 0 ? {
          type: "agent" as const,
          label: `Squad ${industries.find(i => i.id === industry)?.label || "AI"} (${allSlugs.length} agents)`,
          slugs: allSlugs,
        } : undefined,
      },
    });
  };

  const handleViewLibrary = () => {
    onClose();
    navigate("/marketplace");
  };

  const totalPhases = 4;
  const progressPct = Math.round((phase / totalPhases) * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-2xl flex flex-col overflow-hidden"
      >
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 blur-[200px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/3 blur-[150px] rounded-full" />
        </div>

        {/* Header */}
        <div className="relative z-10 px-4 pt-4 pb-2">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="font-display font-bold text-xs tracking-wider uppercase text-foreground">
                  Build your team
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-muted-foreground">Online</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`h-1 w-8 rounded-full transition-all duration-500 ${
                      i <= phase ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 relative z-10">
          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              {/* ═══ PHASE 0: CONVERSATIONAL INTRO + INDUSTRY ═══ */}
              {phase === 0 && (
                <motion.div
                  key="p0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* Bot message 1 */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-card/60 border border-border rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%]">
                      <p className="text-sm">{msg0.displayed}{!msg0.done && <span className="animate-pulse text-primary">|</span>}</p>
                    </div>
                  </div>

                  {/* Bot message 2 */}
                  {msg0.done && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                      <div className="w-8 h-8 shrink-0" />
                      <div className="bg-card/60 border border-border rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%]">
                        <p className="text-sm">{msg1.displayed}{msg0.done && !msg1.done && <span className="animate-pulse text-primary">|</span>}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Bot message 3 */}
                  {msg1.done && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                      <div className="w-8 h-8 shrink-0" />
                      <div className="bg-card/60 border border-border rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%]">
                        <p className="text-sm">{msg2.displayed}{msg1.done && !msg2.done && <span className="animate-pulse text-primary">|</span>}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Industry selection */}
                  {msg2.done && (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-4">
                        {industries.map((ind, i) => (
                          <motion.button
                            key={ind.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.05 * i }}
                            onClick={() => { setIndustry(ind.id); setPhase(1); }}
                            className={`group p-3 rounded-xl border transition-all text-center hover:scale-[1.04] hover:shadow-[0_0_20px_hsl(var(--primary)/0.12)] ${
                              industry === ind.id
                                ? "border-primary/50 bg-primary/10 shadow-[0_0_25px_hsl(var(--primary)/0.15)]"
                                : "border-white/[0.08] bg-white/[0.06] hover:border-primary/30 hover:bg-white/[0.09]"
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ind.gradient} flex items-center justify-center mx-auto mb-2 opacity-85 group-hover:opacity-100 transition-opacity`}>
                              <ind.icon className="h-5 w-5 text-white" />
                            </div>
                            <p className="text-[11px] font-medium leading-tight">{ind.label}</p>
                          </motion.button>
                        ))}
                      </div>

                      {/* Shortcuts */}
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.5, type: "spring", stiffness: 120 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 p-4 rounded-2xl border border-border/40 bg-card/20 backdrop-blur-sm"
                      >
                        <motion.div
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7, duration: 0.4 }}
                        >
                          <Button
                            variant="outline"
                            onClick={() => setPhase(5)}
                            className="gap-2 rounded-xl border-primary/30 bg-primary/10 hover:bg-primary/20 text-sm h-12 px-6 font-semibold shadow-[0_0_20px_hsl(var(--primary)/0.1)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] transition-all hover:scale-[1.03] active:scale-[0.98]"
                          >
                            <HelpCircle className="h-4 w-4 text-primary" />
                            Não sei o que preciso — falar com IA
                          </Button>
                        </motion.div>
                        <div className="flex gap-2">
                          <motion.div
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.85, duration: 0.4 }}
                          >
                            <Button
                              variant="outline"
                              onClick={() => { onClose(); navigate("/marketplace"); }}
                              className="text-sm gap-1.5 rounded-xl h-12 px-5 border-border/60 hover:border-primary/30 hover:bg-primary/5 hover:scale-[1.03] active:scale-[0.98] transition-all"
                            >
                              Já sei — ver Agentes
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.0, duration: 0.4 }}
                          >
                            <Button
                              variant="outline"
                              onClick={() => { onClose(); navigate("/departamentos"); }}
                              className="text-sm gap-1.5 rounded-xl h-12 px-5 border-border/60 hover:border-primary/30 hover:bg-primary/5 hover:scale-[1.03] active:scale-[0.98] transition-all"
                            >
                              Já sei — ver Departamentos
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* ═══ PHASE 1: CHALLENGES ═══ */}
              {phase === 1 && (
                <motion.div
                  key="p1"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  className="space-y-4"
                >
                  {/* User reply bubble */}
                  <div className="flex gap-3 justify-end">
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3 max-w-[70%]">
                      <p className="text-sm">Minha empresa é do segmento <strong>{industries.find(i => i.id === industry)?.label}</strong></p>
                    </div>
                  </div>

                  {/* Bot response */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-card/60 border border-border rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%]">
                      <p className="text-sm">
                        Boa escolha! {industries.find(i => i.id === industry)?.label} é um setor com grande potencial de automação.
                        <br /><br />
                        Agora selecione: <strong>quais são seus maiores desafios?</strong>
                      </p>
                    </div>
                  </div>

                  {/* Challenge cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                    {challenges.map((ch, i) => {
                      const isSelected = selectedChallenges.includes(ch.id);
                      const isPopular = popularChallenges.has(ch.id);
                      return (
                        <motion.button
                          key={ch.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.04 * i }}
                          onClick={() => toggleChallenge(ch.id)}
                          className={`relative flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_hsl(var(--primary)/0.1)] ${
                            isSelected
                              ? "border-primary/50 bg-primary/10 ring-1 ring-primary/25 shadow-[0_0_25px_hsl(var(--primary)/0.12)]"
                              : "border-white/[0.08] bg-white/[0.06] hover:border-primary/30 hover:bg-white/[0.09]"
                          }`}
                        >
                          {isPopular && !isSelected && (
                            <span className="absolute -top-1.5 right-2 text-[8px] font-bold uppercase tracking-wider bg-primary/90 text-primary-foreground px-1.5 py-0.5 rounded-full">
                              Popular
                            </span>
                          )}
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? "bg-primary/20" : "bg-white/[0.06]"
                          }`}>
                            {isSelected ? (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            ) : (
                              <ch.icon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium leading-tight">{ch.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{ch.dept}</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => setPhase(0)} className="h-12 rounded-xl gap-1.5 px-4">
                      <ChevronLeft className="h-4 w-4" /> Voltar
                    </Button>
                    {selectedChallenges.length > 0 && (
                      <Button onClick={() => setPhase(2)} className="flex-1 h-12 glow rounded-xl gap-2">
                        Continuar ({selectedChallenges.length} selecionados)
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </motion.div>
                </motion.div>
              )}

              {/* ═══ PHASE 2: TEAM SIZE ═══ */}
              {phase === 2 && (
                <motion.div
                  key="p2"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  className="space-y-4"
                >
                  {/* User reply */}
                  <div className="flex gap-3 justify-end">
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3 max-w-[70%]">
                      <p className="text-sm">Preciso de ajuda com: <strong>{selectedChallenges.map(c => challenges.find(ch => ch.id === c)?.label).join(", ")}</strong></p>
                    </div>
                  </div>

                  {/* Bot response */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-card/60 border border-border rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%]">
                      <p className="text-sm">
                        Excelente seleção. Já temos um time forte para montar.
                        <br /><br />
                        Última pergunta: <strong>quantas pessoas tem na sua empresa?</strong> Isso define o tamanho do time.
                      </p>
                    </div>
                  </div>

                  {/* Team size options */}
                  <div className="space-y-2 mt-3">
                    {teamSizes.map((size, i) => (
                      <motion.button
                        key={size.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 * i }}
                        onClick={() => { setTeamSize(size.id); setPhase(3); }}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left hover:scale-[1.01] ${
                          teamSize === size.id
                            ? "border-primary/40 bg-primary/5"
                            : "border-border/50 bg-card/30 hover:border-primary/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                            <Users className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{size.label}</p>
                            <p className="text-[11px] text-muted-foreground">Até {size.maxAgents} agentes recomendados</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-primary/20 text-primary text-[10px] shrink-0">
                          Economia ~{size.savings}/mês
                        </Badge>
                      </motion.button>
                    ))}
                  </div>
                  <Button variant="outline" onClick={() => setPhase(1)} className="h-10 rounded-xl gap-1.5 px-4 mt-2">
                    <ChevronLeft className="h-4 w-4" /> Voltar
                  </Button>
                </motion.div>
              )}

              {/* ═══ PHASE 3: RESULT ═══ */}
              {phase === 3 && (
                <motion.div
                  key="p3"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  className="space-y-4"
                >
                  {/* User reply */}
                  <div className="flex gap-3 justify-end">
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3 max-w-[70%]">
                      <p className="text-sm">{teamSizes.find(t => t.id === teamSize)?.label}</p>
                    </div>
                  </div>

                  {/* Bot result */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-card/60 border border-border rounded-2xl rounded-bl-sm px-4 py-3 max-w-[90%] space-y-4">
                      <p className="text-sm">
                        <strong>Pronto! Aqui está o seu time personalizado:</strong>
                      </p>

                      {/* Squad card */}
                      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="font-display font-bold text-sm">
                              Squad {industries.find(i => i.id === industry)?.label}
                            </span>
                          </div>
                          {getDiscount().pct > 0 && (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                              {getDiscount().label}
                            </Badge>
                          )}
                        </div>

                        {/* Departments */}
                        <div className="flex flex-wrap gap-1.5">
                          {getDepts().map(dept => (
                            <Badge key={dept} variant="outline" className="border-border text-[10px]">
                              {dept}
                            </Badge>
                          ))}
                        </div>

                        {/* Agents */}
                        <div className="grid grid-cols-2 gap-2">
                          {getRecommendedAgents().map((agent, i) => (
                            <Tooltip key={agent}>
                              <TooltipTrigger asChild>
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.1 * i }}
                                  className="flex items-center gap-2 p-2.5 rounded-lg bg-background/50 border border-border/50 cursor-help"
                                >
                                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                                    <Bot className="h-3 w-3 text-primary" />
                                  </div>
                                  <span className="text-[11px] font-medium capitalize truncate">
                                    {agent.replace(/_/g, " ")}
                                  </span>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[250px] text-xs">
                                <p className="font-semibold mb-0.5">{t(`library_page.agents.${agent}_title`, { defaultValue: agent.replace(/_/g, " ") })}</p>
                                <p className="text-muted-foreground">{t(`library_page.agents.${agent}_desc`, { defaultValue: "Agente de IA especializado" })}</p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>

                        {/* Savings */}
                        <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
                          <Zap className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs text-muted-foreground">
                            Economia estimada: <strong className="text-foreground">{teamSizes.find(t => t.id === teamSize)?.savings}/mês</strong> vs. equipe CLT
                          </span>
                        </div>

                        {/* Price */}
                        <div className="flex items-center justify-between pt-2 border-t border-primary/10">
                          <span className="text-xs text-muted-foreground">Monthly investment:</span>
                          <div className="text-right">
                            {getDiscount().pct > 0 && (
                              <span className="text-[10px] text-muted-foreground line-through mr-2">
                                ${(getRecommendedAgents().length * 139).toLocaleString("en-US")}
                              </span>
                            )}
                            <span className="font-display font-bold text-sm text-primary">
                              ${Math.round(getRecommendedAgents().length * 139 * (1 - getDiscount().pct / 100)).toLocaleString("en-US")}/mo
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        You can also add individual agents below, or create your account to explore all of them.
                      </p>
                    </div>
                  </div>

                  {/* Individual agent picker */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 px-1">
                      <Plus className="h-3 w-3" />
                      Adicionar agentes individuais
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {[
                        "voice_ai", "orchestrator", "coding", "content", "seo_growth", 
                        "sales", "omnichannel", "hr", "legal", "ecommerce", 
                        "creative_design", "video_production", "data_analytics",
                        "marketing_automation", "paid_traffic", "customer_success",
                        "ai_cfo", "scheduler", "branding", "media_buyer"
                      ]
                        .filter(a => !getRecommendedAgents().includes(a))
                        .map((agent, i) => {
                          const isSelected = extraAgents.includes(agent);
                          return (
                            <Tooltip key={agent}>
                              <TooltipTrigger asChild>
                                <motion.button
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.02 * i }}
                                  onClick={() => setExtraAgents(prev => 
                                    prev.includes(agent) ? prev.filter(a => a !== agent) : [...prev, agent]
                                  )}
                                  className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all text-[11px] ${
                                    isSelected
                                      ? "border-primary/40 bg-primary/5"
                                      : "border-border/50 bg-card/30 hover:border-primary/20"
                                  }`}
                                >
                                  {isSelected ? (
                                    <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                                  ) : (
                                    <Bot className="h-3 w-3 text-muted-foreground shrink-0" />
                                  )}
                                  <span className="capitalize truncate">{agent.replace(/_/g, " ")}</span>
                                </motion.button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[250px] text-xs">
                                <p className="font-semibold mb-0.5">{t(`library_page.agents.${agent}_title`, { defaultValue: agent.replace(/_/g, " ") })}</p>
                                <p className="text-muted-foreground">{t(`library_page.agents.${agent}_desc`, { defaultValue: "Agente de IA especializado" })}</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                    </div>
                    {extraAgents.length > 0 && (
                      <p className="text-[10px] text-primary px-1">
                        +{extraAgents.length} agente{extraAgents.length > 1 ? "s" : ""} individual{extraAgents.length > 1 ? "is" : ""} adicionado{extraAgents.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>

                  {/* CTAs */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-3 pt-2"
                  >
                    <Button onClick={handleFinish} className="w-full h-13 glow rounded-xl gap-2 text-sm font-semibold">
                      <Rocket className="h-4 w-4" />
                      Criar conta e ativar meu Squad
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setPhase(2)} className="h-10 rounded-xl gap-1.5 px-4 text-xs">
                        <ChevronLeft className="h-3.5 w-3.5" /> Voltar
                      </Button>
                      <Button variant="outline" onClick={handleViewLibrary} className="flex-1 h-10 rounded-xl text-xs border-border/50">
                        Explorar 80+ agentes
                      </Button>
                      <Button variant="outline" onClick={() => { onClose(); navigate("/pricing"); }} className="flex-1 h-10 rounded-xl text-xs border-border/50">
                        Ver preços
                      </Button>
                    </div>
                    <Button variant="ghost" onClick={() => { setPhase(0); setIndustry(""); setSelectedChallenges([]); setTeamSize(""); setExtraAgents([]); }} className="w-full text-xs text-muted-foreground">
                      ← Recomeçar
                    </Button>
                  </motion.div>
                </motion.div>
              )}

               {/* ═══ PHASE 5: SQUAD CONSULTANT (IA REAL) ═══ */}
              {phase === 5 && (
                <motion.div
                  key="p5"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-4"
                >
                  {/* Bot intro */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-card/60 border border-border rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%]">
                      <p className="text-sm">
                        Sem problema! Nosso <strong>consultor especializado</strong> vai te orientar.
                        Conte sobre sua empresa e montamos o time ideal para você.
                      </p>
                    </div>
                  </div>

                  {/* Embedded SquadConsultant */}
                  <div className="rounded-2xl border border-border bg-card/40 p-4">
                    <SquadConsultant />
                  </div>

                  {/* Prominent CTA to signup */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3 pt-2"
                  >
                    <Button
                      onClick={() => {
                        onClose();
                        navigate("/auth", {
                          state: {
                            signup: true,
                            hireIntent: {
                              type: "agent" as const,
                              label: "Squad recomendado pelo consultor IA",
                              slugs: ["sales", "omnichannel", "customer_success"],
                            },
                          },
                        });
                      }}
                      className="w-full h-13 glow rounded-xl gap-2 text-sm font-semibold"
                    >
                      <Rocket className="h-4 w-4" />
                      Criar conta e contratar meu Squad
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setPhase(0)}
                        className="h-10 rounded-xl gap-1.5 px-4 text-xs"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Voltar ao início
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => { onClose(); navigate("/marketplace"); }}
                        className="flex-1 h-10 rounded-xl text-xs border-border/50"
                      >
                        Explorar todos os agentes
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SmartOnboarding;
