import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, Brain, Link as LinkIcon, Sparkles, 
  Send, Activity, Database, CheckCircle2,
  Terminal, Cpu, ArrowRight, ShieldCheck,
  Zap, Workflow, MessageSquare, LineChart, Users, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import TeachAgentsModal from "./TeachAgentsModal";

interface ClientCommandCenterProps {
  activeAgents: number;
  totalExecutions: number;
  totalTokensUsed: number;
  usagePercentage: number;
  estimatedSavings: number;
  credits: any;
  remainingCredits: number;
  agents: any[];
  subscriptions: any[];
  recentLogs: any[];
  tokenUsage: any[];
  onNavigate?: (section: string) => void;
}

const suggestions = [
  { icon: Users, text: "Prospectar leads" },
  { icon: Zap, text: "Criar campanha" },
  { icon: LineChart, text: "Analisar dados" },
  { icon: MessageSquare, text: "Melhorar suporte" },
  { icon: Database, text: "Relatório financeiro" },
  { icon: Workflow, text: "Automatizar processos" },
];

const executionSteps = [
  "Analisando objetivo e contexto",
  "Selecionando especialistas e criando estratégia",
  "Processando dados e gerando conteúdo",
  "Orquestrando execução entre agentes",
  "Finalizando e preparando relatório"
];

const ClientCommandCenter = ({
  activeAgents,
  agents = [],
  onNavigate,
}: ClientCommandCenterProps) => {
  const [command, setCommand] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showTeachModal, setShowTeachModal] = useState(false);
  
  const hasKnowledge = agents.some(a => a.knowledge_base || (a.integrations && a.integrations.length > 0));

  const handleCommand = (cmd: string) => {
    if (!cmd.trim()) return;
    setCommand(cmd);
    setIsExecuting(true);
    setCurrentStep(0);
    setProgress(0);
  };

  useEffect(() => {
    if (isExecuting && currentStep < executionSteps.length) {
      const stepDuration = 2000;
      const interval = 50; 
      const increments = stepDuration / interval;
      let currentIncrement = 0;

      const timer = setInterval(() => {
        currentIncrement++;
        setProgress(() => {
          const baseProgress = (currentStep / executionSteps.length) * 100;
          const stepProgress = (currentIncrement / increments) * (100 / executionSteps.length);
          return Math.min(baseProgress + stepProgress, 100);
        });

        if (currentIncrement >= increments) {
          clearInterval(timer);
          if (currentStep < executionSteps.length - 1) {
            setCurrentStep(s => s + 1);
          } else {
            setTimeout(() => {
              setIsExecuting(false);
              setCommand("");
              setProgress(0);
              setCurrentStep(0);
            }, 3000);
          }
        }
      }, interval);

      return () => clearInterval(timer);
    }
  }, [isExecuting, currentStep]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 pb-6">
      {/* Teach Agents Modal */}
      <TeachAgentsModal
        open={showTeachModal}
        onClose={() => setShowTeachModal(false)}
        onNavigateKnowledge={() => onNavigate?.("knowledge-base")}
      />

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Agentes Ativos", value: String(activeAgents), icon: Bot, sub: "Operando", color: "primary" },
          { label: "Conhecimento", value: hasKnowledge ? "Ativa" : "Vazia", icon: Brain, sub: hasKnowledge ? "Sincronizada" : "Requer atenção", color: "muted" },
          { label: "Integrações", value: "0", icon: LinkIcon, sub: "Prontas", color: "muted" },
          { label: "Rede", value: "100%", icon: Cpu, sub: "Otimizada", color: "primary" },
        ].map((card, i) => (
          <motion.div 
            key={card.label}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card/40 border border-border/40 rounded-xl p-4 backdrop-blur-md flex flex-col gap-1.5 relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[9px] font-mono uppercase tracking-widest font-semibold">{card.label}</span>
              <card.icon className="h-3.5 w-3.5 text-primary/70" />
            </div>
            <div className="text-2xl font-display font-bold text-foreground tracking-tight">{card.value}</div>
            <div className="text-[10px] text-muted-foreground font-medium">{card.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Teach Agents Alert */}
      {!hasKnowledge && !isExecuting && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-destructive/10 to-transparent border border-destructive/30 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div>
            <h3 className="text-lg font-display font-bold text-destructive flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Seus agentes ainda não conhecem sua empresa
            </h3>
            <p className="text-sm text-muted-foreground mt-1.5">
              Conecte seu site, documentos ou CRM para que a inteligência artificial tome decisões precisas pelo seu negócio.
            </p>
          </div>
          <Button 
            onClick={() => setShowTeachModal(true)} 
            className="shrink-0 shadow-lg"
          >
            Ensinar meus agentes <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Main Command Area */}
      <div className="relative mt-6 mb-4">
        <AnimatePresence mode="wait">
          {!isExecuting ? (
            <motion.div 
              key="command-input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center space-y-5"
            >
              {/* Proactive AI Tip */}
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary cursor-pointer hover:bg-primary/15 transition-colors"
                onClick={() => handleCommand("Reativar 120 leads parados")}
              >
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span><strong className="font-semibold mr-1">Sugestão:</strong> Você tem 120 leads parados. Quer reativar?</span>
                <ChevronRight className="h-4 w-4 opacity-50" />
              </div>

              {/* The Giant Input */}
              <div className="w-full max-w-3xl relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition duration-500" />
                <div className="relative flex items-center bg-card/80 backdrop-blur-xl border border-primary/30 rounded-2xl p-2 shadow-xl">
                  <div className="p-3">
                    <Terminal className="h-5 w-5 text-primary/80" />
                  </div>
                  <input 
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCommand(command)}
                    placeholder="O que você quer que sua empresa faça agora?"
                    className="flex-1 bg-transparent border-none outline-none text-base md:text-lg font-display font-medium text-foreground placeholder:text-muted-foreground/40 px-2 h-14"
                  />
                  <Button 
                    size="lg" 
                    className="h-12 px-6 rounded-xl text-sm shadow-lg hover:scale-105 transition-transform"
                    onClick={() => handleCommand(command)}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl pt-4">
                {suggestions.map((sug, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleCommand(sug.text)}
                    className="flex items-center gap-2.5 px-5 py-3 rounded-xl border border-border/50 bg-card/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all duration-300 text-sm font-medium text-muted-foreground hover:shadow-[0_0_15px_hsl(var(--primary)/0.1)]"
                  >
                    <sug.icon className="h-4 w-4" />
                    {sug.text}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="execution-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-4xl mx-auto bg-card/90 backdrop-blur-xl border border-primary/40 rounded-3xl p-10 shadow-[0_0_50px_hsl(var(--primary)/0.15)] relative overflow-hidden"
            >
              {/* Scanline effect */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                <div className="w-full h-full bg-[linear-gradient(transparent_50%,hsl(var(--background)/0.1)_50%)] bg-[length:100%_4px] opacity-20" />
                <motion.div 
                  initial={{ top: "-20%" }}
                  animate={{ top: "120%" }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-40 bg-gradient-to-b from-transparent via-primary/10 to-transparent"
                />
              </div>

              <div className="relative z-10 space-y-10">
                <div className="flex items-start justify-between border-b border-border/50 pb-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                      </div>
                      <h2 className="text-3xl font-display font-bold">Missão Iniciada</h2>
                    </div>
                    <p className="text-muted-foreground text-xl font-mono mt-2 flex items-center gap-2">
                      <Terminal className="h-4 w-4 opacity-50" />
                      &ldquo;{command}&rdquo;
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-primary uppercase tracking-widest mb-1 font-semibold">Progresso Global</div>
                    <div className="text-4xl font-display font-bold text-foreground">
                      {Math.round(progress)}%
                    </div>
                  </div>
                </div>

                <Progress value={progress} className="h-3 bg-secondary border border-border/50 rounded-full overflow-hidden" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-2">
                  {/* Steps */}
                  <div className="space-y-5">
                    <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest font-semibold">Protocolo de Execução</h3>
                    <div className="space-y-3">
                      {executionSteps.map((step, idx) => {
                        const isActive = idx === currentStep;
                        const isDone = idx < currentStep;

                        return (
                          <div 
                            key={idx} 
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 relative overflow-hidden",
                              isActive ? "bg-primary/10 border-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.15)] text-primary" : 
                              isDone ? "bg-card border-border/40 text-muted-foreground" : 
                              "bg-transparent border-transparent text-muted-foreground/40"
                            )}
                          >
                            {isActive && (
                              <motion.div 
                                layoutId="active-step-glow"
                                className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"
                              />
                            )}
                            
                            {isDone ? (
                              <CheckCircle2 className="h-5 w-5 text-accent-foreground shrink-0" />
                            ) : isActive ? (
                              <Activity className="h-5 w-5 animate-pulse shrink-0" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-current shrink-0 opacity-50" />
                            )}
                            <div className="flex-1 font-medium text-sm">
                              <span className="font-mono text-[10px] opacity-50 mr-3 inline-block">[{idx + 1}/{executionSteps.length}]</span>
                              {step}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Agents Involved */}
                  <div className="space-y-5">
                    <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest font-semibold">Esquadrão Alocado</h3>
                    <div className="flex flex-col gap-4">
                      {[1, 2, 3].map((_, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.2 }}
                          className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 shadow-sm relative overflow-hidden"
                        >
                          {i <= currentStep % 3 && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.8)]" />
                          )}
                          <div className="flex items-center gap-4 pl-2">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                              <Bot className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm">Agente Especialista 0{i+1}</div>
                              <div className="text-xs text-muted-foreground font-mono mt-1">
                                {i <= currentStep % 3 ? "Processando..." : "Aguardando"}
                              </div>
                            </div>
                          </div>
                          {i <= currentStep % 3 && (
                            <div className="flex gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ClientCommandCenter;
