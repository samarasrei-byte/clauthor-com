import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Confidence Score visível — sinaliza calibração do agente sobre a própria entrega.
 * Bandas (base: pesquisa de calibração LLM · Anthropic/OpenAI 2025):
 *  · ≥ 90 → alta confiança · aprovar direto
 *  · 70-89 → média · revisar pontos-chave
 *  · < 70 → baixa · agente pede ajuda humana
 */

export type ConfidenceInput =
  | number
  | "baixa"
  | "média"
  | "media"
  | "alta"
  | null
  | undefined;

export function normalizeConfidence(v: ConfidenceInput): number | null {
  if (v == null) return null;
  if (typeof v === "number") {
    const n = v <= 1 ? v * 100 : v;
    return Math.max(0, Math.min(100, Math.round(n)));
  }
  const s = v.toString().toLowerCase();
  if (s.startsWith("alt")) return 92;
  if (s.startsWith("med") || s.startsWith("méd")) return 78;
  if (s.startsWith("bai")) return 58;
  return null;
}

/** Deterministic fallback (0-100) from any stable string id — só para demos, nunca sobrescreve real. */
export function derivedConfidence(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  // Distribuição realista: 60 a 98
  return 60 + (Math.abs(h) % 39);
}

function band(score: number) {
  if (score >= 90)
    return {
      label: "Alta",
      icon: ShieldCheck,
      chip: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
      dot: "bg-emerald-500",
      advice: "Agente está seguro. Pode aprovar direto — histórico similar teve alta taxa de sucesso.",
    };
  if (score >= 70)
    return {
      label: "Média",
      icon: ShieldQuestion,
      chip: "bg-amber-500/10 text-amber-500 border-amber-500/25",
      dot: "bg-amber-500",
      advice: "Revise dados/números antes de aprovar. O agente sinalizou incerteza em alguns pontos.",
    };
  return {
    label: "Baixa",
    icon: ShieldAlert,
    chip: "bg-rose-500/10 text-rose-500 border-rose-500/25",
    dot: "bg-rose-500",
    advice: "Agente pediu ajuda humana. Não aprove sem revisar — falta contexto ou dados críticos.",
  };
}

interface Props {
  score: number | null;
  compact?: boolean;
  className?: string;
}

const ConfidenceBadge = ({ score, compact = false, className }: Props) => {
  if (score == null) return null;
  const b = band(score);
  const Icon = b.icon;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn("text-[10px] gap-1 border cursor-help", b.chip, className)}
          >
            <Icon className="h-3 w-3" />
            {compact ? `${score}%` : `Confiança ${score}%`}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] text-xs leading-relaxed">
          <div className="flex items-center gap-1.5 font-medium mb-1">
            <span className={cn("h-1.5 w-1.5 rounded-full", b.dot)} />
            Calibração {b.label} · {score}/100
          </div>
          <p className="text-muted-foreground">{b.advice}</p>
          <p className="text-[10px] text-muted-foreground/70 mt-1.5">
            O agente calcula quão confiante está no próprio output antes de te entregar.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConfidenceBadge;
