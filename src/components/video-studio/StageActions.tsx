import { Sparkles, Zap, Clapperboard, Lock, ArrowRight, Loader2, Pencil, Check, Sparkle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Provider = "veo3" | "replicate" | "lovable";

interface ProviderInfo {
  id: Provider;
  label: string;
  eta: string;
  quality: string;
  icon: typeof Sparkles;
  available: boolean;
}

interface Props {
  provider: Provider;
  onProviderChange: (p: Provider) => void;
  providerAvailable: (p: Provider) => boolean;
  finalPrompt: string | null;
  onFinalPromptChange: (v: string) => void;
  onGenerate: () => void;
  canGenerate: boolean;
  submitting: boolean;
  quotaRemaining?: number;
}

const PROVIDER_ETA: Record<Provider, { eta: string; quality: string }> = {
  veo3: { eta: "2–4 min", quality: "Alta qualidade" },
  replicate: { eta: "30–60 s", quality: "Rápido" },
  lovable: { eta: "Em breve", quality: "Clauthor AI" },
};

const PROVIDER_ICON: Record<Provider, typeof Sparkles> = {
  veo3: Sparkles,
  replicate: Zap,
  lovable: Clapperboard,
};

const PROVIDER_LABEL: Record<Provider, string> = {
  veo3: "Veo 3",
  replicate: "Replicate",
  lovable: "Clauthor AI",
};

/**
 * Barra de ações do palco: seletor de provider (visível, com ETA) +
 * card do prompt final revisável + botão sticky de gerar.
 */
export default function StageActions({
  provider,
  onProviderChange,
  providerAvailable,
  finalPrompt,
  onFinalPromptChange,
  onGenerate,
  canGenerate,
  submitting,
  quotaRemaining,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const providers: ProviderInfo[] = (["veo3", "replicate", "lovable"] as Provider[]).map((id) => ({
    id,
    label: PROVIDER_LABEL[id],
    eta: PROVIDER_ETA[id].eta,
    quality: PROVIDER_ETA[id].quality,
    icon: PROVIDER_ICON[id],
    available: providerAvailable(id),
  }));

  const startEdit = () => {
    setDraft(finalPrompt ?? "");
    setEditing(true);
  };

  const saveEdit = () => {
    onFinalPromptChange(draft.trim());
    setEditing(false);
  };

  const currentEta = PROVIDER_ETA[provider].eta;

  return (
    <div className="space-y-3">
      {/* Provider pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground mr-1">Motor</span>
        {providers.map((p) => {
          const Icon = p.icon;
          const active = provider === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => p.available && onProviderChange(p.id)}
              disabled={!p.available}
              className={cn(
                "group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                active && p.available
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background/40 text-muted-foreground hover:text-foreground hover:border-muted-foreground/50",
                !p.available && "opacity-50 cursor-not-allowed",
              )}
              title={p.available ? `${p.quality} · ETA ${p.eta}` : "Indisponível no seu plano"}
            >
              <Icon strokeWidth={1.5} className="w-3.5 h-3.5" />
              <span>{p.label}</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {p.available ? p.eta : "🔒"}
              </span>
              {!p.available && <Lock strokeWidth={1.5} className="w-3 h-3 ml-0.5" />}
            </button>
          );
        })}
      </div>

      {/* Prompt preview card */}
      <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Prompt final · vai pro {PROVIDER_LABEL[provider]}
          </div>
          {finalPrompt && !editing && (
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-[11px]" onClick={startEdit}>
              <Pencil strokeWidth={1.5} className="w-3 h-3" /> Editar
            </Button>
          )}
          {editing && (
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-[11px]" onClick={saveEdit}>
              <Check strokeWidth={1.5} className="w-3 h-3" /> Salvar
            </Button>
          )}
        </div>

        {editing ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[96px] text-sm resize-none"
            autoFocus
          />
        ) : finalPrompt ? (
          <p className="text-sm text-foreground/90 leading-relaxed line-clamp-4">{finalPrompt}</p>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Converse com o Thor à esquerda ou pegue um template no palco — quando o prompt estiver pronto, aparece aqui pra revisão.
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-[11px] text-muted-foreground">
            {canGenerate ? (
              <>
                ETA: <span className="text-foreground font-medium">{currentEta}</span>
                {typeof quotaRemaining === "number" && (
                  <span className="ml-2 opacity-70">· {quotaRemaining} restantes no plano</span>
                )}
              </>
            ) : (
              "Finalize o prompt antes de gerar."
            )}
          </div>

          <Button
            size="sm"
            onClick={onGenerate}
            disabled={!canGenerate || submitting}
            className="gap-2 h-9 px-5"
          >
            {submitting ? (
              <>
                <Loader2 strokeWidth={2} className="w-3.5 h-3.5 animate-spin" /> Enviando…
              </>
            ) : (
              <>
                <Sparkles strokeWidth={2} className="w-3.5 h-3.5" /> Gerar vídeo
                <ArrowRight strokeWidth={2} className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
