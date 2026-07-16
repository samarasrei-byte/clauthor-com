import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Cpu, Send, Loader2, CheckCircle2, XCircle, Sparkles,
  Network, Layers, FileText, ChevronDown, ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trackKpi } from "@/lib/kpiTracker";

interface Phase {
  id: string;
  department: string;
  role: string;
  task: string;
  expected_artifact: string;
  parallel_group: string;
}

interface PlanJson {
  objective_understanding: string;
  strategy: string;
  phases: Phase[];
}

interface AgentOutput {
  phase: string;
  department: string;
  role: string;
  task: string;
  expected_artifact: string;
  parallel_group: string;
  output: string;
  status: "ok" | "failed";
  latency_ms: number;
}

interface ThorOsResult {
  ok: boolean;
  plan?: PlanJson;
  outputs?: AgentOutput[];
  delivery?: string;
  total_ms?: number;
  error?: string;
}

type Stage = "idle" | "planning" | "delegating" | "integrating" | "done" | "error";

const STAGES: { key: Stage; label: string; icon: typeof Cpu }[] = [
  { key: "planning", label: "THOR pensa como CEO", icon: Cpu },
  { key: "delegating", label: "Agentes executam em paralelo", icon: Network },
  { key: "integrating", label: "Integrador consolida", icon: Layers },
  { key: "done", label: "Entrega final", icon: FileText },
];

export default function ThorOS() {
  const [objective, setObjective] = useState("");
  const [context, setContext] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<ThorOsResult | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const running = stage === "planning" || stage === "delegating" || stage === "integrating";

  async function orchestrate() {
    if (objective.trim().length < 6) {
      toast.error("Descreva o objetivo com pelo menos 6 caracteres.");
      return;
    }
    setResult(null);
    setStage("planning");
    trackKpi("thor_os_orchestrate", { objective_len: objective.length });

    // Simulação visual de fases enquanto o backend roda sync
    const planTimer = window.setTimeout(() => setStage("delegating"), 2000);
    const delegateTimer = window.setTimeout(() => setStage("integrating"), 6000);

    try {
      const { data, error } = await supabase.functions.invoke("thor-os", {
        body: { objective: objective.trim(), context: context.trim() || undefined },
      });
      window.clearTimeout(planTimer);
      window.clearTimeout(delegateTimer);

      if (error) throw error;
      const payload = data as ThorOsResult;
      if (!payload.ok) {
        setStage("error");
        setResult(payload);
        toast.error(payload.error ?? "THOR OS falhou.");
        return;
      }
      setResult(payload);
      setStage("done");
      toast.success(`THOR entregou em ${((payload.total_ms ?? 0) / 1000).toFixed(1)}s`);
    } catch (e) {
      window.clearTimeout(planTimer);
      window.clearTimeout(delegateTimer);
      setStage("error");
      const msg = (e as Error).message || "Erro inesperado";
      setResult({ ok: false, error: msg });
      toast.error(msg);
    }
  }

  return (
    <>
      <Helmet>
        <title>THOR OS · Sistema Operacional Empresarial</title>
        <meta name="description" content="Transforme objetivos em resultados. THOR orquestra departamentos e agentes especialistas para entregar soluções completas." />
      </Helmet>

      <div className="min-h-dvh bg-background">
        {/* Header */}
        <div className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50">
          <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Cpu strokeWidth={1.5} className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-[17px] font-semibold tracking-tight leading-none flex items-center gap-2">
                THOR OS
                <Badge variant="outline" className="text-[9px] uppercase tracking-wider">v1 · simulado</Badge>
              </h1>
              <p className="text-[11px] text-muted-foreground mt-1">
                Sistema operacional empresarial · pensa como CEO, executa como time
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">
          {/* Composer */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Sparkles strokeWidth={1.5} className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Qual o objetivo?</span>
            </div>
            <Textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Ex: Lançar um novo produto SaaS de gestão financeira para PMEs em 90 dias com meta de 500 leads qualificados no primeiro mês."
              rows={3}
              disabled={running}
              className="resize-none bg-background/40 border-border/60 text-sm"
            />
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Contexto opcional (empresa, budget, deadline, restrições)…"
              rows={2}
              disabled={running}
              className="resize-none bg-background/40 border-border/60 text-xs"
            />
            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-muted-foreground">
                THOR decompõe, delega, valida e entrega. Você não precisa dizer <span className="italic">como</span>.
              </div>
              <Button onClick={orchestrate} disabled={running || objective.trim().length < 6}>
                {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send strokeWidth={1.5} className="w-4 h-4 mr-2" />}
                {running ? "Orquestrando…" : "Orquestrar"}
              </Button>
            </div>
          </motion.div>

          {/* Pipeline visual */}
          {(running || stage === "done" || stage === "error") && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {STAGES.map((s, i) => {
                const isActive = stage === s.key;
                const isDone =
                  (stage === "delegating" && i === 0) ||
                  (stage === "integrating" && i <= 1) ||
                  (stage === "done" && i <= 3);
                const Icon = s.icon;
                return (
                  <div
                    key={s.key}
                    className={cn(
                      "rounded-xl border p-3 transition-all",
                      isActive ? "border-primary/60 bg-primary/[0.04] ring-1 ring-primary/20"
                               : isDone ? "border-emerald-500/30 bg-emerald-500/[0.03]"
                                        : "border-border/60 bg-card/30",
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Icon strokeWidth={1.5} className="w-4 h-4 text-foreground" />
                      {isActive && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                      {isDone && !isActive && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Fase {i + 1}</div>
                    <div className="text-xs font-medium mt-0.5">{s.label}</div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Plan */}
          <AnimatePresence>
            {result?.plan && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-6 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Cpu strokeWidth={1.5} className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Plano do THOR</span>
                </div>
                <div className="text-xs text-muted-foreground italic">"{result.plan.objective_understanding}"</div>
                <div className="text-sm text-foreground leading-relaxed">{result.plan.strategy}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Agent outputs */}
          {result?.outputs && result.outputs.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-1">
                Agentes acionados · {result.outputs.length}
              </div>
              {result.outputs.map((o) => {
                const open = expanded[o.phase] ?? false;
                return (
                  <div key={o.phase} className="rounded-xl border border-border/60 bg-card/30 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpanded((prev) => ({ ...prev, [o.phase]: !open }))}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/20 text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {o.status === "ok"
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          : <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs font-medium">
                            <span className="text-muted-foreground">{o.phase}</span>
                            <span>{o.department}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">{o.role}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate mt-0.5">{o.task}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground">{(o.latency_ms / 1000).toFixed(1)}s</span>
                        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>
                    {open && (
                      <div className="px-4 pb-4 pt-2 border-t border-border/40 prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground">
                        <ReactMarkdown>{o.output}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Delivery */}
          {result?.delivery && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-primary/40 bg-primary/[0.03] p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <FileText strokeWidth={1.5} className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Entrega final</span>
                {result.total_ms && (
                  <Badge variant="outline" className="text-[9px] ml-auto">
                    {(result.total_ms / 1000).toFixed(1)}s total
                  </Badge>
                )}
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground">
                <ReactMarkdown>{result.delivery}</ReactMarkdown>
              </div>
            </motion.div>
          )}

          {/* Error */}
          {stage === "error" && result?.error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {result.error}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
