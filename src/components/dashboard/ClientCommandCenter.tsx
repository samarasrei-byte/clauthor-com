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
  
  // Verifica se há base de conhecimento (mock simplificado baseado em conexões)
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
      const stepDuration = 2000; // 2 segundos por etapa
      const interval = 50; 
      const increments = stepDuration / interval;
      let currentIncrement = 0;

      const timer = setInterval(() => {
        currentIncrement++;
        setProgress((prev) => {
          const baseProgress = (currentStep / executionSteps.length) * 100;
          const stepProgress = (currentIncrement / increments) * (100 / executionSteps.length);
          return Math.min(baseProgress + stepProgress, 100);
        });

        if (currentIncrement >= increments) {
          clearInterval(timer);
          if (currentStep < executionSteps.length - 1) {
            setCurrentStep(s => s + 1);
          } else {
            // Finalizado
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
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-12 pt-4">
      {/* Topo: Status da Inteligência da Empresa */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card/40 border border-primary/20 rounded-xl p-5 backdrop-blur-md flex flex-col gap-3 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent" />
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-mono uppercase tracking-widest font-semibold">Agentes Ativos</span>
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="text-4xl font-display font-bold text-foreground tracking-tight">
            {activeAgents}
          </div>
          <div className="text-xs text-primary/80 flex items-center gap-1.5 font-medium">
            <Activity className="h-3 w-3" /> Operando nominalmente
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card/40 border border-primary/20 rounded-xl p-5 backdrop-blur-md flex flex-col gap-3 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-transparent" />
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-mono uppercase tracking-widest font-semibold">Base de Conhecimento</span>
            <Brain className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-3xl font-display font-bold text-foreground tracking-tight">
            {hasKnowledge ? "Ativa" : "Vazia"}
          </div>
          <div className="text-xs text-blue-400/80 flex items-center gap-1.5 font-medium">
            <Database className="h-3 w-3" /> {hasKnowledge ? "Sincronizada" : "Requer atenção"}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card/40 border border-primary/20 rounded-xl p-5 backdrop-blur-md flex flex-col gap-3 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent" />
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-mono uppercase tracking-widest font-semibold">Integrações</span>
            <LinkIcon className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-4xl font-display font-bold text-foreground tracking-tight">
            0
          </div>
          <div className="text-xs text-emerald-400/80 flex items-center gap-1.5 font-medium">
            <Terminal className="h-3 w-3" /> Prontas para conexão
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-card/40 border border-primary/20 rounded-xl p-5 backdrop-blur-md flex flex-col gap-3 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-transparent" />
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-mono uppercase tracking-widest font-semibold">Status da Rede</span>
            <Cpu className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-4xl font-display font-bold text-foreground tracking-tight">
            100%
          </div>
          <div className="text-xs text-purple-400/80 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="h-3 w-3" /> Sistemas otimizados
          </div>
        </motion.div>
      </div>

      {/* Warning/Teach Agents (If no knowledge) */}
      {!hasKnowledge && !isExecuting && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/30 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div>
            <h3 className="text-lg font-display font-bold text-orange-400 flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Seus agentes ainda não conhecem sua empresa
            </h3>
            <p className="text-sm text-muted-foreground mt-1.5">
              Conecte seu site, documentos ou CRM para que a inteligência artificial tome decisões precisas pelo seu negócio.
            </p>
          </div>
          <Button onClick={() => onNavigate?.('knowledge')} className="bg-orange-500 hover:bg-orange-600 text-white shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            Ensinar meus agentes <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Main Command Area */}
      <div className="relative mt-16 mb-12">
        <AnimatePresence mode="wait">
          {!isExecuting ? (
            <motion.div 
              key="command-input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center space-y-10"
            >
              {/* Proactive AI Tip */}
              <div 
                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary shadow-[0_0_20px_rgba(var(--primary),0.15)] cursor-pointer hover:bg-primary/15 transition-colors"
                onClick={() => handleCommand("Reativar 120 leads parados")}
              >
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span><strong className="font-semibold mr-1">Sugestão:</strong> Você tem 120 leads parados. Quer reativar?</span>
                <ChevronRight className="h-4 w-4 opacity-50" />
              </div>

              {/* The Giant Input */}
              <div className="w-full max-w-4xl relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-purple-500/30 to-primary/30 rounded-[2rem] blur-2xl opacity-40 group-hover:opacity-70 transition duration-1000 group-hover:duration-200" />
                <div className="relative flex items-center bg-card/80 backdrop-blur-xl border border-primary/30 rounded-[2rem] p-3 shadow-2xl">
                  <div className="p-5">
                    <Terminal className="h-8 w-8 text-primary/80" />
                  </div>
                  <input 
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCommand(command)}
                    placeholder="O que você quer que sua empresa faça agora?"
                    className="flex-1 bg-transparent border-none outline-none text-2xl md:text-3xl font-display font-medium text-foreground placeholder:text-muted-foreground/40 px-2 h-24"
                  />
                  <Button 
                    size="lg" 
                    className="h-20 px-10 rounded-2xl bg-primary text-primary-foreground text-xl shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:scale-105 transition-transform"
                    onClick={() => handleCommand(command)}
                  >
                    Executar <Send className="ml-3 h-6 w-6" />
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl pt-4">
                {suggestions.map((sug, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleCommand(sug.text)}
                    className="flex items-center gap-2.5 px-5 py-3 rounded-xl border border-border/50 bg-card/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all duration-300 text-sm font-medium text-muted-foreground hover:shadow-[0_0_15px_rgba(var(--primary),0.1)]"
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
              className="w-full max-w-4xl mx-auto bg-card/90 backdrop-blur-xl border border-primary/40 rounded-3xl p-10 shadow-[0_0_50px_rgba(var(--primary),0.15)] relative overflow-hidden"
            >
              {/* Scanline effect */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                <div className="w-full h-full bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20" />
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
                      "{command}"
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
                              isActive ? "bg-primary/10 border-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.15)] text-primary" : 
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
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
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
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
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
