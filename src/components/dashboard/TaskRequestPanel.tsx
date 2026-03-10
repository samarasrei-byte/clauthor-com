import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, MessageSquare, Compass, Target, Send, ChevronRight,
  Zap, Bot, ArrowRight, Lightbulb, Building2, TrendingUp, Users,
  Headphones, Megaphone, DollarSign, ShoppingCart, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskRequestPanelProps {
  contractedAgentSlugs: string[];
  onSubmitTask: (task: string, mode: string) => void;
  onSelectAgent: (slug: string) => void;
}

type Mode = "simple" | "guided" | "strategic";

const QUICK_TASKS = [
  { icon: TrendingUp, label: "Gerar mais leads", color: "text-emerald-400" },
  { icon: Megaphone, label: "Criar campanha de vendas", color: "text-blue-400" },
  { icon: Headphones, label: "Melhorar meu atendimento", color: "text-purple-400" },
  { icon: DollarSign, label: "Análise financeira", color: "text-amber-400" },
  { icon: Users, label: "Prospectar clientes", color: "text-cyan-400" },
  { icon: ShoppingCart, label: "Lançar produto", color: "text-rose-400" },
  { icon: FileText, label: "Criar relatório", color: "text-indigo-400" },
  { icon: Building2, label: "Organizar minha empresa", color: "text-orange-400" },
];

const GUIDED_QUESTIONS: Record<number, { question: string; options: string[] }> = {
  0: {
    question: "Qual é o principal objetivo?",
    options: ["Vender mais", "Gerar leads", "Melhorar suporte", "Criar conteúdo", "Automatizar processos", "Analisar dados"],
  },
  1: {
    question: "Qual é o prazo?",
    options: ["Urgente (hoje)", "Esta semana", "Este mês", "Longo prazo"],
  },
  2: {
    question: "Qual o tamanho do impacto esperado?",
    options: ["Pequeno (teste)", "Médio (minha equipe)", "Grande (toda empresa)"],
  },
};

export default function TaskRequestPanel({ contractedAgentSlugs, onSubmitTask, onSelectAgent }: TaskRequestPanelProps) {
  const [mode, setMode] = useState<Mode>("simple");
  const [simpleInput, setSimpleInput] = useState("");
  const [guidedStep, setGuidedStep] = useState(0);
  const [guidedAnswers, setGuidedAnswers] = useState<string[]>([]);
  const [strategicInput, setStrategicInput] = useState("");
  const [strategicContext, setStrategicContext] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mode === "simple") inputRef.current?.focus();
  }, [mode]);

  const handleSimpleSubmit = () => {
    if (!simpleInput.trim()) return;
    onSubmitTask(simpleInput.trim(), "simple");
    setSimpleInput("");
  };

  const handleGuidedAnswer = (answer: string) => {
    const newAnswers = [...guidedAnswers, answer];
    setGuidedAnswers(newAnswers);
    if (guidedStep < Object.keys(GUIDED_QUESTIONS).length - 1) {
      setGuidedStep(guidedStep + 1);
    } else {
      const task = `[Modo Guiado] O usuário definiu:\n• Objetivo principal: ${newAnswers[0]}\n• Prazo desejado: ${newAnswers[1] || answer}\n• Escala de impacto: ${newAnswers[2] || answer}\n\nCom base nessas informações, elabore um plano de ação detalhado com os agentes mais adequados.`;
      onSubmitTask(task, "guided");
      toast.success("Enviando para o THOR...", { description: "Seu objetivo foi registrado. Os agentes serão acionados." });
      setGuidedStep(0);
      setGuidedAnswers([]);
    }
  };

  const handleStrategicSubmit = () => {
    if (!strategicInput.trim()) return;
    const task = strategicContext
      ? `${strategicInput.trim()}\n\nContexto adicional: ${strategicContext.trim()}`
      : strategicInput.trim();
    onSubmitTask(task, "strategic");
    setStrategicInput("");
    setStrategicContext("");
  };

  return (
    <div className="rounded-2xl border border-border/20 bg-card/20 backdrop-blur-sm overflow-hidden">
      {/* Mode selector */}
      <div className="flex border-b border-border/10">
        {(["simple", "guided", "strategic"] as Mode[]).map((m) => {
          const icons: Record<Mode, any> = { simple: MessageSquare, guided: Compass, strategic: Target };
          const labels: Record<Mode, string> = { simple: "Simples", guided: "Guiado", strategic: "Estratégico" };
          const descs: Record<Mode, string> = {
            simple: "Diga o que precisa",
            guided: "Responda perguntas",
            strategic: "Defina um objetivo"
          };
          const Icon = icons[m];
          return (
            <button
              key={m}
              onClick={() => { setMode(m); setGuidedStep(0); setGuidedAnswers([]); }}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 px-2 text-xs transition-all border-b-2",
                mode === m
                  ? "border-primary text-foreground bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/10"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="font-semibold">{labels[m]}</span>
              <span className="text-[9px] opacity-60 hidden sm:block">{descs[m]}</span>
            </button>
          );
        })}
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {/* === SIMPLE MODE === */}
          {mode === "simple" && (
            <motion.div
              key="simple"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">O que você precisa resolver?</p>
                  <p className="text-xs text-muted-foreground">Descreva em uma frase. Os agentes certos serão acionados automaticamente.</p>
                </div>
              </div>

              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={simpleInput}
                  onChange={(e) => setSimpleInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSimpleSubmit(); } }}
                  placeholder='Ex: "Quero criar uma campanha para a Copa do Mundo"'
                  rows={2}
                  className="w-full px-4 py-3 pr-12 text-sm rounded-xl bg-background/60 border border-border/40 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all resize-none"
                />
                <button
                  onClick={handleSimpleSubmit}
                  disabled={!simpleInput.trim()}
                  className="absolute right-2 bottom-2 w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Quick tasks */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Tarefas populares</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TASKS.map(({ icon: Icon, label, color }) => (
                    <button
                      key={label}
                      onClick={() => { onSubmitTask(label, "simple"); }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded-lg bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors border border-border/10"
                    >
                      <Icon className={cn("h-3 w-3", color)} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* === GUIDED MODE === */}
          {mode === "guided" && (
            <motion.div
              key="guided"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Compass className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Vamos entender melhor</p>
                  <p className="text-xs text-muted-foreground">Responda 3 perguntas rápidas para acionarmos os agentes certos.</p>
                </div>
              </div>

              {/* Progress */}
              <div className="flex gap-1">
                {Object.keys(GUIDED_QUESTIONS).map((_, i) => (
                  <div key={i} className={cn(
                    "h-1 flex-1 rounded-full transition-all",
                    i < guidedStep ? "bg-primary" : i === guidedStep ? "bg-primary/50" : "bg-border/30"
                  )} />
                ))}
              </div>

              {/* Previous answers */}
              {guidedAnswers.length > 0 && (
                <div className="space-y-1">
                  {guidedAnswers.map((ans, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="text-primary/60">✓</span>
                      <span>{GUIDED_QUESTIONS[i].question}</span>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">{ans}</Badge>
                    </div>
                  ))}
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={guidedStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <p className="font-semibold text-sm">{GUIDED_QUESTIONS[guidedStep]?.question}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {GUIDED_QUESTIONS[guidedStep]?.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleGuidedAnswer(opt)}
                        className="flex items-center justify-between px-3 py-2.5 text-sm rounded-xl border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                      >
                        <span>{opt}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {guidedStep > 0 && (
                <button
                  onClick={() => { setGuidedStep(guidedStep - 1); setGuidedAnswers(guidedAnswers.slice(0, -1)); }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Voltar
                </button>
              )}
            </motion.div>
          )}

          {/* === STRATEGIC MODE === */}
          {mode === "strategic" && (
            <motion.div
              key="strategic"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Target className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Defina um objetivo estratégico</p>
                  <p className="text-xs text-muted-foreground">Descreva um objetivo maior. A IA vai decompor em tarefas e acionar os especialistas.</p>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Objetivo principal</label>
                <textarea
                  value={strategicInput}
                  onChange={(e) => setStrategicInput(e.target.value)}
                  placeholder="Ex: Quero dobrar as vendas no próximo trimestre usando IA para prospecção e automação de follow-up..."
                  rows={3}
                  className="w-full px-4 py-3 text-sm rounded-xl bg-background/60 border border-border/40 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Contexto da empresa (opcional)</label>
                <textarea
                  value={strategicContext}
                  onChange={(e) => setStrategicContext(e.target.value)}
                  placeholder="Ex: Somos uma empresa B2B com 50 funcionários, atuamos em SaaS..."
                  rows={2}
                  className="w-full px-4 py-3 text-sm rounded-xl bg-background/60 border border-border/40 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all resize-none"
                />
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                <Lightbulb className="h-3.5 w-3.5 text-purple-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground">
                  Modo estratégico ativa automaticamente múltiplos agentes especializados que colaboram para entregar um plano completo.
                </p>
              </div>

              <Button
                onClick={handleStrategicSubmit}
                disabled={!strategicInput.trim()}
                className="w-full glow gap-2"
              >
                <Zap className="h-4 w-4" />
                Ativar Agentes Estratégicos
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
