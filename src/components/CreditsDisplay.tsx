import { motion } from "framer-motion";
import { Coins, TrendingUp } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function CreditsDisplay() {
  const { credits, remainingCredits, usagePercentage, isLoading } = useCredits();

  if (isLoading || !credits) {
    return (
      <div className="glass-card rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-24 mb-2" />
        <div className="h-6 bg-white/10 rounded w-16" />
      </div>
    );
  }

  const formatCredits = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  const planLabels: Record<string, string> = {
    free: "Free",
    starter: "Starter",
    pro: "Pro",
    enterprise: "Enterprise",
  };

  const planColors: Record<string, string> = {
    free: "bg-muted/80 text-muted-foreground",
    starter: "bg-blue-500/20 text-blue-400",
    pro: "bg-purple-500/20 text-purple-400",
    enterprise: "bg-primary/20 text-primary",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Créditos</p>
            <p className="font-display font-bold text-xl gradient-text">
              {formatCredits(remainingCredits)}
            </p>
          </div>
        </div>
        <Badge className={planColors[credits.plan_type] || planColors.free}>
          {planLabels[credits.plan_type] || "Free"}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Usado: {formatCredits(credits.used_credits)}</span>
          <span>Total: {formatCredits(credits.total_credits)}</span>
        </div>
        <Progress 
          value={usagePercentage} 
          className="h-2"
        />
        {usagePercentage > 80 && (
          <p className="text-xs text-amber-400 flex items-center gap-1 mt-2">
            <TrendingUp className="h-3 w-3" />
            Créditos baixos! Considere fazer upgrade.
          </p>
        )}
      </div>
    </motion.div>
  );
}
