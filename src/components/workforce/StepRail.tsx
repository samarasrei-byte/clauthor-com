import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: number;
  label: string;
  hint: string;
}

interface Props {
  steps: Step[];
  current: number;
  reachable: number; // max step user can jump to
  onGo: (n: number) => void;
}

const StepRail = ({ steps, current, reachable, onGo }: Props) => {
  return (
    <ol className="space-y-1">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const canJump = i <= reachable;
        return (
          <li key={s.id}>
            <button
              disabled={!canJump}
              onClick={() => onGo(i)}
              className={cn(
                "group relative w-full text-left rounded-lg px-3 py-2.5 transition-all border",
                active
                  ? "border-primary/30 bg-primary/5 shadow-[0_0_24px_hsl(var(--primary)/0.08)]"
                  : done
                  ? "border-border/30 bg-card/30 hover:bg-card/50"
                  : "border-transparent opacity-50",
                canJump && "cursor-pointer"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-7 w-7 rounded-md grid place-items-center text-[11px] font-mono shrink-0 border",
                    done
                      ? "bg-primary text-primary-foreground border-primary"
                      : active
                      ? "border-primary/50 text-primary"
                      : "border-border/40 text-muted-foreground"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : String(s.id).padStart(2, "0")}
                </div>
                <div className="min-w-0">
                  <p className={cn("text-sm font-medium leading-tight", active ? "text-foreground" : "text-foreground/80")}>
                    {s.label}
                  </p>
                  <p className="text-[10.5px] text-muted-foreground/70 leading-tight mt-0.5">{s.hint}</p>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
};

export default StepRail;
