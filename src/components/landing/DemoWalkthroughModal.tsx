/**
 * DemoWalkthroughModal · walkthrough rápido (5 passos) da plataforma Clauthor.
 *
 * Abre a partir do botão "Ver demonstração" no hero. Estilo Apple:
 * preto puro, tipografia densa, acento vermelho, sem gradientes coloridos.
 * Cada passo tem título, descrição e um "canvas" ilustrativo (SVG/mock).
 */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Users,
  ShieldCheck,
  LineChart,
  Sparkles,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { trackKpi } from "@/lib/kpiTracker";

interface DemoWalkthroughModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = [
  {
    icon: MessageSquare,
    kicker: "Passo 1 · Diagnóstico",
    title: "Thor entende sua operação em ~90s",
    desc: "Um chat consultivo mapeia sua empresa (site, dores, canais) e recomenda quais departamentos ativar primeiro.",
    highlight: "Diagnóstico em 90s",
  },
  {
    icon: Users,
    kicker: "Passo 2 · Departamento",
    title: "Você contrata um departamento, não um bot avulso",
    desc: "Cada departamento vem com squad de especialistas de IA, playbook, memória e integrações prontas (WhatsApp, LinkedIn, PayPal, CRM…).",
    highlight: "20 departamentos · +200 especialistas",
  },
  {
    icon: ShieldCheck,
    kicker: "Passo 3 · Aprovações",
    title: "IA executa. Você aprova o que importa.",
    desc: "Nos pontos críticos (envio de proposta, publicação, pagamento), o Approvals Center pede seu OK em 1 clique — human-in-the-loop de verdade.",
    highlight: "Aprovação em 1 clique",
  },
  {
    icon: LineChart,
    kicker: "Passo 4 · Dashboard",
    title: "Mission Control com ROI auditável",
    desc: "KPIs por departamento, timeline de execução, replay de cada decisão da IA e cálculo de economia vs CLT sênior — nada de vaidade métrica.",
    highlight: "ROI vs CLT em tempo real",
  },
  {
    icon: Sparkles,
    kicker: "Passo 5 · Escala",
    title: "Ative mais departamentos quando fizer sentido",
    desc: "Comece por 1 departamento, valide, e ative os próximos. Preço fixo por departamento (a partir de R$ 1.497/mês), sem taxa oculta.",
    highlight: "R$ 1.497/mês por departamento",
  },
];

export default function DemoWalkthroughModal({
  open,
  onOpenChange,
}: DemoWalkthroughModalProps) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  const next = () => {
    if (isLast) return;
    const nextStep = step + 1;
    setStep(nextStep);
    trackKpi("home_demo_walkthrough_step", { step: nextStep + 1 });
  };
  const prev = () => step > 0 && setStep(step - 1);

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setStep(0);
      trackKpi("home_demo_walkthrough_opened", { source: "landing" });
    } else {
      trackKpi("home_demo_walkthrough_closed", { last_step: step + 1 });
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="dark max-w-3xl p-0 gap-0 bg-black text-white border-white/10 overflow-hidden">
        <DialogTitle className="sr-only">
          Demonstração rápida da plataforma Clauthor
        </DialogTitle>

        {/* Progress bar */}
        <div className="flex gap-1.5 p-4 pb-0">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-white/10 hover:bg-white/20",
              )}
              aria-label={`Ir para passo ${i + 1}`}
            />
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Canvas ilustrativo */}
          <div className="relative min-h-[320px] md:min-h-[440px] bg-gradient-to-br from-white/[0.04] to-transparent border-r border-white/10 flex items-center justify-center p-8 overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_40%,hsl(var(--primary)/0.25),transparent_60%)]"
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-2xl" />
                  <div className="relative h-20 w-20 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center backdrop-blur-sm">
                    <Icon className="h-9 w-9 text-primary" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/[0.08] px-3 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-primary">
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                  {current.highlight}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Texto */}
          <div className="p-8 md:p-10 flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="flex-1"
              >
                <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-white/50 mb-4">
                  {current.kicker}
                </p>
                <h3 className="font-display text-2xl md:text-[28px] font-semibold tracking-[-0.02em] leading-[1.15] text-white mb-4">
                  {current.title}
                </h3>
                <p className="text-[15px] text-white/65 leading-relaxed">
                  {current.desc}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Nav */}
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={prev}
                disabled={step === 0}
                className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Anterior
              </button>

              <span className="font-mono text-[11px] tracking-[0.2em] text-white/40 tabular-nums">
                {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
              </span>

              {isLast ? (
                <Link
                  to="/departamentos"
                  onClick={() => {
                    trackKpi("home_demo_walkthrough_cta", { label: "departments" });
                    handleOpenChange(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Ver departamentos
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <button
                  onClick={next}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-white/90 transition-colors"
                >
                  Próximo
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
