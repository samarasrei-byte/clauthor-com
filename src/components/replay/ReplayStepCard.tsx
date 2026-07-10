import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Wrench,
  CheckCircle2,
  GitBranch,
  Send,
  AlertTriangle,
  Sparkle,
  Cog,
  ChevronDown,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExecutionStep, StepType } from "@/hooks/useExecutionRun";

const STEP_META: Record<
  StepType,
  { icon: React.ComponentType<{ className?: string }>; label: string; tone: string }
> = {
  thought: { icon: Brain, label: "Pensamento", tone: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  tool_call: { icon: Wrench, label: "Chamada de ferramenta", tone: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  tool_result: { icon: CheckCircle2, label: "Resultado da ferramenta", tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  decision: { icon: GitBranch, label: "Decisão", tone: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  delegation: { icon: Send, label: "Delegação", tone: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  final_output: { icon: Sparkle, label: "Saída final", tone: "text-primary bg-primary/10 border-primary/30" },
  error: { icon: AlertTriangle, label: "Erro", tone: "text-destructive bg-destructive/10 border-destructive/30" },
  system: { icon: Cog, label: "Sistema", tone: "text-muted-foreground bg-muted/30 border-border" },
};

function formatMs(ms: number): string {
  if (!ms || ms < 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
}

interface ReplayStepCardProps {
  step: ExecutionStep;
  onExpand?: (stepType: StepType) => void;
}

export const ReplayStepCard = memo(function ReplayStepCard({ step, onExpand }: ReplayStepCardProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const meta = STEP_META[step.step_type] ?? STEP_META.system;
  const Icon = meta.icon;

  const hasContent = step.content && Object.keys(step.content).length > 0;
  const hasSources = !!step.sources && step.sources.length > 0;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) onExpand?.(step.step_type);
  };

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(step.content, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative pl-8"
    >
      {/* Timeline rail dot */}
      <span
        className={cn(
          "absolute left-0 top-2 flex h-6 w-6 items-center justify-center rounded-full border",
          meta.tone,
        )}
      >
        <Icon className="h-3 w-3" />
      </span>

      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
        <button
          type="button"
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-muted/30 transition-colors"
        >
          <span className="text-[10px] font-mono text-muted-foreground/60 tabular-nums w-6 shrink-0">
            #{String(step.step_index + 1).padStart(2, "0")}
          </span>
          <span className={cn("text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border", meta.tone)}>
            {meta.label}
          </span>
          <span className="flex-1 text-[13px] font-medium text-foreground/90 truncate">
            {step.title}
          </span>
          {step.tool_name && (
            <span className="hidden sm:inline text-[10px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
              {step.tool_name}
            </span>
          )}
          {step.duration_ms > 0 && (
            <span className="text-[10px] text-muted-foreground tabular-nums">{formatMs(step.duration_ms)}</span>
          )}
          {(hasContent || hasSources) && (
            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground/60 transition-transform", open && "rotate-180")} />
          )}
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border/30"
            >
              <div className="px-3.5 py-3 space-y-3">
                {hasContent && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Conteúdo</span>
                      <button
                        onClick={copyContent}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground/70 hover:text-foreground transition-colors"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                    <pre className="text-[11px] leading-relaxed bg-background/60 border border-border/30 rounded-lg p-2.5 overflow-x-auto text-foreground/80 font-mono whitespace-pre-wrap break-words max-h-64">
                      {JSON.stringify(step.content, null, 2)}
                    </pre>
                  </div>
                )}

                {hasSources && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                      Fontes ({step.sources!.length})
                    </span>
                    <ul className="space-y-1">
                      {step.sources!.map((src, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11.5px]">
                          <ExternalLink className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground/60" />
                          <div className="min-w-0 flex-1">
                            {src.url ? (
                              <a
                                href={src.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline truncate block"
                              >
                                {src.title || src.url}
                              </a>
                            ) : (
                              <span className="text-foreground/80">{src.title || src.type}</span>
                            )}
                            {src.snippet && (
                              <p className="text-[10.5px] text-muted-foreground/80 line-clamp-2 mt-0.5">
                                {src.snippet}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(step.tokens_in > 0 || step.tokens_out > 0 || Number(step.cost_credits) > 0) && (
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70 pt-1 border-t border-border/20">
                    {step.tokens_in > 0 && <span>↓ {step.tokens_in.toLocaleString()} tokens</span>}
                    {step.tokens_out > 0 && <span>↑ {step.tokens_out.toLocaleString()} tokens</span>}
                    {Number(step.cost_credits) > 0 && (
                      <span>{Number(step.cost_credits).toFixed(2)} créditos</span>
                    )}
                    {step.agent_slug && <span className="ml-auto font-mono">{step.agent_slug}</span>}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
