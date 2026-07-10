/**
 * WowPreview — renderiza o output em formato "documento" com efeito de digitação
 * (usa o próprio streaming: sem timer artificial, o texto cresce à medida que
 * chega). Fallback já vem "pronto", então cai instantâneo.
 */
import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";

interface WowPreviewProps {
  agentLabel: string;
  outputLabel: string;
  output: string;
  isStreaming: boolean;
  company: string;
}

export function WowPreview({ agentLabel, outputLabel, output, isStreaming, company }: WowPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3 bg-muted/40">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500/70" />
          <div className="h-2 w-2 rounded-full bg-yellow-500/70" />
          <div className="h-2 w-2 rounded-full bg-green-500/70" />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>{agentLabel}</span>
          <span className="text-border">•</span>
          <span>{outputLabel}</span>
          {isStreaming && (
            <>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1 text-primary">
                <Zap className="h-3 w-3 animate-pulse" />
                gerando…
              </span>
            </>
          )}
        </div>
      </div>
      <div className="p-6 max-h-[52vh] overflow-y-auto">
        <div className="text-xs text-muted-foreground mb-3">
          Documento para <span className="text-foreground font-medium">{company}</span>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-[450] leading-relaxed text-foreground">
          {output || (
            <span className="text-muted-foreground italic">Aquecendo o agente…</span>
          )}
          {isStreaming && output && (
            <span className="inline-block w-1.5 h-4 bg-primary/70 ml-0.5 animate-pulse align-middle" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
