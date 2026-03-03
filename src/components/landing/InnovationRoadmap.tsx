import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Brain, Network, TrendingUp, Mic, Workflow, Lightbulb,
  BarChart3, Users, Copy, Code2, Sparkles, ChevronRight,
  Zap, Lock, Rocket, Timer, ArrowRight, X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Innovation {
  id: number;
  icon: LucideIcon;
  name: string;
  tagline: string;
  impact: string;
  impactColor: string;
  quarter: string;
}

const innovations: Innovation[] = [
  { id: 1, icon: Brain, name: "Agent Memory", tagline: "Agentes que lembram tudo entre sessões", impact: "Alto", impactColor: "text-amber-400", quarter: "Q2 2026" },
  { id: 2, icon: Network, name: "Agent-to-Agent Protocol", tagline: "Delegação automática entre agentes via A2A", impact: "Alto", impactColor: "text-amber-400", quarter: "Q3 2026" },
  { id: 3, icon: TrendingUp, name: "Skills Tree", tagline: "Agentes evoluem automaticamente com o uso", impact: "Alto", impactColor: "text-amber-400", quarter: "Q2 2026" },
  { id: 4, icon: Mic, name: "Voice-First Dashboard", tagline: "\"Hey THOR, quanto gastei esse mês?\"", impact: "Médio", impactColor: "text-blue-400", quarter: "Q2 2026" },
  { id: 5, icon: Workflow, name: "Workflows Builder", tagline: "Automações multi-agente drag-and-drop", impact: "Muito Alto", impactColor: "text-primary", quarter: "Q3 2026" },
  { id: 6, icon: Lightbulb, name: "Predictive Suggestions", tagline: "IA sugere qual agente contratar com base nos seus dados", impact: "Alto", impactColor: "text-amber-400", quarter: "Q3 2026" },
  { id: 7, icon: BarChart3, name: "Performance Benchmarks", tagline: "Compare seu agente com a média do mercado", impact: "Médio", impactColor: "text-blue-400", quarter: "Q2 2026" },
  { id: 8, icon: Users, name: "Real-time Collaboration", tagline: "Time inteiro na mesma conversa, ao vivo", impact: "Médio", impactColor: "text-blue-400", quarter: "Q3 2026" },
  { id: 9, icon: Copy, name: "Agent Cloning", tagline: "Duplique agentes treinados com um clique", impact: "Médio", impactColor: "text-blue-400", quarter: "Q2 2026" },
  { id: 10, icon: Code2, name: "Embedded Widget", tagline: "Coloque seu agente direto no seu site", impact: "Muito Alto", impactColor: "text-primary", quarter: "Q3 2026" },
];

const InnovationRoadmap = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-rotate the highlight
  useEffect(() => {
    if (isExpanded) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % innovations.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isExpanded]);

  const active = innovations[activeIdx];

  return (
    <section className="py-20 sm:py-28 px-4 relative overflow-hidden" aria-label="Innovation Roadmap">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/[0.05] backdrop-blur-sm mb-6">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary animate-ping opacity-50" />
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
              Roadmap de Inovação
            </span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4">
            O futuro já está sendo{" "}
            <span className="text-primary">construído</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            10 inovações que vão redefinir como você trabalha com agentes de IA.
            Cada uma pensada para multiplicar seus resultados.
          </p>
        </motion.div>

        {/* Featured innovation — rotating spotlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent backdrop-blur-sm p-8 sm:p-10 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            
            {/* Progress dots */}
            <div className="flex items-center gap-1.5 mb-6">
              {innovations.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === activeIdx ? "w-8 bg-primary" : "w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                  }`}
                  aria-label={`Innovation ${i + 1}`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col sm:flex-row items-start gap-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                  <active.icon className="h-8 w-8 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-display text-xl sm:text-2xl font-bold">{active.name}</h3>
                    <span className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      active.impact === "Muito Alto" 
                        ? "border-primary/30 bg-primary/10 text-primary" 
                        : "border-border bg-muted/50 text-muted-foreground"
                    }`}>
                      {active.impact}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      {active.quarter}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {active.tagline}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary/50 flex items-center gap-1.5">
                    <Lock className="h-3 w-3" />
                    Em Breve
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Grid — all innovations */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 mx-auto mb-8 px-5 py-2.5 rounded-xl border border-border bg-card/30 hover:border-primary/20 transition-all duration-300 group"
          >
            <Sparkles className="h-4 w-4 text-primary/60 group-hover:text-primary transition-colors" strokeWidth={1.5} />
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
              {isExpanded ? "Recolher roadmap" : "Ver todas as 10 inovações"}
            </span>
            <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            </motion.div>
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  {innovations.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => { setActiveIdx(i); setIsExpanded(false); }}
                      className={`group cursor-pointer relative p-4 rounded-xl border transition-all duration-300 ${
                        i === activeIdx
                          ? "border-primary/30 bg-primary/[0.06]"
                          : "border-border bg-card/30 hover:border-primary/15"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          i === activeIdx ? "bg-primary/15" : "bg-muted/50 group-hover:bg-primary/10"
                        }`}>
                          <item.icon className={`h-4 w-4 ${i === activeIdx ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"} transition-colors`} strokeWidth={1.5} />
                        </div>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/50">{item.quarter}</span>
                      </div>
                      <h4 className="font-display text-sm font-bold mb-1 truncate">{item.name}</h4>
                      <p className="font-mono text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{item.tagline}</p>
                      <div className="mt-2 flex items-center gap-1">
                        <Zap className={`h-3 w-3 ${item.impactColor}`} />
                        <span className={`font-mono text-[9px] uppercase tracking-wider ${item.impactColor}`}>{item.impact}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Bottom teaser */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <p className="font-mono text-[11px] text-muted-foreground/40 uppercase tracking-[0.2em]">
            Fique por dentro • Cadastre-se na waitlist para acesso antecipado
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default InnovationRoadmap;
