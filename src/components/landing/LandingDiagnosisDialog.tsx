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
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  PAIN_TO_RECOMMENDATION,
  PAIN_TO_DEPT_ID,
  saveDiagnosis,
  saveThorBriefing,
  type DeliveryMode,
  type PainId,
} from "@/lib/diagnosis-routing";
import { getRegion, formatPrice } from "@/lib/pricing";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAINS: {
  id: PainId;
  icon: LucideIcon;
  title: string;
  desc: string;
}[] = [
  { id: "leads",   icon: TrendingUp,   title: "Captar mais clientes",             desc: "Leads qualificados sem esforço." },
  { id: "ops",     icon: Wrench,       title: "Automatizar operação",             desc: "Cobrança, follow-up, relatórios." },
  { id: "content", icon: PenLine,      title: "Produzir conteúdo",                desc: "Posts e artigos com voz de marca." },
  { id: "support", icon: MessageCircle,title: "Escalar atendimento",              desc: "WhatsApp, e-mail e chat 24/7." },
  { id: "legal",   icon: Scale,        title: "Automatizar escritório jurídico",  desc: "Captação, triagem e contratos." },
  { id: "other",   icon: Users,        title: "Outra coisa",                      desc: "Vou descrever com minhas palavras." },
];

const DELIVERY: {
  id: DeliveryMode;
  icon: LucideIcon;
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

  // Kick off Firecrawl + Thor briefing as early as we can (right after the
  // "company" step), so by the time the user finishes the quiz the briefing
  // is already sitting in localStorage waiting for the panel.
  const kickBriefing = () => {
    const site = website.trim();
    const comp = company.trim();
    if (!site && !comp && !freeText.trim()) return;
    supabase.functions
      .invoke("diagnosis-scrape", {
        body: {
          website: site || undefined,
          company: comp || undefined,
          pain: pain ?? undefined,
          freeText: freeText.trim() || undefined,
          departmentLabel: rec?.departmentLabel,
        },
      })
      .then(({ data }) => {
        if (data?.briefing) {
          saveThorBriefing(data.briefing, data.siteSummary);
        }
      })
      .catch((err) => {
        // fire-and-forget — panel has a fallback greeting
        console.warn("diagnosis-scrape failed", err);
      });
  };

  const goToRecommendation = () => {
    if (!rec) return;
    persist();
    kickBriefing();
    // Fluxo unificado: sai do quiz DIRETO pra criação de conta e painel.
    // Sem passar por /departamentos, /advocacia ou /outcomes — pagamento
    // acontece dentro do painel quando ela decidir ativar o time.
    onOpenChange(false);
    reset();
    navigate("/auth?signup=1&redirect=/dashboard");
  };

  const canAdvance =
    step === "company" ? true
      : step === "pain" ? !!pain
      : step === "delivery" ? !!delivery
      : true;

  const goNext = () => {
    if (step === "company") { kickBriefing(); setStep("pain"); }
    else if (step === "pain") setStep("delivery");
    else if (step === "delivery") setStep("result");
  };

  const goBack = () => {
    if (step === "pain") setStep("company");
    else if (step === "delivery") setStep("pain");
    else if (step === "result") setStep("delivery");
    else handleClose(false);
  };

  const hasCompanyContent = !!(company || website || freeText);
  const primaryLabel =
    step === "result"
      ? rec?.ctaLabel ?? "Continuar"
      : step === "company"
        ? (hasCompanyContent ? "Continuar" : "Pular etapa")
        : "Continuar";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-[580px] w-[calc(100vw-2rem)] p-0 gap-0 overflow-hidden border-white/5 bg-[#0D0D0D] rounded-[28px] md:rounded-[32px] shadow-2xl [&>button]:hidden max-h-[92dvh] flex flex-col"
        aria-describedby={undefined}
      >
        <div className="p-5 sm:p-7 md:p-9 flex flex-col min-h-0 flex-1">
          {/* Progress Header — hairline */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex gap-1.5 flex-1">
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    "h-0.5 flex-1 rounded-full transition-all duration-500",
                    i <= stepIndex ? "bg-red-500" : "bg-white/10",
                  )}
                />
              ))}
            </div>
            <button
              onClick={() => handleClose(false)}
              className="ml-6 text-white/30 hover:text-white transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Title block */}
          <div className="space-y-1.5 mb-4 sm:mb-6">
            <p className="text-[10px] font-bold tracking-[0.2em] text-red-500 uppercase">
              Passo {stepIndex + 1} de {STEPS.length}
            </p>
            <DialogTitle className="font-display text-xl sm:text-2xl md:text-[26px] font-semibold text-white tracking-tight leading-[1.15]">
              {step === "company" && "Me conta sobre sua empresa."}
              {step === "pain" && "O que você quer resolver primeiro?"}
              {step === "delivery" && "Como você prefere começar?"}
              {step === "result" && rec && (
                <>
                  Seu time ideal é <span className="text-red-500">{rec.departmentLabel}</span>.
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-white/40 text-[13px] sm:text-sm font-normal leading-relaxed pt-0.5">
              {step === "company" && "Vamos analisar seu site e entender seu contexto — leva 30 segundos."}
              {step === "pain" && "Sem julgamento. Depois refinamos com Thor se precisar."}
              {step === "delivery" && "Você pode mudar depois. Nada é definitivo aqui."}
              {step === "result" && "Baseado no que você contou, esse é o time que resolve."}
            </DialogDescription>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">

            <AnimatePresence mode="wait">
              {/* STEP 1 — COMPANY */}
              {step === "company" && (
                <motion.div
                  key="company"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="group">
                    <label className="flex items-center gap-2 text-[13px] font-medium text-white/40 mb-2 group-focus-within:text-white/60 transition-colors">
                      <Building2 className="w-4 h-4" strokeWidth={1.5} />
                      Nome da empresa
                    </label>
                    <Input
                      autoFocus
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Ex: Silva & Associados Advogados"
                      className="w-full bg-white/[0.03] border-white/10 rounded-xl px-4 py-3 h-auto text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-red-500/50 focus-visible:ring-offset-0 focus:border-red-500/50 transition-all hover:bg-white/[0.05]"
                      maxLength={120}
                    />
                  </div>

                  <div className="group">
                    <label className="flex items-center gap-2 text-[13px] font-medium text-white/40 mb-2 group-focus-within:text-white/60 transition-colors">
                      <Globe className="w-4 h-4" strokeWidth={1.5} />
                      Site (opcional — vamos analisar para você)
                    </label>
                    <Input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="silvaeassociados.com.br"
                      className="w-full bg-white/[0.03] border-white/10 rounded-xl px-4 py-3 h-auto text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-red-500/50 focus-visible:ring-offset-0 focus:border-red-500/50 transition-all hover:bg-white/[0.05]"
                      maxLength={200}
                    />
                  </div>

                  <div className="group">
                    <label className="flex items-center gap-2 text-[13px] font-medium text-white/40 mb-2 group-focus-within:text-white/60 transition-colors">
                      <PenLine className="w-4 h-4" strokeWidth={1.5} />
                      Me conta em uma frase (opcional)
                    </label>
                    <div className="relative">
                      <Textarea
                        value={freeText}
                        onChange={(e) => setFreeText(e.target.value)}
                        placeholder="Ex: Escritório de família em SP focado em direito trabalhista, quero captar mais clientes."
                        className="w-full bg-white/[0.03] border-white/10 rounded-xl px-5 py-4 min-h-[72px] text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-red-500/50 focus-visible:ring-offset-0 focus:border-red-500/50 transition-all hover:bg-white/[0.05] resize-none"
                        maxLength={280}
                      />
                      <span className="absolute bottom-3 right-4 text-[10px] text-white/20 font-medium tabular-nums uppercase tracking-wider">
                        {freeText.length} / 280
                      </span>
                    </div>
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
                  className="grid grid-cols-1 md:grid-cols-2 gap-2.5"
                >
                  {PAINS.map((p) => {
                    const Icon = p.icon;
                    const active = pain === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPain(p.id)}
                        className={cn(
                          "group text-left rounded-xl border p-4 transition-all duration-200",
                          active
                            ? "border-red-500/50 bg-red-500/[0.06]"
                            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/20",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                              active
                                ? "bg-red-500/15 text-red-500"
                                : "bg-white/[0.04] text-white/50 group-hover:text-white/70",
                            )}
                          >
                            <Icon className="h-4 w-4" strokeWidth={1.5} />
                          </div>
                          <div className="min-w-0">
                            <p className={cn(
                              "text-[13.5px] font-semibold leading-tight transition-colors",
                              active ? "text-white" : "text-white/85",
                            )}>{p.title}</p>
                            <p className="text-[11.5px] text-white/40 mt-1 leading-snug">{p.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}

              {/* STEP 3 — DELIVERY */}
              {step === "delivery" && (
                <motion.div
                  key="delivery"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3"
                >
                  {DELIVERY.map((d) => {
                    const Icon = d.icon;
                    const active = delivery === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => setDelivery(d.id)}
                        className={cn(
                          "w-full text-left rounded-xl border p-5 transition-all duration-200",
                          active
                            ? "border-red-500/50 bg-red-500/[0.06]"
                            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/20",
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0",
                              active
                                ? "bg-red-500/15 text-red-500"
                                : "bg-white/[0.04] text-white/50",
                            )}
                          >
                            <Icon className="h-5 w-5" strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white">{d.title}</p>
                              <span
                                className={cn(
                                  "text-[10px] font-medium px-2 py-0.5 rounded-full border tracking-wide uppercase",
                                  active
                                    ? "border-red-500/40 text-red-500 bg-red-500/10"
                                    : "border-white/15 text-white/50",
                                )}
                              >
                                {d.badge}
                              </span>
                            </div>
                            <p className="text-[12px] text-white/45 mt-1.5 leading-relaxed">{d.desc}</p>
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
                  className="space-y-5"
                >
                  {/* Savings hero */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-red-500 uppercase">
                      Você economiza cerca de
                    </p>
                    <p className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-white mt-2">
                      {BRL(rec.monthlySavings)}
                      <span className="text-base font-normal text-white/40 ml-1.5">/mês</span>
                    </p>
                    <p className="text-[12px] text-white/50 mt-3 leading-relaxed">
                      vs contratar um time CLT equivalente. Primeira ação em{" "}
                      <span className="text-white font-medium">{rec.timeToValue}</span>.
                    </p>
                  </div>

                  {/* What it does */}
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase mb-3">
                      O que esse time vai fazer por você
                    </p>
                    <ul className="space-y-2">
                      {rec.does.map((line, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.06 }}
                          className="flex items-start gap-2.5 text-[13px] leading-relaxed"
                        >
                          <CheckCircle2 className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                          <span className="text-white/80">{line}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {(company || website) && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[11.5px] text-white/50 leading-relaxed">
                      Thor vai analisar {website ? <span className="text-white font-medium">{website}</span> : "seu site"}
                      {company ? <> e adaptar tudo para <span className="text-white font-medium">{company}</span></> : null}{" "}
                      antes de ativar.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 mt-4 sm:mt-6 shrink-0">
            <button
              onClick={goBack}
              className="text-[14px] font-medium text-white/40 hover:text-white transition-colors px-2 py-1 shrink-0"
            >
              {step === "company" ? "Fechar" : "Voltar"}
            </button>

            {step === "result" ? (
              <button
                onClick={goToRecommendation}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-[14px] sm:text-[15px] font-semibold transition-all shadow-lg shadow-red-900/20 active:scale-95 min-w-0"
              >
                <span className="truncate">{rec?.ctaLabel}</span>
                <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={2} />
              </button>
            ) : (
              <button
                onClick={goNext}
                disabled={!canAdvance}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-[14px] sm:text-[15px] font-semibold transition-all shadow-lg shadow-red-900/20 active:scale-95 disabled:active:scale-100 min-w-0"
              >
                <span className="truncate">{primaryLabel}</span>
                <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={2} />
              </button>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
