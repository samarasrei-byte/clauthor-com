/**
 * ThorGuestTour — tour guiado de 5 passos para usuários NÃO autenticados
 * que iniciaram checkout. Objetivo: demonstrar valor antes de exigir cadastro.
 *
 * Padrão idêntico ao DashboardTour, mas:
 * - Não persiste em profiles (usuário sem conta ainda)
 * - Passos focados em VALOR (não em orientação de UI)
 * - CTA final leva a /auth com hireIntent preservado
 * - Pode ser fechado a qualquer momento, mas reaparece se refresh
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Sparkles, ShieldCheck, Bot, TrendingUp, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type IconKind = "welcome" | "agents" | "approvals" | "metrics" | "activate";

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: "right" | "bottom" | "left" | "top" | "center";
  icon: IconKind;
  cta?: string;
}

interface ThorGuestTourProps {
  cartLabel: string;
  totalMonthly: string;
  onActivate: () => void;
  onDismiss: () => void;
}

const ICON_MAP: Record<IconKind, typeof Sparkles> = {
  welcome: Sparkles,
  agents: Bot,
  approvals: ShieldCheck,
  metrics: TrendingUp,
  activate: Rocket,
};

export function ThorGuestTour({ cartLabel, totalMonthly, onActivate, onDismiss }: ThorGuestTourProps) {
  const STEPS: TourStep[] = [
    {
      target: "guest-header",
      title: `Bem-vindo ao seu ${cartLabel}`,
      description:
        "Este é um preview do painel que você recebe após ativar. Todos os dados abaixo são exemplos — os seus vão ser reais em minutos.",
      position: "bottom",
      icon: "welcome",
    },
    {
      target: "guest-agents",
      title: "Seus agentes rodando 24/7",
      description:
        "Cada agente executa tarefas específicas do seu departamento sem parar. Você não gerencia agentes — você comanda resultados.",
      position: "right",
      icon: "agents",
    },
    {
      target: "guest-approvals",
      title: "Você comanda, a IA executa",
      description:
        "Nada crítico sai sem sua aprovação. Cada peça passa pelo seu painel antes de ir para o mundo. Você é o CEO, não o operador.",
      position: "left",
      icon: "approvals",
    },
    {
      target: "guest-metrics",
      title: "Impacto medido em tempo real",
      description:
        "Cada agente reporta o que gerou: leads, peças, respostas, receita. Você vê o ROI direto, sem precisar montar planilha.",
      position: "top",
      icon: "metrics",
    },
    {
      target: "guest-activate",
      title: "Pronto para ativar",
      description: `Por ${totalMonthly}/mês, tudo isso vira real na sua conta. Um clique cria seu login e leva você ao pagamento.`,
      position: "center",
      icon: "activate",
      cta: "Criar conta e ativar",
    },
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const Icon = ICON_MAP[step.icon];

  useEffect(() => {
    const updatePosition = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (!el) {
        setPosition(null);
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect(r);

      const CARD_W = 340;
      const CARD_H = 220;
      const GAP = 16;
      let top = 0;
      let left = 0;

      switch (step.position) {
        case "right":
          top = r.top + r.height / 2 - CARD_H / 2;
          left = r.right + GAP;
          break;
        case "left":
          top = r.top + r.height / 2 - CARD_H / 2;
          left = r.left - CARD_W - GAP;
          break;
        case "bottom":
          top = r.bottom + GAP;
          left = r.left + r.width / 2 - CARD_W / 2;
          break;
        case "top":
          top = r.top - CARD_H - GAP;
          left = r.left + r.width / 2 - CARD_W / 2;
          break;
        case "center":
        default:
          top = window.innerHeight / 2 - CARD_H / 2;
          left = window.innerWidth / 2 - CARD_W / 2;
      }

      // Clamp to viewport
      top = Math.max(16, Math.min(top, window.innerHeight - CARD_H - 16));
      left = Math.max(16, Math.min(left, window.innerWidth - CARD_W - 16));
      setPosition({ top, left });
    };

    updatePosition();
    const t = setTimeout(updatePosition, 200);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [step.target, step.position]);

  const advance = useCallback(() => {
    if (isLast) {
      onActivate();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [isLast, onActivate]);

  return (
    <>
      {/* Backdrop + spotlight cutout via SVG mask */}
      <svg className="fixed inset-0 z-[9998] pointer-events-none w-full h-full">
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && step.position !== "center" && (
              <rect
                x={rect.left - 6}
                y={rect.top - 6}
                width={rect.width + 12}
                height={rect.height + 12}
                rx={14}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#tour-mask)"
          style={{ pointerEvents: "auto" }}
          onClick={onDismiss}
        />
      </svg>

      {/* Spotlight ring */}
      {rect && step.position !== "center" && (
        <motion.div
          key={`ring-${currentStep}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="fixed z-[9998] pointer-events-none rounded-2xl ring-2 ring-primary/60 ring-offset-2 ring-offset-background"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      )}

      {/* Tour card */}
      <AnimatePresence mode="wait">
        {position && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={cn(
              "fixed z-[9999] w-[340px] rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl p-5",
              "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]",
            )}
            style={{ top: position.top, left: position.left }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-primary font-semibold uppercase tracking-[0.14em]">
                    Thor · {currentStep + 1}/{STEPS.length}
                  </p>
                  <h4 className="text-[15px] font-semibold leading-tight mt-0.5 tracking-[-0.01em]">
                    {step.title}
                  </h4>
                </div>
              </div>
              <button
                onClick={onDismiss}
                className="p-1 rounded-md hover:bg-muted/40 text-muted-foreground transition-colors"
                aria-label="Fechar tour"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
              {step.description}
            </p>

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={onDismiss}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Pular tour
              </button>
              <Button size="sm" className="h-8 text-xs gap-1.5 px-3" onClick={advance}>
                {isLast ? (
                  <>
                    <Rocket className="w-3.5 h-3.5" /> {step.cta ?? "Ativar agora"}
                  </>
                ) : (
                  <>
                    Próximo <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </Button>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={cn(
                    "h-1 rounded-full transition-all",
                    i === currentStep
                      ? "w-6 bg-primary"
                      : i < currentStep
                      ? "w-1 bg-primary/50"
                      : "w-1 bg-muted",
                  )}
                  aria-label={`Ir para passo ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ThorGuestTour;
