import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Users, Target, Handshake, Search as SearchIcon,
  X, ArrowRight, Check, Bot,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";
import type { SellerChannel } from "./SocialSellerToggle";

// ── Role catalog ────────────────────────────────────────────────────────────
export type AgentRole = "social_seller" | "sdr" | "closer" | "hunter";

const ROLES: Record<AgentRole, {
  label: string;
  short: string;
  icon: typeof Users;
  accent: string;
  pitch: string;
}> = {
  social_seller: {
    label: "Social Seller",
    short: "Engaja, curte e responde comentários gerando conversas.",
    icon: Sparkles,
    accent: "text-[#E1306C]",
    pitch: "Constrói presença de marca respondendo DMs, comentários e stories.",
  },
  sdr: {
    label: "SDR",
    short: "Qualifica leads e agenda reuniões automaticamente.",
    icon: Target,
    accent: "text-primary",
    pitch: "Faz discovery, aplica BANT/GPCT e passa lead quente para o closer.",
  },
  closer: {
    label: "Closer",
    short: "Fecha vendas, envia propostas e negocia condições.",
    icon: Handshake,
    accent: "text-success",
    pitch: "Assume no bottom-funnel, responde objeções e sela contratos.",
  },
  hunter: {
    label: "Hunter",
    short: "Prospecta ativamente novos contatos frios.",
    icon: SearchIcon,
    accent: "text-accent-blue",
    pitch: "Encontra ICPs, dispara sequências de outbound e alimenta o pipeline.",
  },
};

// Which roles fazem sentido em cada canal (ordem = prioridade)
const CHANNEL_ROLE_MAP: Record<SellerChannel, AgentRole[]> = {
  linkedin:  ["social_seller", "sdr", "hunter", "closer"],
  instagram: ["social_seller", "sdr"],
  whatsapp:  ["sdr", "closer", "social_seller"],
  facebook:  ["social_seller", "sdr"],
  tiktok:    ["social_seller"],
  email:     ["sdr", "closer", "hunter"],
  dashboard: ["sdr", "closer"],
};

const CHANNEL_LABEL: Record<SellerChannel, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  facebook: "Messenger",
  tiktok: "TikTok",
  email: "E-mail",
  dashboard: "Chat interno",
};

// ── Persistence ─────────────────────────────────────────────────────────────
const STORAGE_KEY = "clauthor:inbox-recommender:v1";

interface StoredState {
  seenChannels: SellerChannel[];
  product?: string;
  chosen: Partial<Record<SellerChannel, AgentRole[]>>;
}

function readState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as StoredState : { seenChannels: [], chosen: {} };
  } catch {
    return { seenChannels: [], chosen: {} };
  }
}

function writeState(s: StoredState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

// ── Component ───────────────────────────────────────────────────────────────
interface Props {
  channel: SellerChannel;
  hasAgents: boolean;
}

const ChannelAgentRecommender = ({ channel, hasAgents }: Props) => {
  const navigate = useNavigate();
  const [state, setState] = useState<StoredState>(() => readState());
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<Set<AgentRole>>(new Set());
  const [product, setProduct] = useState(state.product ?? "");

  const recommended = CHANNEL_ROLE_MAP[channel] ?? [];
  const alreadyChosen = state.chosen[channel] ?? [];
  const isFirstVisit = !state.seenChannels.includes(channel);

  // Open popup only once per channel (first visit) when the user has no agents assigned
  useEffect(() => {
    if (isFirstVisit && !hasAgents && recommended.length > 0) {
      // small delay so it doesn't feel abrupt
      const t = setTimeout(() => {
        setSelected(new Set(recommended.slice(0, 2)));
        setStep(1);
        setOpen(true);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [channel, isFirstVisit, hasAgents, recommended]);

  const markSeen = () => {
    const next: StoredState = {
      ...state,
      seenChannels: Array.from(new Set([...state.seenChannels, channel])),
    };
    setState(next);
    writeState(next);
  };

  const closeDialog = () => {
    markSeen();
    setOpen(false);
  };

  const confirm = () => {
    const chosen = Array.from(selected);
    const next: StoredState = {
      ...state,
      product: product.trim() || state.product,
      seenChannels: Array.from(new Set([...state.seenChannels, channel])),
      chosen: { ...state.chosen, [channel]: chosen },
    };
    setState(next);
    writeState(next);
    setOpen(false);

    if (chosen.length === 0) return;

    notify.success(
      `${chosen.length} papel(is) reservado(s) para ${CHANNEL_LABEL[channel]}`,
      { description: "Vou te levar para escolher os agentes ideais agora." },
    );

    const params = new URLSearchParams({
      intent: "hire",
      channel,
      roles: chosen.join(","),
      ...(product.trim() ? { product: product.trim() } : {}),
    });
    navigate(`/dashboard/agents?${params.toString()}`);
  };

  const toggleRole = (r: AgentRole) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(r)) n.delete(r); else n.add(r);
      return n;
    });
  };

  return (
    <>
      {/* Inline recommendation strip (always visible) */}
      {recommended.length > 0 && (
        <div className="rounded-xl border border-primary/15 bg-gradient-to-r from-primary/[0.04] via-transparent to-primary/[0.04] p-3">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-foreground truncate">
                  Agentes recomendados para {CHANNEL_LABEL[channel]}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {alreadyChosen.length > 0
                    ? `Você já ativou ${alreadyChosen.length} papel(is). Adicione mais para cobrir todo o funil.`
                    : "Cada canal pede um papel diferente. Escolha quem vai atender por aqui."}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelected(new Set(recommended.slice(0, 2)));
                setStep(1);
                setOpen(true);
              }}
              className="shrink-0 text-[10px] font-medium text-primary hover:underline whitespace-nowrap"
            >
              Personalizar
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {recommended.map((r) => {
              const meta = ROLES[r];
              const Icon = meta.icon;
              const active = alreadyChosen.includes(r);
              return (
                <button
                  key={r}
                  onClick={() => {
                    setSelected(new Set([r]));
                    setStep(1);
                    setOpen(true);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-medium transition-colors",
                    active
                      ? "bg-primary/10 border-primary/25 text-primary"
                      : "bg-card/40 border-border/15 text-foreground/80 hover:border-primary/25 hover:text-primary",
                  )}
                  title={meta.pitch}
                >
                  <Icon className={cn("h-3 w-3", active ? "text-primary" : meta.accent)} strokeWidth={2} />
                  {meta.label}
                  {active ? (
                    <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                  ) : (
                    <span className="text-[9px] opacity-60">+ adicionar</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* First-visit / customization dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) markSeen(); setOpen(v); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
              </div>
              <Badge variant="outline" className="text-[9.5px] uppercase tracking-wide">
                Inbox · {CHANNEL_LABEL[channel]}
              </Badge>
            </div>
            <DialogTitle className="text-base">
              {step === 1
                ? `Quem deve atender no ${CHANNEL_LABEL[channel]}?`
                : "O que esses agentes vão vender?"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {step === 1
                ? "Escolha um ou mais papéis. Vou montar os agentes ideais para esse canal em segundos."
                : "Uma linha basta. Usamos para calibrar o discurso, objeções e materiais que os agentes vão usar."}
            </DialogDescription>
          </DialogHeader>

          {step === 1 ? (
            <div className="space-y-2 mt-2">
              {recommended.map((r) => {
                const meta = ROLES[r];
                const Icon = meta.icon;
                const active = selected.has(r);
                return (
                  <button
                    key={r}
                    onClick={() => toggleRole(r)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                      active
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/15 hover:border-primary/25 hover:bg-muted/20",
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      active ? "bg-primary/15" : "bg-muted/30",
                    )}>
                      <Icon className={cn("h-4 w-4", active ? "text-primary" : meta.accent)} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] font-semibold text-foreground">{meta.label}</p>
                        {active && <Check className="h-3 w-3 text-primary" strokeWidth={2.5} />}
                      </div>
                      <p className="text-[10.5px] text-muted-foreground leading-relaxed">
                        {meta.pitch}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              <label className="block text-[11px] font-medium text-foreground">
                Produto ou serviço principal
              </label>
              <Input
                autoFocus
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="Ex.: Consultoria em performance para e-commerce"
                className="h-9 text-[12px]"
              />
              <p className="text-[10px] text-muted-foreground">
                Dica: seja específico. "Curso de inglês executivo para C-levels" gera
                muito mais resultado que "curso de inglês".
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/10">
            <button
              onClick={closeDialog}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3 inline mr-1" />
              Agora não
            </button>
            <div className="flex items-center gap-2">
              {step === 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[11px]"
                  onClick={() => setStep(1)}
                >
                  Voltar
                </Button>
              )}
              {step === 1 ? (
                <Button
                  size="sm"
                  className="h-8 text-[11px]"
                  disabled={selected.size === 0}
                  onClick={() => setStep(2)}
                >
                  Continuar
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="h-8 text-[11px]"
                  onClick={confirm}
                >
                  Contratar {selected.size} agente{selected.size === 1 ? "" : "s"}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChannelAgentRecommender;
