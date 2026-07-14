/**
 * ThorOnboardingFlow · Dialog de 4 passos disparado após a recomendação do Thor.
 * Fluxo: Confirmação → Contexto → Setup → Final (painel + checkout/contato).
 * Frontend puro. Persiste respostas em localStorage e emite KPIs.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  LayoutDashboard,
  MessageCircle,
  Rocket,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackKpi } from "@/lib/kpiTracker";

export type OnboardingRecoKind = "departamento" | "squad" | "agente";

export interface OnboardingReco {
  kind: OnboardingRecoKind;
  deptId?: string;
  label: string;
  priceLabel: string;
}

interface ThorOnboardingFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reco: OnboardingReco | null;
  source?: "landing" | "onboarding" | "dashboard" | "live_demo" | "departamentos_page" | "diagnosis_recap" | "thor_guide" | "replay" | "approvals" | "activity" | "task" | "instant_wow";
}

const STEP_LABELS = ["Confirmação", "Contexto", "Setup", "Ativar"];

const CHANNELS = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "email", label: "E-mail", icon: MessageCircle },
  { id: "linkedin", label: "LinkedIn", icon: Users },
  { id: "instagram", label: "Instagram", icon: Sparkles },
];

const TOOLS = [
  { id: "planilha", label: "Planilha (Google Sheets/Excel)" },
  { id: "crm", label: "CRM (HubSpot, Pipedrive, RD, Salesforce)" },
  { id: "email_marketing", label: "E-mail marketing" },
  { id: "nenhuma", label: "Nada estruturado ainda" },
];

const GOALS = [
  { id: "gerar_leads", label: "Gerar mais leads qualificados" },
  { id: "fechar_vendas", label: "Fechar mais vendas" },
  { id: "escalar_atendimento", label: "Escalar atendimento" },
  { id: "reduzir_custo", label: "Reduzir custo operacional" },
];

interface Answers {
  name: string;
  email: string;
  whatsapp: string;
  channel: string;
  goal: string;
  tool: string;
  needsHuman: boolean;
}

const STORAGE_KEY = "thor_onboarding_answers";

function loadAnswers(): Partial<Answers> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAnswers(a: Partial<Answers>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
  } catch {
    /* noop */
  }
}

export default function ThorOnboardingFlow({
  open,
  onOpenChange,
  reco,
  source = "landing",
}: ThorOnboardingFlowProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(() => ({
    name: "",
    email: "",
    whatsapp: "",
    channel: "",
    goal: "",
    tool: "",
    needsHuman: false,
    ...loadAnswers(),
  }));

  const progress = ((step + 1) / STEP_LABELS.length) * 100;

  useEffect(() => {
    if (open) {
      setStep(0);
      trackKpi("thor_onboarding_started", { source, reco_kind: reco?.kind, reco_id: reco?.deptId });
    }
  }, [open, source, reco]);

  useEffect(() => {
    if (open) saveAnswers(answers);
  }, [answers, open]);

  const update = <K extends keyof Answers>(k: K, v: Answers[K]) =>
    setAnswers((prev) => ({ ...prev, [k]: v }));

  const canAdvance = useMemo(() => {
    if (step === 0) return answers.name.trim().length > 1 && /\S+@\S+\.\S+/.test(answers.email);
    if (step === 1) return Boolean(answers.channel && answers.goal);
    if (step === 2) return Boolean(answers.tool);
    return true;
  }, [step, answers]);

  const goNext = () => {
    if (!canAdvance) return;
    trackKpi("thor_onboarding_step", { step: step + 1, source, reco_kind: reco?.kind });
    if (step < STEP_LABELS.length - 1) setStep((s) => s + 1);
  };

  const goPanel = () => {
    trackKpi("thor_onboarding_completed", {
      source,
      reco_kind: reco?.kind,
      reco_id: reco?.deptId,
      target: "panel",
    });
    onOpenChange(false);
    navigate("/preview-dashboard");
  };

  const goCheckout = () => {
    trackKpi("thor_onboarding_completed", {
      source,
      reco_kind: reco?.kind,
      reco_id: reco?.deptId,
      target: "checkout",
    });
    onOpenChange(false);
    if (reco?.kind === "departamento" && reco.deptId) {
      navigate(`/contratar/${reco.deptId}`);
    } else if (reco?.kind === "squad") {
      navigate("/team-builder");
    } else {
      navigate("/marketplace");
    }
  };

  const goHuman = () => {
    trackKpi("thor_onboarding_completed", {
      source,
      reco_kind: reco?.kind,
      reco_id: reco?.deptId,
      target: "human",
    });
    onOpenChange(false);
    const msg = encodeURIComponent(
      `Olá! Sou ${answers.name || "um interessado"}. Acabei de conversar com o Thor e ele me indicou: ${
        reco?.label ?? "uma solução"
      }. Gostaria de falar com alguém do time.`,
    );
    window.open(`https://wa.me/5511999999999?text=${msg}`, "_blank", "noopener,noreferrer");
  };

  const handleClose = (v: boolean) => {
    if (!v && step < STEP_LABELS.length - 1) {
      trackKpi("thor_onboarding_abandoned", { step: step + 1, source, reco_kind: reco?.kind });
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header · progresso */}
        <div className="px-6 pt-6 pb-4 border-b border-border/40 bg-card/50">
          <DialogHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/90">
                Passo {step + 1} de {STEP_LABELS.length}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                {STEP_LABELS[step]}
              </span>
            </div>
            <DialogTitle className="font-serif italic text-2xl leading-tight text-foreground">
              {step === 0 && "Vamos deixar tudo pronto pra você."}
              {step === 1 && "Me conta mais sobre a operação."}
              {step === 2 && "Como vamos plugar a IA no seu dia?"}
              {step === 3 && "Tudo pronto. É só ativar."}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground leading-relaxed">
              {step === 0 && "Dados básicos pra personalizar a ativação. Nada disso é público."}
              {step === 1 && "3 respostas rápidas pra eu configurar o time do jeito certo."}
              {step === 2 && "Você escolhe onde a IA opera. Dá pra plugar mais canais depois."}
              {step === 3 && "Seu painel já foi provisionado. Escolha como quer seguir."}
            </DialogDescription>
            <Progress value={progress} className="h-1 mt-3" />
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="thor-name" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Como te chamamos?
                </Label>
                <Input
                  id="thor-name"
                  value={answers.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Seu nome"
                  className="h-11"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="thor-email" className="text-xs uppercase tracking-wider text-muted-foreground">
                  E-mail corporativo
                </Label>
                <Input
                  id="thor-email"
                  type="email"
                  value={answers.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="voce@empresa.com"
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="thor-wpp" className="text-xs uppercase tracking-wider text-muted-foreground">
                  WhatsApp (opcional)
                </Label>
                <Input
                  id="thor-wpp"
                  value={answers.whatsapp}
                  onChange={(e) => update("whatsapp", e.target.value)}
                  placeholder="+55 11 99999-9999"
                  className="h-11"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Principal canal de contato hoje
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {CHANNELS.map((c) => {
                    const active = answers.channel === c.id;
                    const Icon = c.icon;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => update("channel", c.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all text-left",
                          active
                            ? "border-primary/60 bg-primary/10 text-foreground shadow-[0_0_20px_-8px_hsl(var(--primary)/0.5)]"
                            : "border-border/60 bg-card/40 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Meta pros próximos 30 dias
                </Label>
                <div className="grid gap-2">
                  {GOALS.map((g) => {
                    const active = answers.goal === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => update("goal", g.id)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition-all text-left",
                          active
                            ? "border-primary/60 bg-primary/10 text-foreground"
                            : "border-border/60 bg-card/40 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                        )}
                      >
                        <span>{g.label}</span>
                        {active && <Check className="h-4 w-4 text-primary" strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Ferramenta principal hoje
              </Label>
              <div className="grid gap-2">
                {TOOLS.map((t) => {
                  const active = answers.tool === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => update("tool", t.id)}
                      className={cn(
                        "flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all text-left",
                        active
                          ? "border-primary/60 bg-primary/10 text-foreground"
                          : "border-border/60 bg-card/40 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                      )}
                    >
                      <span>{t.label}</span>
                      {active && <Check className="h-4 w-4 text-primary" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground/70 pt-2 leading-relaxed">
                Não se preocupe se ainda não tem nada estruturado. A IA começa a operar mesmo sem CRM,
                a gente pluga depois.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-primary/30 bg-primary/[0.06] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" strokeWidth={2} />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                    Painel provisionado
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-0.5">
                      Solução
                    </div>
                    <div className="font-medium text-foreground truncate">{reco?.label}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-0.5">
                      Investimento
                    </div>
                    <div className="font-medium text-foreground">{reco?.priceLabel}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-0.5">
                      Canal
                    </div>
                    <div className="font-medium text-foreground capitalize">
                      {answers.channel || ","}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-0.5">
                      Ativação
                    </div>
                    <div className="font-medium text-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3 text-primary" strokeWidth={2} />
                      &lt; 5 minutos
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <Button
                  onClick={goPanel}
                  size="lg"
                  className={cn(
                    "w-full gap-2 h-12 rounded-xl font-semibold text-[15px]",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "shadow-[0_10px_30px_-8px_hsl(var(--primary)/0.55)]",
                  )}
                >
                  <LayoutDashboard className="h-4 w-4" strokeWidth={2} />
                  Ver o painel agora
                </Button>
                <Button
                  onClick={goCheckout}
                  size="lg"
                  variant="outline"
                  className="w-full gap-2 h-12 rounded-xl font-semibold text-[15px] border-primary/40 hover:bg-primary/5"
                >
                  <Rocket className="h-4 w-4" strokeWidth={2} />
                  Finalizar contratação
                </Button>
                <button
                  type="button"
                  onClick={goHuman}
                  className="w-full text-center text-[12px] text-muted-foreground hover:text-foreground transition-colors pt-1"
                >
                  Prefiro falar com alguém do time antes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav (steps 0,1,2) */}
        {step < STEP_LABELS.length - 1 && (
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border/40 bg-card/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar
            </Button>
            <Button
              onClick={goNext}
              disabled={!canAdvance}
              size="sm"
              className={cn(
                "gap-1.5 h-10 px-5 rounded-lg font-semibold",
                "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              Continuar
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
