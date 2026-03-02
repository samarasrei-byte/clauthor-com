import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Sparkles, ArrowRight, X, CheckCircle2, ChevronRight,
  Building2, ShoppingCart, Code, Briefcase, HeartHandshake,
  GraduationCap, Factory, Rocket, Target, Zap, Shield,
  Users, MessageSquare, BarChart3, Headphones, PenTool,
  Receipt, Globe, DollarSign, Megaphone, LineChart, Cpu,
  HelpCircle, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
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

const challenges = [
  { id: "sales", label: "Vender mais e prospectar clientes", icon: DollarSign, agents: ["sales", "sdr_outbound", "voice_ai", "crm_manager"], dept: "Comercial" },
  { id: "support", label: "Atender clientes 24/7", icon: Headphones, agents: ["support_channel", "omnichannel", "voice_support", "rag"], dept: "Suporte" },
  { id: "marketing", label: "Criar conteúdo e atrair leads", icon: Megaphone, agents: ["content", "seo_growth", "marketing_automation", "media_buyer"], dept: "Marketing" },
  { id: "finance", label: "Controlar financeiro e cobranças", icon: Receipt, agents: ["revenue", "ai_cfo", "data_analytics"], dept: "Financeiro" },
  { id: "operations", label: "Organizar processos e projetos", icon: BarChart3, agents: ["orchestrator", "project_management", "scheduler"], dept: "Operações" },
  { id: "hr", label: "Recrutar e treinar equipe", icon: Users, agents: ["hr", "training", "people_analytics"], dept: "RH" },
  { id: "tech", label: "Desenvolver software ou infra", icon: Cpu, agents: ["coding", "computer", "data_engineer"], dept: "Tecnologia" },
  { id: "creative", label: "Design, vídeo e branding", icon: PenTool, agents: ["creative_design", "video_production", "branding"], dept: "Criação" },
  { id: "legal", label: "Jurídico e compliance", icon: Shield, agents: ["legal", "contract_analyst", "compliance_officer"], dept: "Jurídico" },
  { id: "ecommerce", label: "Escalar e-commerce e tráfego", icon: LineChart, agents: ["ecommerce", "paid_traffic", "affiliate_manager"], dept: "E-commerce" },
];

const teamSizes = [
  { id: "micro", label: "Só eu (MEI/Freelancer)", maxAgents: 2, savings: "R$ 3k" },
  { id: "small", label: "2-10 pessoas", maxAgents: 4, savings: "R$ 12k" },
  { id: "medium", label: "11-50 pessoas", maxAgents: 7, savings: "R$ 35k" },
  { id: "large", label: "50+ pessoas", maxAgents: 12, savings: "R$ 80k+" },
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Chat-like messages
  const messages = [
    "Olá! 👋 Sou o consultor de IA da CLAUTHOR.",
    "Vou te ajudar a montar o time de IA perfeito para sua empresa em menos de 1 minuto.",
    "Primeiro, me conta: qual é o segmento da sua empresa?",
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
    return { pct: 0, label: "Agente individual" };
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
          label: `Squad ${industries.find(i => i.id === industry)?.label || "IA"} (${allSlugs.length} agentes)`,
          slugs: allSlugs,
        } : undefined,
      },
    });
  };

  const handleViewLibrary = () => {
    onClose();
    navigate("/library");
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
                  Consultor IA
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
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4">
                        {industries.map((ind, i) => (
                          <motion.button
                            key={ind.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.05 * i }}
                            onClick={() => { setIndustry(ind.id); setPhase(1); }}
                            className={`group p-3 rounded-xl border transition-all text-center hover:scale-[1.03] ${
                              industry === ind.id
                                ? "border-primary/40 bg-primary/5"
                                : "border-border/50 bg-card/30 hover:border-primary/20"
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ind.gradient} flex items-center justify-center mx-auto mb-2 opacity-80 group-hover:opacity-100 transition-opacity`}>
                              <ind.icon className="h-5 w-5 text-white" />
                            </div>
                            <p className="text-[11px] font-medium leading-tight">{ind.label}</p>
                          </motion.button>
                        ))}
                      </div>

                      {/* Shortcuts */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-5">
                        <Button
                          variant="outline"
                          onClick={() => setPhase(5)}
                          className="gap-2 rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-sm h-11 px-5"
                        >
                          <HelpCircle className="h-4 w-4 text-primary" />
                          Não sei o que preciso — falar com IA
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => { onClose(); navigate("/library"); }}
                          className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                        >
                          Já sei o que preciso — ir direto
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
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
                        Ótimo! {industries.find(i => i.id === industry)?.label} é um setor que se beneficia muito de IA. 🔥
                        <br /><br />
                        Agora me diz: <strong>quais são seus maiores desafios?</strong> Selecione todos que se aplicam:
                      </p>
                    </div>
                  </div>

                  {/* Challenge cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {challenges.map((ch, i) => (
                      <motion.button
                        key={ch.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 * i }}
                        onClick={() => toggleChallenge(ch.id)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                          selectedChallenges.includes(ch.id)
                            ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                            : "border-border/50 bg-card/30 hover:border-primary/20"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          selectedChallenges.includes(ch.id) ? "bg-primary/15" : "bg-muted/50"
                        }`}>
                          {selectedChallenges.includes(ch.id) ? (
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
                    ))}
                  </div>

                  {selectedChallenges.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-2">
                      <Button onClick={() => setPhase(2)} className="w-full h-12 glow rounded-xl gap-2">
                        Continuar ({selectedChallenges.length} selecionados)
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}
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
                        Perfeito! Já consigo ver um squad poderoso se formando. ⚡
                        <br /><br />
                        Última pergunta: <strong>quantas pessoas tem na sua empresa?</strong> Isso ajuda a dimensionar o time de IA ideal.
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
                        🎯 <strong>Pronto! Aqui está o seu Squad de IA personalizado:</strong>
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
                              🔥 {getDiscount().label}
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
                            <motion.div
                              key={agent}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.1 * i }}
                              className="flex items-center gap-2 p-2.5 rounded-lg bg-background/50 border border-border/50"
                            >
                              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                                <Bot className="h-3 w-3 text-primary" />
                              </div>
                              <span className="text-[11px] font-medium capitalize truncate">
                                {agent.replace(/_/g, " ")}
                              </span>
                            </motion.div>
                          ))}
                        </div>

                        {/* Savings */}
                        <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
                          <Zap className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs text-muted-foreground">
                            Economia estimada: <strong className="text-foreground">{teamSizes.find(t => t.id === teamSize)?.savings}/mês</strong> vs. equipe CLT
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Você também pode adicionar agentes individuais abaixo, ou criar sua conta para explorar todos.
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
                            <motion.button
                              key={agent}
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
                        Sem problema! 😊 Nosso <strong>Consultor de IA</strong> vai te ajudar.
                        Conte sobre sua empresa e ele monta o squad ideal para você.
                      </p>
                    </div>
                  </div>

                  {/* Embedded SquadConsultant */}
                  <div className="rounded-2xl border border-border bg-card/40 p-4">
                    <SquadConsultant />
                  </div>

                  {/* Back */}
                  <div className="flex flex-col items-center gap-2 pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => setPhase(0)}
                      className="text-xs text-muted-foreground"
                    >
                      ← Voltar ao início
                    </Button>
                  </div>
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
