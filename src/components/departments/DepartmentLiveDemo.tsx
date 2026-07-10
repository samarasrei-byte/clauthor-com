/**
 * DepartmentLiveDemo — simulação cinematográfica de ~60s do departamento
 * trabalhando em tempo real.
 *
 * Zero backend: usa `setTimeout` sobre `department.timelineDemo` para revelar
 * eventos um a um, com contador animado do outcome sincronizado à progressão.
 *
 * Regras:
 * - Timeline é apenas exibição — se o usuário fechar o dialog, tudo pausa/reset.
 * - Ao chegar no último evento, aparece CTA "Contratar departamento".
 * - Sem chamadas de rede, sem persistência, sem estado global.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DepartmentPackage } from "@/data/departmentPackages";
import { DEPT_COLOR_TOKENS } from "@/data/departmentPackages";
import { trackKpi } from "@/lib/kpiTracker";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";

interface DepartmentLiveDemoProps {
  department: DepartmentPackage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHire: (department: DepartmentPackage) => void;
}

const DepartmentLiveDemo = ({
  department,
  open,
  onOpenChange,
  onHire,
}: DepartmentLiveDemoProps) => {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [paused, setPaused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const completedFiredRef = useRef(false);

  const events = department?.timelineDemo ?? [];
  const progression = department?.outcomeMetric.progression ?? [];
  const isComplete = currentIndex >= events.length - 1 && events.length > 0;

  // Fire `department_demo_completed` exactly once per open+dept.
  useEffect(() => {
    if (!department) {
      completedFiredRef.current = false;
      startedAtRef.current = null;
      return;
    }
    if (open && startedAtRef.current === null) {
      startedAtRef.current = Date.now();
      completedFiredRef.current = false;
    }
    if (isComplete && !completedFiredRef.current && startedAtRef.current !== null) {
      completedFiredRef.current = true;
      trackKpi("department_demo_completed", {
        department_id: department.id,
        department_name: department.name,
        price_monthly: department.priceMonthly,
        duration_ms: Date.now() - startedAtRef.current,
        source: "live_demo",
      });
    }
    if (!open) {
      startedAtRef.current = null;
    }
  }, [open, isComplete, department]);


  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleNext = useCallback(
    (nextIndex: number) => {
      clearTimer();
      if (!department || nextIndex >= department.timelineDemo.length) return;
      const evt = department.timelineDemo[nextIndex];
      timeoutRef.current = setTimeout(() => {
        setCurrentIndex(nextIndex);
      }, evt.delayMs);
    },
    [department, clearTimer]
  );

  // Kick off when dialog opens or department changes.
  useEffect(() => {
    if (!open || !department) {
      clearTimer();
      setCurrentIndex(-1);
      setPaused(false);
      return;
    }
    setCurrentIndex(-1);
    setPaused(false);
    // pequeno atraso inicial para o modal terminar de abrir
    timeoutRef.current = setTimeout(() => setCurrentIndex(0), 400);
    return clearTimer;
  }, [open, department, clearTimer]);

  // Encadeia o próximo evento sempre que o índice avança.
  useEffect(() => {
    if (!department || paused) return;
    if (currentIndex < 0) return;
    if (currentIndex >= department.timelineDemo.length - 1) return;
    scheduleNext(currentIndex + 1);
    return clearTimer;
  }, [currentIndex, paused, department, scheduleNext, clearTimer]);

  // Auto-scroll para o evento mais recente.
  useEffect(() => {
    if (currentIndex < 0 || !scrollRef.current) return;
    const el = scrollRef.current.querySelector<HTMLElement>(
      `[data-event-idx="${currentIndex}"]`
    );
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentIndex]);

  const handlePauseToggle = () => {
    if (paused) {
      setPaused(false);
      // reagenda a partir do índice atual
      scheduleNext(currentIndex + 1);
    } else {
      setPaused(true);
      clearTimer();
    }
  };

  const handleReplay = () => {
    clearTimer();
    setPaused(false);
    setCurrentIndex(-1);
    timeoutRef.current = setTimeout(() => setCurrentIndex(0), 200);
  };

  if (!department) return null;

  const tokens = DEPT_COLOR_TOKENS[department.color];
  const Icon = department.icon;
  const visibleEvents = events.slice(0, Math.max(0, currentIndex + 1));
  const currentMetric =
    currentIndex >= 0 ? progression[currentIndex] ?? 0 : progression[0] ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        {/* Header */}
        <DialogHeader
          className={cn(
            "space-y-3 border-b bg-gradient-to-br p-6",
            tokens.gradient,
            tokens.border
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                tokens.bg,
                tokens.border
              )}
            >
              <Icon className={cn("h-6 w-6", tokens.text)} />
            </div>
            <div className="flex-1 text-left">
              <DialogTitle className="text-lg font-semibold">
                {department.name} — ao vivo
              </DialogTitle>
              <DialogDescription className="text-xs">
                Simulação de um dia real de trabalho do departamento.
              </DialogDescription>
            </div>
          </div>

          {/* Outcome counter */}
          <div
            className={cn(
              "flex items-center justify-between rounded-lg border p-3",
              tokens.border,
              tokens.bg
            )}
          >
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                {department.outcomeMetric.label}
              </div>
              <div className={cn("mt-0.5 text-2xl font-bold tabular-nums", tokens.text)}>
                <AnimatedCounter
                  value={currentMetric}
                  suffix={department.outcomeMetric.suffix ?? ""}
                  duration={0.8}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePauseToggle}
                disabled={isComplete}
                aria-label={paused ? "Retomar simulação" : "Pausar simulação"}
              >
                {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReplay}
                aria-label="Reiniciar simulação"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Timeline */}
        <ScrollArea className="h-[380px]">
          <div ref={scrollRef} className="relative space-y-3 p-6">
            {/* Trilho vertical */}
            <div
              aria-hidden
              className={cn("absolute bottom-6 left-9 top-6 w-px", tokens.border, "border-l")}
            />

            <AnimatePresence initial={false}>
              {visibleEvents.map((evt, idx) => {
                const isLatest = idx === currentIndex && !isComplete;
                return (
                  <motion.div
                    key={idx}
                    data-event-idx={idx}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35 }}
                    className="relative flex gap-4"
                  >
                    <div className="relative flex flex-col items-center pt-1">
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full border-2 bg-background",
                          tokens.border
                        )}
                      >
                        {isLatest ? (
                          <Loader2 className={cn("h-3.5 w-3.5 animate-spin", tokens.text)} />
                        ) : (
                          <CheckCircle2 className={cn("h-3.5 w-3.5", tokens.text)} />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{evt.time}</span>
                        <span>·</span>
                        <span className={cn("font-semibold", tokens.text)}>
                          {evt.agentName}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-foreground">
                        {evt.action}
                      </div>
                      <div
                        className={cn(
                          "mt-1.5 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium",
                          tokens.border,
                          tokens.bg,
                          tokens.text
                        )}
                      >
                        <ArrowRight className="h-3 w-3" />
                        {evt.outcome}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {currentIndex < 0 && (
              <div className="flex items-center gap-2 pl-11 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Iniciando o dia do departamento…
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer / CTA */}
        <div className="flex flex-col gap-3 border-t bg-background/60 p-6 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className={cn("mt-0.5 h-4 w-4 shrink-0", tokens.text)} />
            <span>Outcome mensurável, monitorado semana a semana.</span>
          </div>
          <Button
            size="lg"
            className="gap-2"
            onClick={() => onHire(department)}
            disabled={!isComplete && currentIndex < events.length - 2}
            aria-label={`Contratar ${department.name}`}
          >
            Contratar {department.name}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepartmentLiveDemo;
