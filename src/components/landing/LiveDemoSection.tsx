/**
 * LiveDemoSection.tsx — Interactive "See an Agent Working Now" section for the landing page.
 * Visitor types a company name → simulated SDR agent works in real-time with typewriter effect.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, Terminal, CheckCircle2, Building2, Users, Mail, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

type DemoPhase = "idle" | "running" | "done";

interface DemoStep {
  icon: React.ElementType;
  text: string;
  delayMs: number;
}

function buildSteps(company: string): DemoStep[] {
  return [
    { icon: Building2, text: `Analisando empresa ${company}...`, delayMs: 1200 },
    { icon: Users, text: "Buscando decisores no LinkedIn...", delayMs: 1400 },
    { icon: Terminal, text: "Cruzando dados com CRM público...", delayMs: 1100 },
    { icon: Mail, text: "Gerando email personalizado...", delayMs: 1000 },
  ];
}

function buildEmail(company: string): string {
  return `Assunto: ${company} — Como escalar operações sem triplicar o time

Olá,

Notei que a ${company} está em fase de crescimento. Empresas nesse estágio costumam enfrentar um dilema: escalar rápido sem inflar a folha de pagamento.

Nossos agentes de IA resolvem isso — automatizam prospecção, suporte e análise como um departamento inteiro, funcionando 24h/dia.

Empresas similares à ${company} reduziram custos operacionais em até 60% nos primeiros 90 dias.

Posso te mostrar em 15 minutos como funciona para o seu setor?

Abraço,
Apollo — SDR Agent · Clauthor`;
}

export default function LiveDemoSection() {
  const [company, setCompany] = useState("");
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [currentStep, setCurrentStep] = useState(-1);
  const [typewriterText, setTypewriterText] = useState("");
  const [steps, setSteps] = useState<DemoStep[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const startDemo = useCallback(() => {
    const name = company.trim();
    if (!name) {
      inputRef.current?.focus();
      return;
    }
    const s = buildSteps(name);
    setSteps(s);
    setCurrentStep(0);
    setTypewriterText("");
    setPhase("running");
  }, [company]);

  // Progress through steps
  useEffect(() => {
    if (phase !== "running" || currentStep < 0) return;

    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, steps[currentStep].delayMs);
      return () => clearTimeout(timer);
    }

    // All steps done → start typewriter for email
    if (currentStep === steps.length) {
      const email = buildEmail(company.trim());
      let idx = 0;
      setTypewriterText("");
      const interval = setInterval(() => {
        idx++;
        setTypewriterText(email.slice(0, idx));
        if (idx >= email.length) {
          clearInterval(interval);
          setPhase("done");
        }
      }, 10);
      return () => clearInterval(interval);
    }
  }, [phase, currentStep, steps, company]);

  const reset = () => {
    setPhase("idle");
    setCurrentStep(-1);
    setTypewriterText("");
    setCompany("");
  };

  return (
    <section className="py-16 sm:py-24 px-4 relative overflow-hidden" aria-label="Live Demo">
      {/* Subtle background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
            <span className="font-mono text-[11px] sm:text-[10px] uppercase tracking-[0.3em] text-primary/60">LIVE DEMO</span>
            <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
          </div>
          <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3">
            Veja um Agente Trabalhando <span className="text-primary">Agora</span>
          </h2>
          <p className="font-mono text-sm sm:text-base text-muted-foreground">
            Sem login. Sem cadastro. <span className="text-foreground/80 font-medium">Só resultado.</span>
          </p>
        </motion.div>

        {/* Terminal panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden shadow-xl shadow-primary/5"
        >
          {/* Terminal header */}
          <div className="px-4 sm:px-5 py-3 border-b border-border/50 flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-accent-amber/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-accent-emerald/60" />
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Terminal className="w-3.5 h-3.5 text-primary/50" strokeWidth={1.5} />
              <span className="font-mono text-[10px] text-muted-foreground truncate">sdr-agent@clauthor ~ /prospect</span>
            </div>
            {phase !== "idle" && (
              <button onClick={reset} className="font-mono text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors">
                [reset]
              </button>
            )}
          </div>

          {/* Terminal body */}
          <div className="p-4 sm:p-6 min-h-[280px] sm:min-h-[320px]">
            {/* Input phase */}
            <AnimatePresence mode="wait">
              {phase === "idle" && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <p className="font-mono text-xs sm:text-sm text-muted-foreground">
                    <span className="text-primary">$</span> Digite o nome de uma empresa para ver o agente em ação:
                  </p>
                  <div className="flex gap-2 sm:gap-3">
                    <input
                      ref={inputRef}
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && startDemo()}
                      placeholder="Ex: TechNova, Acme Corp..."
                      className="flex-1 bg-muted/10 border border-border rounded-xl px-4 py-3 font-mono text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 transition-colors"
                      maxLength={50}
                    />
                    <button
                      onClick={startDemo}
                      disabled={!company.trim()}
                      className="px-4 sm:px-6 py-3 rounded-xl bg-primary text-primary-foreground font-mono text-xs sm:text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-30 shadow-lg shadow-primary/20 shrink-0"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Rodar Agente</span>
                      <span className="sm:hidden">Rodar</span>
                    </button>
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground/40 text-center">
                    ↑ Experimente com qualquer empresa — a simulação é instantânea
                  </p>
                </motion.div>
              )}

              {(phase === "running" || phase === "done") && (
                <motion.div
                  key="running"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {/* Steps */}
                  {steps.map((step, idx) => {
                    if (idx > currentStep && currentStep < steps.length) return null;
                    const StepIcon = step.icon;
                    const completed = idx < currentStep || currentStep >= steps.length;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex items-center gap-2.5"
                      >
                        {completed ? (
                          <CheckCircle2 className="w-4 h-4 text-accent-emerald shrink-0" />
                        ) : (
                          <motion.div
                            className="w-4 h-4 rounded-full border-2 border-primary/40 border-t-primary shrink-0"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          />
                        )}
                        <span className={`font-mono text-xs ${completed ? "text-accent-emerald" : "text-primary"}`}>
                          {step.text}
                        </span>
                      </motion.div>
                    );
                  })}

                  {/* Email output */}
                  {currentStep >= steps.length && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 bg-muted/10 border border-border/50 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/30">
                        <Mail className="w-3.5 h-3.5 text-primary/60" />
                        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Output — Email gerado</span>
                      </div>
                      <pre className="font-mono text-[11px] sm:text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">
                        {typewriterText}
                        {phase === "running" && (
                          <motion.span
                            className="inline-block w-[5px] h-[13px] bg-primary/70 ml-[1px] align-middle"
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                          />
                        )}
                      </pre>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* CTA after demo completes */}
        <AnimatePresence>
          {phase === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 text-center space-y-5"
            >
              <p className="font-mono text-sm sm:text-base text-muted-foreground">
                <Sparkles className="w-4 h-4 text-primary inline mr-1.5 -mt-0.5" />
                Seu SDR Agent pode fazer isso para <span className="text-foreground font-bold">100 empresas por dia</span>. Automaticamente.
              </p>
              <Link to="/waitlist">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-mono text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                >
                  Quero esse agente trabalhando para mim
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
