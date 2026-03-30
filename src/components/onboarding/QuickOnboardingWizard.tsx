import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Headphones, Users, PenTool, BarChart3, Sparkles,
  Bot, ArrowRight, CheckCircle2, Rocket, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface QuickOnboardingWizardProps {
  isOpen: boolean;
  onComplete: (agentSlug?: string) => void;
}

const challenges = [
  { id: "sales", label: "Prospecção de Clientes", sub: "Gere leads e agende reuniões no piloto automático", icon: Target, agent: "sdr_outbound", agentName: "SDR Outbound", agentDesc: "Prospecta, qualifica e agenda reuniões com leads ideais", agentResult: "30+ reuniões qualificadas/mês" },
  { id: "support", label: "Suporte ao Cliente", sub: "Respostas instantâneas 24/7 em qualquer canal", icon: Headphones, agent: "support_channel", agentName: "Suporte Omnichannel", agentDesc: "Resolve tickets e atende clientes em todos os canais", agentResult: "90% dos tickets resolvidos automaticamente" },
  { id: "hr", label: "Gestão de RH", sub: "Recrute, onboarde e engaje sua equipe", icon: Users, agent: "hr", agentName: "HR Manager", agentDesc: "Automatiza recrutamento, onboarding e gestão de pessoas", agentResult: "Redução de 60% no tempo de contratação" },
  { id: "marketing", label: "Marketing de Conteúdo", sub: "Crie posts, emails e campanhas que convertem", icon: PenTool, agent: "content", agentName: "Content Creator", agentDesc: "Gera conteúdo otimizado para todos os canais", agentResult: "50+ peças de conteúdo/semana" },
  { id: "data", label: "Análise de Dados", sub: "Dashboards e insights em tempo real", icon: BarChart3, agent: "data_analytics", agentName: "Data Analyst", agentDesc: "Analisa dados e gera relatórios com insights acionáveis", agentResult: "Decisões 3x mais rápidas baseadas em dados" },
  { id: "other", label: "Outro", sub: "Conte-nos seu desafio e indicamos o agente ideal", icon: Sparkles, agent: "orchestrator", agentName: "Orquestrador IA", agentDesc: "Coordena múltiplos agentes para qualquer tarefa", agentResult: "Automação completa do seu workflow" },
];

const setupTasks = [
  "Perfil criado",
  "Agente configurado",
  "Primeiras tarefas programadas",
  "Conectando aos seus canais",
];

const QuickOnboardingWizard = ({ isOpen, onComplete }: QuickOnboardingWizardProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<typeof challenges[0] | null>(null);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);

  // Step 3 animation
  useEffect(() => {
    if (step !== 2) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < setupTasks.length) {
        setCompletedTasks(prev => [...prev, i]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [step]);

  const markComplete = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ onboarding_completed: true } as any).eq("user_id", user.id);
  };

  const handleSkip = async () => {
    await markComplete();
    onComplete();
  };

  const handleSelectChallenge = (c: typeof challenges[0]) => {
    setSelected(c);
    setStep(1);
  };

  const handleWantAgent = () => {
    setStep(2);
    setCompletedTasks([]);
  };

  const handleFinish = async () => {
    await markComplete();
    toast.success("Seu agente está pronto! 🎉");
    onComplete(selected?.agent);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex items-center justify-center overflow-y-auto"
    >
      {/* BG */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 blur-[180px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-lg px-4 py-8">
        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {[0, 1, 2].map(i => (
            <div key={i} className={cn("flex-1 h-1 rounded-full transition-all", i <= step ? "bg-primary" : "bg-muted")} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 0 */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold">Qual é o maior desafio da sua empresa?</h2>
                <p className="text-sm text-muted-foreground">Escolha um e teremos um agente pronto em 60 segundos</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {challenges.map((c, i) => (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSelectChallenge(c)}
                    className="group p-4 rounded-xl border border-border/40 bg-card/40 hover:border-primary/40 hover:bg-primary/5 transition-all text-left hover:scale-[1.02]"
                  >
                    <c.icon className="h-5 w-5 text-primary mb-2" />
                    <p className="text-sm font-semibold leading-tight">{c.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{c.sub}</p>
                  </motion.button>
                ))}
              </div>

              <button onClick={handleSkip} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors pt-2">
                Pular e ir para o dashboard →
              </button>
            </motion.div>
          )}

          {/* STEP 1 */}
          {step === 1 && selected && (
            <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
              <div className="text-center space-y-2">
                <h2 className="font-display text-xl sm:text-2xl font-bold">
                  Perfeito! Seu agente ideal é:
                </h2>
              </div>

              <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-accent/5 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                    <Bot className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">{selected.agentName}</h3>
                    <p className="text-xs text-muted-foreground">{selected.agentDesc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-primary font-medium">{selected.agentResult}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button size="lg" className="w-full gap-2" onClick={handleWantAgent}>
                  Quero esse agente <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setStep(0)} className="text-xs text-muted-foreground">
                  ← Voltar
                </Button>
              </div>

              <button onClick={handleSkip} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
                Pular e ir para o dashboard →
              </button>
            </motion.div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="font-display text-xl sm:text-2xl font-bold">Configurando seu agente...</h2>
                <p className="text-sm text-muted-foreground">Isso leva apenas alguns segundos</p>
              </div>

              <div className="space-y-3">
                {setupTasks.map((task, i) => {
                  const done = completedTasks.includes(i);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: done ? 1 : 0.3, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/30 bg-card/30"
                    >
                      {done ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
                      )}
                      <span className={cn("text-sm", done ? "text-foreground" : "text-muted-foreground")}>{done ? "✅" : "⏳"} {task}</span>
                    </motion.div>
                  );
                })}
              </div>

              {completedTasks.length >= setupTasks.length && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3 pt-2">
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary">🎉 Seu agente está pronto!</p>
                  </div>
                  <Button size="lg" className="w-full gap-2" onClick={handleFinish}>
                    Diga olá para ele <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              <button onClick={handleSkip} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
                Pular e ir para o dashboard →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default QuickOnboardingWizard;
