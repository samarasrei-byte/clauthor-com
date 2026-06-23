import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Settings, Zap, CheckCircle2, Sparkles } from "lucide-react";

interface DashboardWelcomeProps {
  userName?: string;
  hasAgents: boolean;
  hasIntegration: boolean;
  hasExecution: boolean;
}

const STORAGE_KEY = "clauthor_dashboard_welcomed";

const DashboardWelcome = ({ userName, hasAgents, hasIntegration, hasExecution }: DashboardWelcomeProps) => {
  const [visible, setVisible] = useState(false);
  const [celebrated, setCelebrated] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const steps = [
      { id: "agent", done: hasAgents },
      { id: "integration", done: hasIntegration },
      { id: "execution", done: hasExecution },
    ];
    steps.forEach(s => {
      if (s.done && !celebrated.has(s.id)) {
        setCelebrated(prev => new Set([...prev, s.id]));
      }
    });

    if (hasAgents && hasIntegration && hasExecution) {
      const t = setTimeout(() => {
        setVisible(false);
        localStorage.setItem(STORAGE_KEY, "true");
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [hasAgents, hasIntegration, hasExecution, celebrated]);

  if (!visible) return null;

  const steps = [
    { id: "agent", icon: Bot, label: "Escolha seu primeiro agente", done: hasAgents },
    { id: "integration", icon: Settings, label: "Configure uma integração", done: hasIntegration },
    { id: "execution", icon: Zap, label: "Veja sua primeira ação executada", done: hasExecution },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className="mb-6 rounded-xl border border-border bg-card p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" strokeWidth={2} />
          </div>
          <p className="text-sm text-foreground">
            {userName ? (
              <>Olá, <span className="font-semibold">{userName}</span>! Vamos configurar tudo.</>
            ) : (
              <>Bem-vindo ao CLAUTHOR! Vamos configurar tudo.</>
            )}
          </p>
          <button
            onClick={() => {
              setVisible(false);
              localStorage.setItem(STORAGE_KEY, "true");
            }}
            className="ml-auto text-muted-foreground/60 hover:text-foreground text-xs transition-colors"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2">
          {steps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                step.done
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-muted/30 border-border"
              }`}
            >
              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
                step.done ? "bg-emerald-500/15" : "bg-background border border-border"
              }`}>
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <step.icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                )}
              </div>
              <span className={`text-xs ${step.done ? "text-emerald-600 dark:text-emerald-400 line-through opacity-70" : "text-foreground/80"}`}>
                {i + 1}. {step.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DashboardWelcome;
