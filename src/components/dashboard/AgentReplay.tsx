import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Rewind, FastForward, Play, Pause, SkipBack, 
  Brain, Zap, CheckCircle2, AlertTriangle, ArrowRight,
  Clock, MessageSquare, Cpu, Database, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ReplayStep {
  id: string;
  type: "think" | "decide" | "execute" | "delegate" | "respond";
  label: string;
  detail: string;
  duration_ms: number;
  status: "success" | "warning" | "error";
  timestamp: string;
}

const stepIcons = {
  think: Brain,
  decide: Search,
  execute: Zap,
  delegate: ArrowRight,
  respond: MessageSquare,
};

const stepColors = {
  think: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  decide: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  execute: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  delegate: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  respond: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
};

const AgentReplay = () => {
  const { user } = useAuth();
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: logs = [] } = useQuery({
    queryKey: ["replay-logs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("execution_logs")
        .select("*, agent:agents(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  // Generate replay steps from log details
  const replaySteps: ReplayStep[] = useMemo(() => {
    if (!selectedLog) {
      // Demo steps
      return [
        { id: "1", type: "think", label: "Analisando contexto", detail: "Processando histórico de conversas e memória do agente para entender o objetivo da tarefa.", duration_ms: 450, status: "success", timestamp: "0.0s" },
        { id: "2", type: "think", label: "Consultando knowledge base", detail: "Buscando documentos relevantes na base de conhecimento: 3 resultados encontrados.", duration_ms: 280, status: "success", timestamp: "0.4s" },
        { id: "3", type: "decide", label: "Estratégia definida", detail: "Decidiu usar abordagem multi-step: primeiro pesquisar, depois sintetizar, por fim formatar resposta.", duration_ms: 120, status: "success", timestamp: "0.7s" },
        { id: "4", type: "execute", label: "Executando pesquisa", detail: "Consultou 5 fontes internas. Tempo de resposta: 340ms. Tokens consumidos: 1,250.", duration_ms: 340, status: "success", timestamp: "0.8s" },
        { id: "5", type: "delegate", label: "Delegando sub-tarefa", detail: "Enviou sub-tarefa 'formatação de relatório' para agente Copywriter IA (A2A).", duration_ms: 180, status: "success", timestamp: "1.2s" },
        { id: "6", type: "think", label: "Avaliando qualidade", detail: "Score de confiança: 94%. Verificação de alucinação: OK. Fontes verificadas: 3/3.", duration_ms: 200, status: "success", timestamp: "1.4s" },
        { id: "7", type: "respond", label: "Resposta enviada", detail: "Resposta final entregue ao usuário. Tempo total: 1.57s. Satisfação estimada: Alta.", duration_ms: 150, status: "success", timestamp: "1.6s" },
      ];
    }
    const log = logs.find((l: any) => l.id === selectedLog);
    if (!log) return [];
    const details = (log.details as any) || {};
    const steps: ReplayStep[] = [
      { id: "r1", type: "think", label: "Recebendo tarefa", detail: `Ação: ${log.action}`, duration_ms: 100, status: "success", timestamp: "0.0s" },
      { id: "r2", type: "decide", label: "Planejando execução", detail: details.strategy || "Análise de contexto e planejamento automático", duration_ms: 200, status: "success", timestamp: "0.1s" },
      { id: "r3", type: "execute", label: "Executando", detail: `Tempo: ${log.execution_time_ms || '?'}ms`, duration_ms: log.execution_time_ms || 500, status: log.status === "success" ? "success" : "error", timestamp: "0.3s" },
      { id: "r4", type: "respond", label: "Resultado", detail: `Status: ${log.status}`, duration_ms: 50, status: log.status === "success" ? "success" : "error", timestamp: `${((log.execution_time_ms || 500) + 300) / 1000}s` },
    ];
    return steps;
  }, [selectedLog, logs]);

  // Auto-play logic
  useState(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= replaySteps.length - 1) { setIsPlaying(false); return prev; }
        return prev + 1;
      });
    }, 1200);
    return () => clearInterval(interval);
  });

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "success") return <CheckCircle2 className="h-3 w-3 text-emerald-400" />;
    if (status === "warning") return <AlertTriangle className="h-3 w-3 text-amber-400" />;
    return <AlertTriangle className="h-3 w-3 text-red-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Rewind className="h-5 w-5 text-primary" />
            Agent Replay — Time Travel
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Visualize passo-a-passo o raciocínio dos seus agentes. Veja o que pensaram, decidiram e executaram.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
          <Cpu className="h-3 w-3 mr-1" /> EXCLUSIVO
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Log selector */}
        <Card className="p-4 space-y-3 bg-card/50 backdrop-blur border-border/30">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            Execuções Recentes
          </h3>
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {/* Demo option */}
            <button
              onClick={() => { setSelectedLog(null); setCurrentStep(0); }}
              className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs ${
                !selectedLog ? "border-primary/40 bg-primary/5" : "border-border/20 hover:border-border/40 bg-transparent"
              }`}
            >
              <div className="font-medium">🎬 Demo: SDR Outbound</div>
              <div className="text-muted-foreground text-[10px] mt-0.5">7 steps • 1.57s • Fluxo completo A2A</div>
            </button>
            {logs.map((log: any) => (
              <button
                key={log.id}
                onClick={() => { setSelectedLog(log.id); setCurrentStep(0); }}
                className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs ${
                  selectedLog === log.id ? "border-primary/40 bg-primary/5" : "border-border/20 hover:border-border/40 bg-transparent"
                }`}
              >
                <div className="font-medium truncate">{(log.agent as any)?.name || "Agente"}</div>
                <div className="text-muted-foreground text-[10px] mt-0.5 flex items-center gap-2">
                  <span>{log.action}</span>
                  <StatusIcon status={log.status} />
                  <span>{log.execution_time_ms ? `${log.execution_time_ms}ms` : ""}</span>
                </div>
              </button>
            ))}
            {logs.length === 0 && (
              <p className="text-[10px] text-muted-foreground text-center py-4">
                Sem execuções ainda. Use o demo acima ↑
              </p>
            )}
          </div>
        </Card>

        {/* Center: Visual replay */}
        <Card className="lg:col-span-2 p-5 bg-card/50 backdrop-blur border-border/30 space-y-4">
          {/* Transport controls */}
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCurrentStep(0)}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}>
              <Rewind className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              className="h-9 w-9 bg-primary/20 hover:bg-primary/30"
              onClick={() => {
                if (currentStep >= replaySteps.length - 1) setCurrentStep(0);
                setIsPlaying(!isPlaying);
              }}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCurrentStep(Math.min(replaySteps.length - 1, currentStep + 1))}>
              <FastForward className="h-4 w-4" />
            </Button>
            <div className="flex-1 px-2">
              <Slider
                value={[currentStep]}
                max={replaySteps.length - 1}
                step={1}
                onValueChange={([v]) => setCurrentStep(v)}
                className="cursor-pointer"
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono min-w-[60px] text-right">
              {currentStep + 1}/{replaySteps.length}
            </span>
          </div>

          {/* Timeline visualization */}
          <div className="relative space-y-2">
            {replaySteps.map((step, idx) => {
              const Icon = stepIcons[step.type];
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;

              return (
                <motion.div
                  key={step.id}
                  initial={false}
                  animate={{
                    opacity: isPast ? 0.5 : isActive ? 1 : 0.25,
                    scale: isActive ? 1 : 0.97,
                    x: isActive ? 0 : isPast ? -4 : 4,
                  }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setCurrentStep(idx)}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    isActive ? stepColors[step.type] : "border-transparent"
                  }`}
                >
                  {/* Step indicator */}
                  <div className="flex flex-col items-center gap-1 min-w-[32px]">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isActive ? stepColors[step.type] : "bg-muted/30"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {idx < replaySteps.length - 1 && (
                      <div className={`w-px h-4 ${isPast ? "bg-primary/30" : "bg-border/20"}`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{step.label}</span>
                      <StatusIcon status={step.status} />
                      <span className="text-[10px] text-muted-foreground font-mono ml-auto">{step.timestamp}</span>
                    </div>
                    <AnimatePresence>
                      {isActive && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="text-[11px] text-muted-foreground mt-1 leading-relaxed"
                        >
                          {step.detail}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Duration bar */}
                  <div className="min-w-[50px] text-right">
                    <span className="text-[10px] font-mono text-muted-foreground">{step.duration_ms}ms</span>
                    {isActive && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: step.duration_ms / 1000 }}
                        className="h-0.5 bg-primary/50 rounded-full mt-1"
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Summary */}
          {currentStep === replaySteps.length - 1 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 flex items-center gap-3"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-400">Replay Completo</p>
                <p className="text-[10px] text-muted-foreground">
                  {replaySteps.length} etapas • Tempo total: {replaySteps[replaySteps.length - 1]?.timestamp} • 
                  {replaySteps.filter(s => s.status === "success").length}/{replaySteps.length} sucesso
                </p>
              </div>
            </motion.div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AgentReplay;
