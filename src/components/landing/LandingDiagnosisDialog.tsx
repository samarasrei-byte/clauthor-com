import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  MessageCircle,
  Scale,
  Sparkles as SparklesIcon,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  PAIN_TO_RECOMMENDATION,
  saveDiagnosis,
  type CompanySize,
  type PainId,
} from "@/lib/diagnosis-routing";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAINS: {
  id: PainId;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}[] = [
  { id: "leads",   icon: TrendingUp,   title: "Não capto clientes suficientes", desc: "Preciso de mais leads qualificados chegando." },
  { id: "ops",     icon: Wrench,       title: "Time gasta tempo com tarefas repetitivas", desc: "Cobrança, follow-up, relatórios manuais." },
  { id: "content", icon: SparklesIcon, title: "Preciso produzir conteúdo em escala", desc: "Posts, artigos, roteiros com voz de marca." },
  { id: "support", icon: MessageCircle,title: "Atendimento ao cliente é gargalo", desc: "WhatsApp, e-mail e chat sem parar." },
  { id: "legal",   icon: Scale,        title: "Quero automatizar meu escritório de advocacia", desc: "Captação, qualificação e contratos jurídicos." },
  { id: "other",   icon: Users,        title: "Outro / múltiplas dores", desc: "Deixa o Thor recomendar o time certo." },
];

const NICHES = ["Advocacia", "Saúde", "E-commerce", "SaaS", "Educação", "Imobiliário", "Serviços", "Outro"];

const SIZES: { id: CompanySize; label: string; desc: string }[] = [
  { id: "solo",  label: "Solo",           desc: "Só eu por enquanto" },
  { id: "small", label: "2 a 10 pessoas", desc: "Time enxuto" },
  { id: "mid",   label: "10+ pessoas",    desc: "Operação estruturada" },
];

type Step = "pain" | "niche" | "size" | "result";

export default function LandingDiagnosisDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("pain");
  const [pain, setPain] = useState<PainId | null>(null);
  const [freeText, setFreeText] = useState("");
  const [niche, setNiche] = useState<string | null>(null);
  const [size, setSize] = useState<CompanySize | null>(null);

  const reset = () => {
    setStep("pain");
    setPain(null);
    setFreeText("");
    setNiche(null);
    setSize(null);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const rec = pain ? PAIN_TO_RECOMMENDATION[pain] : null;

  const persist = () => {
    if (!pain) return;
    saveDiagnosis({
      pain,
      freeText: freeText.trim() || undefined,
      niche: niche ?? undefined,
      size: size ?? undefined,
      createdAt: new Date().toISOString(),
    });
  };

  const goToRecommendation = () => {
    if (!rec) return;
    persist();
    let route = rec.route;
    if (pain === "other" && freeText.trim()) {
      route = `/outcomes?goal=${encodeURIComponent(freeText.trim())}`;
    }
    onOpenChange(false);
    reset();
    navigate(route);
  };

  const goToThor = () => {
    persist();
    onOpenChange(false);
    reset();
    const goal = freeText.trim();
    navigate(goal ? `/outcomes?goal=${encodeURIComponent(goal)}` : "/outcomes");
  };

  const stepIndex = { pain: 0, niche: 1, size: 2, result: 3 }[step];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-border/40 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary mb-3">
            <SparklesIcon className="h-3 w-3" />
            Diagnóstico rápido · 30s
          </div>
          <DialogTitle className="text-2xl md:text-3xl font-display font-semibold tracking-tight">
            {step === "result" ? "Encontramos seu departamento" : "Qual é a sua maior dor hoje?"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1.5">
            {step === "result"
              ? "Baseado no que você me contou, esse é o time ideal."
              : "Responda 3 perguntas curtas — sem cadastro."}
          </DialogDescription>
          <div className="mt-4 flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i <= stepIndex ? "bg-primary" : "bg-border/60",
                )}
              />
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === "pain" && (
              <motion.div key="pain" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {PAINS.map((p) => {
                    const Icon = p.icon;
                    const active = pain === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPain(p.id)}
                        className={cn(
                          "text-left rounded-xl border p-3.5 transition-all",
                          active
                            ? "border-primary/60 bg-primary/5 ring-1 ring-primary/40"
                            : "border-border/50 hover:border-primary/40 hover:bg-primary/[0.03]",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
                            active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold leading-tight">{p.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-snug">{p.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {pain === "other" && (
                  <div className="mt-4">
                    <label className="text-xs text-muted-foreground mb-1.5 block">Descreva com suas palavras (opcional)</label>
                    <Input
                      value={freeText}
                      onChange={(e) => setFreeText(e.target.value)}
                      placeholder="Ex: quero fechar 30% mais contratos por mês na minha clínica."
                      maxLength={240}
                    />
                  </div>
                )}
              </motion.div>
            )}

            {step === "niche" && (
              <motion.div key="niche" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <p className="text-sm text-muted-foreground mb-4">Qual seu setor ou nicho?</p>
                <div className="flex flex-wrap gap-2">
                  {NICHES.map((n) => (
                    <button
                      key={n}
                      onClick={() => setNiche(n)}
                      className={cn(
                        "px-3.5 py-2 rounded-full text-sm border transition-all",
                        niche === n
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border/60 hover:border-primary/50 hover:bg-primary/5",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === "size" && (
              <motion.div key="size" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <p className="text-sm text-muted-foreground mb-4">Qual o tamanho da operação hoje?</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {SIZES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSize(s.id)}
                      className={cn(
                        "text-left rounded-xl border p-4 transition-all",
                        size === s.id
                          ? "border-primary/60 bg-primary/5 ring-1 ring-primary/40"
                          : "border-border/50 hover:border-primary/40",
                      )}
                    >
                      <Building2 className={cn("h-4 w-4 mb-2", size === s.id ? "text-primary" : "text-muted-foreground")} />
                      <p className="text-sm font-semibold">{s.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === "result" && rec && (
              <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-primary uppercase tracking-wide">Recomendação Thor</p>
                      <h3 className="font-display text-lg md:text-xl font-semibold mt-0.5">{rec.departmentLabel}</h3>
                      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{rec.tagline}</p>
                      {(niche || size) && (
                        <p className="text-xs text-muted-foreground/80 mt-3">
                          Ajustado para {niche ?? "seu setor"}
                          {size ? ` · operação ${SIZES.find((s) => s.id === size)?.label.toLowerCase()}` : ""}.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs text-muted-foreground px-1">Salvamos suas respostas — quando você entrar, Thor já vai saber o contexto.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-t border-border/40 p-4 md:px-8 md:py-4 flex items-center justify-between gap-3 bg-background/60">
          {step === "result" ? (
            <>
              <Button variant="ghost" size="sm" onClick={goToThor} className="text-muted-foreground">
                Falar com Thor
              </Button>
              <Button onClick={goToRecommendation} className="glow">
                {rec?.ctaLabel}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (step === "niche") setStep("pain");
                  else if (step === "size") setStep("niche");
                  else handleClose(false);
                }}
                className="text-muted-foreground"
              >
                {step === "pain" ? "Fechar" : "Voltar"}
              </Button>
              <Button
                onClick={() => {
                  if (step === "pain") setStep(pain ? "niche" : "pain");
                  else if (step === "niche") setStep("size");
                  else if (step === "size") setStep("result");
                }}
                disabled={step === "pain" ? !pain : step === "niche" ? !niche : !size}
              >
                Continuar
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
