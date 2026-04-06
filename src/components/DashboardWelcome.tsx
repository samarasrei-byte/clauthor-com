import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Settings, Zap, CheckCircle2 } from "lucide-react";
import thorPhoto from "@/assets/kaelis-ai.webp";

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
        transition={{ duration: 0.5 }}
        className="mb-6 rounded-2xl border border-accent-violet/15 bg-gradient-to-r from-accent-violet/5 to-transparent p-5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-violet/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="flex items-center gap-3 mb-4 relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-accent-violet/30 shadow-lg shadow-accent-violet/20"
          >
            <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-foreground/90"
          >
            {userName ? (
              <>Olá, <span className="font-semibold text-primary">{userName}</span>! Vamos configurar tudo.</>
            ) : (
              <>Bem-vindo ao CLAUTHOR! Vamos configurar tudo.</>
            )}
          </motion.p>
          <button
            onClick={() => {
              setVisible(false);
              localStorage.setItem(STORAGE_KEY, "true");
            }}
            className="ml-auto text-muted-foreground/40 hover:text-muted-foreground text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 relative">
          {steps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.15 }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                step.done
                  ? "bg-accent-emerald/5 border border-accent-emerald/15"
                  : "bg-muted/10 border border-border/30"
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                step.done ? "bg-accent-emerald/15" : "bg-muted/30"
              }`}>
                {step.done ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.4 }}
                  >
                    <CheckCircle2 className="h-4 w-4 text-accent-emerald" />
                  </motion.div>
                ) : (
                  <step.icon className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={1.5} />
                )}
              </div>
              <span className={`text-xs font-mono ${step.done ? "text-accent-emerald line-through opacity-70" : "text-foreground/70"}`}>
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
