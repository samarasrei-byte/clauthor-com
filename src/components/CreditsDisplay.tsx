import { motion } from "framer-motion";
import { Coins, TrendingUp } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export function CreditsDisplay() {
  const { credits, remainingCredits, usagePercentage, isLoading } = useCredits();
  const { t } = useTranslation();

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
    starter: "bg-cyan-500/15 text-cyan-400",
    pro: "bg-primary/15 text-primary",
    enterprise: "bg-emerald-500/15 text-emerald-400",
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
            <p className="text-sm text-muted-foreground">{t("credits.title", { defaultValue: "Credits" })}</p>
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
          <span>{t("credits.used", { defaultValue: "Used" })}: {formatCredits(credits.used_credits)}</span>
          <span>{t("credits.total", { defaultValue: "Total" })}: {formatCredits(credits.total_credits)}</span>
        </div>
        <Progress 
          value={usagePercentage} 
          className="h-2"
        />
        {usagePercentage > 80 && (
          <p className="text-xs text-cyan-400 flex items-center gap-1 mt-2">
            <TrendingUp className="h-3 w-3" />
            {t("credits.low_warning", { defaultValue: "Credits running low! Consider upgrading." })}
          </p>
        )}
      </div>
    </motion.div>
  );
}
