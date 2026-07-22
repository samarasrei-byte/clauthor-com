/**
 * MissionChecklist · lista visual de missões (checked/current/pending).
 */
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MissionStepConfig } from "./types";

interface MissionChecklistProps {
  missions: MissionStepConfig[];
  completed: string[];
  currentIndex: number;
}

export function MissionChecklist({ missions, completed, currentIndex }: MissionChecklistProps) {
  return (
    <ol className="space-y-1" aria-label="Progresso do onboarding">
      {missions.map((m, i) => {
        const done = completed.includes(m.id);
        const current = i === currentIndex && !done;
        return (
          <li
            key={m.id}
            className={cn(
              "flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors",
              current && "bg-primary/10 border border-primary/20",
              !current && done && "opacity-70",
            )}
          >
            <div
              className={cn(
                "shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 transition-colors",
                done && "bg-emerald-500 text-white",
                current && "bg-primary/20 text-primary ring-2 ring-primary/40",
                !done && !current && "bg-muted text-muted-foreground",
              )}
            >
              {done ? (
                <Check className="w-3 h-3" strokeWidth={3} />
              ) : (
                <Circle className="w-2 h-2 fill-current" strokeWidth={0} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "text-sm font-medium leading-snug",
                  current ? "text-foreground" : "text-muted-foreground",
                  done && "line-through decoration-1",
                )}
              >
                {m.title}
              </div>
              {current && (
                <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {m.description}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default MissionChecklist;
