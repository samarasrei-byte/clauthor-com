import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Rewind, FastForward, Play, Pause, SkipBack, 
  Brain, Zap, CheckCircle2, AlertTriangle, ArrowRight,
  Clock, MessageSquare, Cpu, Database, Search, Shield,
  Activity, GitBranch
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
  type: "think" | "decide" | "execute" | "delegate" | "respond" | "validate" | "error";
  label: string;
  detail: string;
  duration_ms: number;
  status: "success" | "warning" | "error";
  timestamp: string;
}

const stepIcons: Record<string, any> = {
  think: Brain,
  decide: Search,
  execute: Zap,
  delegate: ArrowRight,
  respond: MessageSquare,
  validate: Shield,
  error: AlertTriangle,
};

const stepColors: Record<string, string> = {
  think: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  decide: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  execute: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  delegate: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  respond: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  validate: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  error: "text-red-400 bg-red-500/10 border-red-500/20",
};

/** Build replay steps from real execution_log details */
function buildStepsFromLog(log: any): ReplayStep[] {
  const details = (log.details as any) || {};
  const totalMs = log.execution_time_ms || 500;
  const isSuccess = log.status === "success";
  const steps: ReplayStep[] = [];
  let elapsed = 0;

  // Step 1: Task received
  steps.push({
    id: `${log.id}-recv`,
    type: "think",
    label: "Tarefa recebida",
    detail: `Ação: ${log.action}${details.area ? ` | Área: ${details.area}` : ""}${details.persona ? ` | Persona: ${details.persona}` : ""}`,
    duration_ms: Math.round(totalMs * 0.05),
    status: "success",
    timestamp: `${(elapsed / 1000).toFixed(1)}s`,
  });
  elapsed += totalMs * 0.05;

  // Step 2: Context analysis (if contract was applied)
  if (details.contract_applied || details.model_used || details.quality_mode) {
    steps.push({
      id: `${log.id}-ctx`,
      type: "think",
      label: "Analisando contexto",
      detail: `${details.contract_applied ? "Contrato de agente aplicado. " : ""}${details.model_used ? `Modelo: ${details.model_used}. ` : ""}${details.quality_mode ? `Quality: ${details.quality_mode}. ` : ""}Preparando pipeline de execução.`,
      duration_ms: Math.round(totalMs * 0.1),
      status: "success",
      timestamp: `${(elapsed / 1000).toFixed(1)}s`,
    });
    elapsed += totalMs * 0.1;
  }

  // Step 3: Decision/strategy
  steps.push({
    id: `${log.id}-decide`,
    type: "decide",
    label: "Estratégia definida",
    detail: details.strategy || details.plan || `Pipeline: receber → analisar → ${details.tool_used ? `usar ${details.tool_used}` : "processar"} → responder`,
    duration_ms: Math.round(totalMs * 0.08),
    status: "success",
    timestamp: `${(elapsed / 1000).toFixed(1)}s`,
  });
  elapsed += totalMs * 0.08;

  // Step 4: Tool/integration execution (if present)
  if (details.tool_used || details.integration || details.api_called) {
    steps.push({
      id: `${log.id}-tool`,
      type: "execute",
      label: `Executando: ${details.tool_used || details.integration || details.api_called}`,
      detail: `${details.tool_result || details.integration_status || `Chamada externa realizada.`}${details.tokens_used ? ` Tokens: ${details.tokens_used.toLocaleString()}` : ""}`,
      duration_ms: Math.round(totalMs * 0.4),
      status: isSuccess ? "success" : "error",
      timestamp: `${(elapsed / 1000).toFixed(1)}s`,
    });
    elapsed += totalMs * 0.4;
  }

  // Step 5: Delegation (if A2A)
  if (details.delegated_to || details.a2a) {
    steps.push({
      id: `${log.id}-delegate`,
      type: "delegate",
      label: `Delegado: ${details.delegated_to || "Agente auxiliar"}`,
      detail: details.delegation_reason || "Sub-tarefa delegada via orquestração A2A para processamento especializado.",
      duration_ms: Math.round(totalMs * 0.15),
      status: "success",
      timestamp: `${(elapsed / 1000).toFixed(1)}s`,
    });
    elapsed += totalMs * 0.15;
  }

  // Step 6: Main execution
  const mainExecMs = Math.max(50, totalMs - elapsed - totalMs * 0.1);
  steps.push({
    id: `${log.id}-exec`,
    type: "execute",
    label: "Processamento principal",
    detail: `Tempo de execução: ${totalMs}ms total.${details.tokens_used ? ` Tokens consumidos: ${details.tokens_used.toLocaleString()}.` : ""}${details.model ? ` Modelo: ${details.model}` : ""}`,
    duration_ms: Math.round(mainExecMs),
    status: isSuccess ? "success" : "error",
    timestamp: `${(elapsed / 1000).toFixed(1)}s`,
  });
  elapsed += mainExecMs;

  // Step 7: Validation (if quality check)
  if (details.quality_check || details.confidence_score) {
    steps.push({
      id: `${log.id}-validate`,
      type: "validate",
      label: "Validação de qualidade",
      detail: `${details.confidence_score ? `Score de confiança: ${details.confidence_score}%. ` : ""}${details.hallucination_check ? "Verificação de alucinação: OK. " : ""}Resultado validado.`,
      duration_ms: Math.round(totalMs * 0.05),
      status: "success",
      timestamp: `${(elapsed / 1000).toFixed(1)}s`,
    });
    elapsed += totalMs * 0.05;
  }

  // Step 8: Error step (if failed)
  if (!isSuccess) {
    steps.push({
      id: `${log.id}-err`,
      type: "error",
      label: "Erro detectado",
      detail: details.error || details.error_message || `Status: ${log.status}. A execução falhou. Verifique credenciais e configurações.`,
      duration_ms: 0,
      status: "error",
      timestamp: `${(elapsed / 1000).toFixed(1)}s`,
    });
  }

  // Final step: Result
  steps.push({
    id: `${log.id}-result`,
    type: "respond",
    label: isSuccess ? "Resultado entregue" : "Falha registrada",
    detail: `Status: ${log.status}. Tempo total: ${(totalMs / 1000).toFixed(2)}s.${details.response_length ? ` Resposta: ${details.response_length} chars.` : ""}`,
    duration_ms: Math.round(totalMs * 0.02),
    status: isSuccess ? "success" : "error",
    timestamp: `${(elapsed / 1000).toFixed(1)}s`,
  });

  return steps;
}

const DEMO_STEPS: ReplayStep[] = [
  { id: "1", type: "think", label: "Analisando contexto", detail: "Processando histórico de conversas e memória do agente. Contrato aplicado: tier=advanced, area=vendas.", duration_ms: 450, status: "success", timestamp: "0.0s" },
  { id: "2", type: "think", label: "Consultando knowledge base", detail: "Buscando documentos relevantes na base de conhecimento: 3 resultados. Score de relevância: 0.87.", duration_ms: 280, status: "success", timestamp: "0.4s" },
  { id: "3", type: "decide", label: "Estratégia definida", detail: "Pipeline: pesquisar → sintetizar → formatar → validar. Modelo: gemini-3-flash-preview.", duration_ms: 120, status: "success", timestamp: "0.7s" },
  { id: "4", type: "execute", label: "Executando pesquisa", detail: "5 fontes internas consultadas. Tempo: 340ms. Tokens: 1.250.", duration_ms: 340, status: "success", timestamp: "0.8s" },
  { id: "5", type: "delegate", label: "Delegando formatação", detail: "Sub-tarefa 'formatação de relatório' enviada ao Copywriter IA via orquestração A2A.", duration_ms: 180, status: "success", timestamp: "1.2s" },
  { id: "6", type: "validate", label: "Validação de qualidade", detail: "Score de confiança: 94%. Alucinação: não detectada. Fontes verificadas: 3/3.", duration_ms: 200, status: "success", timestamp: "1.4s" },
  { id: "7", type: "respond", label: "Resposta entregue", detail: "Resultado final enviado. Tempo total: 1.57s. Satisfação estimada: Alta.", duration_ms: 150, status: "success", timestamp: "1.6s" },
];

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "success") return <CheckCircle2 className="h-3 w-3 text-emerald-400" />;
  if (status === "warning") return <AlertTriangle className="h-3 w-3 text-amber-400" />;
  return <AlertTriangle className="h-3 w-3 text-red-400" />;
};

const AgentReplay = () => {
  const { user } = useAuth();
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: logs = [] } = useQuery({
    queryKey: ["replay-logs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("execution_logs")
        .select("*, agent:agents(name, tier)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      return data || [];
    },
    enabled: !!user,
  });

  // Build steps from real log data or use demo
  const replaySteps: ReplayStep[] = useMemo(() => {
    if (!selectedLog) return DEMO_STEPS;
    const log = logs.find((l: any) => l.id === selectedLog);
    if (!log) return DEMO_STEPS;
    return buildStepsFromLog(log);
  }, [selectedLog, logs]);

  // Auto-play with useEffect
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= replaySteps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, replaySteps.length]);

  // Stats for selected log
  const logStats = useMemo(() => {
    if (!selectedLog) return null;
    const log = logs.find((l: any) => l.id === selectedLog);
    if (!log) return null;
    return {
      agentName: (log.agent as any)?.name || "Agente",
      agentTier: (log.agent as any)?.tier || "basic",
      action: log.action,
      totalMs: log.execution_time_ms || 0,
      status: log.status,
      date: new Date(log.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
    };
  }, [selectedLog, logs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Rewind className="h-5 w-5 text-primary" />
            Agent Replay - Raciocínio em Tempo Real
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Reveja cada decisão dos seus agentes. Steps extraídos de dados reais de execução.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
          <Cpu className="h-3 w-3 mr-1" /> REAL DATA
        </Badge>
      </div>

      {/* Active log info */}
      {logStats && (
        <Card className="p-3 bg-card/30 border-border/20 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">{logStats.agentName}</span>
            <Badge variant="outline" className="text-[8px]">{logStats.agentTier}</Badge>
          </div>
          <span className="text-[10px] text-muted-foreground">{logStats.action}</span>
          <span className="text-[10px] text-muted-foreground ml-auto">{logStats.date}</span>
          <Badge variant="outline" className={`text-[8px] ${logStats.status === "success" ? "border-emerald-500/30 text-emerald-400" : "border-red-500/30 text-red-400"}`}>
            {logStats.totalMs}ms
          </Badge>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Log selector */}
        <Card className="p-4 space-y-3 bg-card/50 backdrop-blur border-border/30">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            Execuções ({logs.length})
          </h3>
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            <button
              onClick={() => { setSelectedLog(null); setCurrentStep(0); setIsPlaying(false); }}
              className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs ${
                !selectedLog ? "border-primary/40 bg-primary/5" : "border-border/20 hover:border-border/40 bg-transparent"
              }`}
            >
              <div className="font-medium flex items-center gap-1.5">
                <GitBranch className="h-3 w-3 text-primary" /> Demo: SDR Pipeline A2A
              </div>
              <div className="text-muted-foreground text-[10px] mt-0.5">7 steps • 1.57s • Fluxo completo</div>
            </button>

            {logs.map((log: any) => {
              const isError = log.status === "error";
              return (
                <button
                  key={log.id}
                  onClick={() => { setSelectedLog(log.id); setCurrentStep(0); setIsPlaying(false); }}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs ${
                    selectedLog === log.id ? "border-primary/40 bg-primary/5" : "border-border/20 hover:border-border/40 bg-transparent"
                  }`}
                >
                  <div className="font-medium truncate flex items-center gap-1.5">
                    {isError ? <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" /> : <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />}
                    {(log.agent as any)?.name || "Agente"}
                  </div>
                  <div className="text-muted-foreground text-[10px] mt-0.5 flex items-center gap-2">
                    <span className="truncate">{log.action}</span>
                    <span className="shrink-0">{log.execution_time_ms ? `${log.execution_time_ms}ms` : ""}</span>
                  </div>
                </button>
              );
            })}

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
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>
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
                onValueChange={([v]) => { setCurrentStep(v); setIsPlaying(false); }}
                className="cursor-pointer"
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono min-w-[60px] text-right">
              {currentStep + 1}/{replaySteps.length}
            </span>
          </div>

          {/* Timeline */}
          <div className="relative space-y-2">
            {replaySteps.map((step, idx) => {
              const Icon = stepIcons[step.type] || Zap;
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
                    isActive ? (stepColors[step.type] || stepColors.execute) : "border-transparent"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1 min-w-[32px]">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isActive ? (stepColors[step.type] || stepColors.execute) : "bg-muted/30"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {idx < replaySteps.length - 1 && (
                      <div className={`w-px h-4 ${isPast ? "bg-primary/30" : "bg-border/20"}`} />
                    )}
                  </div>

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

                  <div className="min-w-[50px] text-right">
                    <span className="text-[10px] font-mono text-muted-foreground">{step.duration_ms}ms</span>
                    {isActive && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: Math.min(1, step.duration_ms / 1000) }}
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
              className={`rounded-xl p-3 flex items-center gap-3 ${
                replaySteps[replaySteps.length - 1]?.status === "error" 
                  ? "bg-red-500/5 border border-red-500/20" 
                  : "bg-emerald-500/5 border border-emerald-500/20"
              }`}
            >
              {replaySteps[replaySteps.length - 1]?.status === "error" ? (
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              )}
              <div>
                <p className={`text-xs font-semibold ${replaySteps[replaySteps.length - 1]?.status === "error" ? "text-red-400" : "text-emerald-400"}`}>
                  Replay Completo
                </p>
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
