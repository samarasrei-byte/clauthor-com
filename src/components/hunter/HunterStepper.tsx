import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: 1, label: "LinkedIn", path: "/hunter-linkedin" },
  { n: 2, label: "ICP", path: "/hunter-icp" },
  { n: 3, label: "Mensagem", path: "/hunter-mensagem" },
  { n: 4, label: "Ativar", path: "/hunter-ativar" },
  { n: 5, label: "Inbox", path: "/hunter-inbox" },
];

const HunterStepper = ({ current }: { current: number }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {STEPS.map((s, i) => {
        const isDone = current > s.n;
        const isActive = current === s.n;
        return (
          <div key={s.n} className="flex items-center gap-2 flex-shrink-0">
            <Link
              to={s.path}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
                isActive && "border-primary bg-primary/10 text-foreground font-semibold",
                isDone && "border-green-500/40 bg-green-500/5 text-green-400",
                !isActive && !isDone && "border-border/60 text-muted-foreground hover:border-border",
              )}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold", isActive ? "bg-primary text-primary-foreground" : "bg-muted")}>{s.n}</span>
              )}
              <span className="hidden sm:inline">{s.label}</span>
            </Link>
            {i < STEPS.length - 1 && <span className="text-muted-foreground">›</span>}
          </div>
        );
      })}
    </div>
  );
};

export default HunterStepper;
