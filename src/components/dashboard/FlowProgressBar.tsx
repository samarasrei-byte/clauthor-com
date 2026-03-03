import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "select", label: "Seleção" },
  { id: "account", label: "Conta" },
  { id: "payment", label: "Pagamento" },
  { id: "activation", label: "Ativação" },
] as const;

export type FlowStep = typeof STEPS[number]["id"];

interface FlowProgressBarProps {
  currentStep: FlowStep;
  className?: string;
}

const FlowProgressBar = ({ currentStep, className }: FlowProgressBarProps) => {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className={cn("flex items-center gap-0 w-full max-w-sm mx-auto", className)}>
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            {/* Step circle */}
            <div className="flex flex-col items-center gap-1">
              <motion.div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "border-primary text-primary bg-primary/10",
                  !isCompleted && !isCurrent && "border-border/30 text-muted-foreground/40"
                )}
                initial={false}
                animate={isCompleted ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </motion.div>
              <span className={cn(
                "text-[9px] font-medium whitespace-nowrap",
                isCurrent ? "text-primary" : isCompleted ? "text-foreground/60" : "text-muted-foreground/40"
              )}>
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-1.5 mt-[-14px]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: isCompleted ? "hsl(var(--primary))" : "hsl(var(--border) / 0.2)" }}
                  initial={false}
                  animate={{ scaleX: 1 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FlowProgressBar;
