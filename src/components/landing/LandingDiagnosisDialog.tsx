import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  Scale,
  TrendingUp,
  Users,
  Wrench,
  Layers,
  Blocks,
  PenLine,
  Building2,
  Globe,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  PAIN_TO_RECOMMENDATION,
  saveDiagnosis,
  type DeliveryMode,
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
  { id: "leads",   icon: TrendingUp,   title: "Captar mais clientes",         desc: "Leads qualificados chegando sem esforço." },
  { id: "ops",     icon: Wrench,       title: "Automatizar operação",         desc: "Cobrança, follow-up, relatórios manuais." },
  { id: "content", icon: PenLine,      title: "Produzir conteúdo",            desc: "Posts e artigos com voz de marca." },
  { id: "support", icon: MessageCircle,title: "Escalar atendimento",          desc: "WhatsApp, e-mail e chat sem parar." },
  { id: "legal",   icon: Scale,        title: "Automatizar escritório jurídico", desc: "Captação, triagem e contratos." },
  { id: "other",   icon: Users,        title: "Outra coisa",                  desc: "Vou descrever com minhas palavras." },
];

const DELIVERY: {
  id: DeliveryMode;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  badge: string;
}[] = [
  {
    id: "department",
    icon: Layers,
    title: "Departamento pronto",
    desc: "Time inteiro pré-montado. Ativa e começa a operar hoje.",
    badge: "Mais rápido",
  },
  {
    id: "squad",
    icon: Blocks,
    title: "Montar squad customizado",
    desc: "Você escolhe cada agente. Thor te guia na composição.",
    badge: "Mais controle",
  },
];

type Step = "company" | "pain" | "delivery" | "result";
const STEPS: Step[] = ["company", "pain", "delivery", "result"];

const BRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function LandingDiagnosisDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("company");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [pain, setPain] = useState<PainId | null>(null);
  const [freeText, setFreeText] = useState("");
  const [delivery, setDelivery] = useState<DeliveryMode | null>(null);

  const reset = () => {
    setStep("company");
    setCompany("");
    setWebsite("");
    setPain(null);
    setFreeText("");
    setDelivery(null);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const rec = pain ? PAIN_TO_RECOMMENDATION[pain] : null;
  const stepIndex = STEPS.indexOf(step);

  const persist = () => {
    if (!pain) return;
    saveDiagnosis({
      pain,
      freeText: freeText.trim() || undefined,
      company: company.trim() || undefined,
      website: website.trim() || undefined,
      delivery: delivery ?? undefined,
      createdAt: new Date().toISOString(),
    });
  };

  const goToRecommendation = () => {
    if (!rec) return;
    persist();
    let route = rec.route;
    if (delivery === "squad" || pain === "other") {
      const goal = freeText.trim() || company.trim();
      route = goal ? `/outcomes?goal=${encodeURIComponent(goal)}` : "/outcomes";
    }
    onOpenChange(false);
    reset();
    navigate(route);
  };

  const canAdvance =
    step === "company" ? true // opcional — pode pular
      : step === "pain" ? !!pain
      : step === "delivery" ? !!delivery
      : true;

  const goNext = () => {
    if (step === "company") setStep("pain");
    else if (step === "pain") setStep("delivery");
    else if (step === "delivery") setStep("result");
  };

  const goBack = () => {
    if (step === "pain") setStep("company");
    else if (step === "delivery") setStep("pain");
    else if (step === "result") setStep("delivery");
    else handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-2xl p-0 gap-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-xl"
        aria-describedby={undefined}
      >
        {/* Header ultra-minimal — sem estrela, sem gradiente saturado */}
        <div className="relative px-7 pt-7 pb-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
              <span className="inline-block h-1 w-1 rounded-full bg-primary" />
              Passo {stepIndex + 1} de {STEPS.length}
            </div>
            <div className="flex gap-1">
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    "h-[3px] rounded-full transition-all duration-500",
                    i < stepIndex ? "w-6 bg-primary" : i === stepIndex ? "w-10 bg-primary" : "w-6 bg-border/60",
                  )}
                />
              ))}
            </div>
          </div>

          <DialogTitle className="font-display text-[26px] md:text-[32px] leading-[1.1] font-semibold tracking-tight">
            {step === "company" && "Me conta sobre sua empresa."}
            {step === "pain" && "O que você quer resolver primeiro?"}
            {step === "delivery" && "Como você prefere começar?"}
            {step === "result" && rec && (
              <>
                Seu time ideal é{" "}
                <span className="text-primary">{rec.departmentLabel}</span>.
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
            {step === "company" && "Vamos analisar seu site e entender seu contexto — leva 30 segundos."}
            {step === "pain" && "Sem julgamento. Depois refinamos com Thor se precisar."}
            {step === "delivery" && "Você pode mudar depois. Nada é definitivo aqui."}
            {step === "result" && "Baseado no que você contou, esse é o time que resolve."}
          </DialogDescription>
        </div>

        <div className="px-7 pb-2 max-h-[58vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* STEP 1 — COMPANY */}
            {step === "company" && (
              <motion.div
                key="company"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 pb-2"
              >
                <div>
                  <label className="flex items-center gap-2 text-[12px] font-medium text-foreground/90 mb-2">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                    Nome da empresa
                  </label>
                  <Input
                    autoFocus
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Ex: Silva & Associados Advogados"
                    className="h-11 bg-background/60 border-border/60"
                    maxLength={120}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[12px] font-medium text-foreground/90 mb-2">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                    Site (opcional — vamos analisar para você)
                  </label>
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="silvaeassociados.com.br"
                    className="h-11 bg-background/60 border-border/60"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[12px] font-medium text-foreground/90 mb-2">
                    <PenLine className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                    Me conta em uma frase (opcional)
                  </label>
                  <Textarea
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    placeholder="Ex: Escritório de família em SP focado em direito trabalhista, quero captar mais clientes."
                    className="min-h-[72px] resize-none bg-background/60 border-border/60"
                    maxLength={280}
                  />
                  <p className="text-[11px] text-muted-foreground/70 mt-1.5 text-right">
                    {freeText.length}/280
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 2 — PAIN */}
            {step === "pain" && (
              <motion.div
                key="pain"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="pb-2"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {PAINS.map((p) => {
                    const Icon = p.icon;
                    const active = pain === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPain(p.id)}
                        className={cn(
                          "group text-left rounded-xl border p-3.5 transition-all duration-200",
                          "hover:-translate-y-[1px]",
                          active
                            ? "border-primary/70 bg-primary/[0.06] shadow-[0_0_0_1px_hsl(var(--primary)/0.4),0_8px_28px_-12px_hsl(var(--primary)/0.45)]"
                            : "border-border/50 hover:border-primary/40 hover:bg-primary/[0.02]",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                              active
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-semibold leading-tight">{p.title}</p>
                            <p className="text-[11.5px] text-muted-foreground mt-1 leading-snug">{p.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 3 — DELIVERY MODE */}
            {step === "delivery" && (
              <motion.div
                key="delivery"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="pb-2 space-y-2.5"
              >
                {DELIVERY.map((d) => {
                  const Icon = d.icon;
                  const active = delivery === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setDelivery(d.id)}
                      className={cn(
                        "w-full text-left rounded-xl border p-4 transition-all duration-200",
                        active
                          ? "border-primary/70 bg-primary/[0.06] shadow-[0_0_0_1px_hsl(var(--primary)/0.4),0_8px_28px_-12px_hsl(var(--primary)/0.45)]"
                          : "border-border/50 hover:border-primary/40",
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0",
                            active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Icon className="h-5 w-5" strokeWidth={1.75} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{d.title}</p>
                            <span
                              className={cn(
                                "text-[10px] font-medium px-1.5 py-0.5 rounded-full border tracking-wide",
                                active
                                  ? "border-primary/40 text-primary bg-primary/10"
                                  : "border-border/60 text-muted-foreground",
                              )}
                            >
                              {d.badge}
                            </span>
                          </div>
                          <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{d.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}

            {/* STEP 4 — RESULT */}
            {step === "result" && rec && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="pb-2 space-y-4"
              >
                {/* Savings hero */}
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.08] via-primary/[0.03] to-transparent p-5">
                  <p className="text-[11px] font-medium tracking-widest text-primary uppercase">
                    Você economiza cerca de
                  </p>
                  <p className="font-display text-4xl md:text-5xl font-semibold tracking-tight mt-1">
                    {BRL(rec.monthlySavings)}
                    <span className="text-base font-normal text-muted-foreground ml-1.5">/mês</span>
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed">
                    vs contratar um time CLT equivalente. Primeira ação executada em{" "}
                    <span className="text-foreground font-medium">{rec.timeToValue}</span>.
                  </p>
                </div>

                {/* What it does */}
                <div>
                  <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase mb-2.5">
                    O que esse time vai fazer por você
                  </p>
                  <ul className="space-y-1.5">
                    {rec.does.map((line, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.06 }}
                        className="flex items-start gap-2.5 text-[13px] leading-relaxed"
                      >
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={2} />
                        <span className="text-foreground/85">{line}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {(company || website) && (
                  <div className="rounded-lg border border-border/40 bg-muted/30 px-3.5 py-2.5 text-[11.5px] text-muted-foreground leading-relaxed">
                    Thor vai analisar {website ? <span className="text-foreground font-medium">{website}</span> : "seu site"}
                    {company ? <> e adaptar tudo para <span className="text-foreground font-medium">{company}</span></> : null}{" "}
                    antes de ativar.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-border/40 px-7 py-4 flex items-center justify-between gap-3 bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="text-muted-foreground text-[12px] h-9"
          >
            {step === "company" ? (
              "Fechar"
            ) : (
              <>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Voltar
              </>
            )}
          </Button>

          {step === "result" ? (
            <Button onClick={goToRecommendation} size="sm" className="h-9 font-medium">
              {rec?.ctaLabel}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canAdvance} size="sm" className="h-9 font-medium">
              {step === "company" && (company || website || freeText) ? "Continuar" : step === "company" ? "Pular etapa" : "Continuar"}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
