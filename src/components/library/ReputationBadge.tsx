import { motion } from "framer-motion";
import { Star, TrendingUp, Users, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ReputationBadgeProps {
  rating: number;
  companies: number;
  savings: string;
  compact?: boolean;
}

const getReputationTier = (rating: number): { label: string; color: string; glow: string } => {
  if (rating >= 4.9) return { label: "Elite", color: "text-amber-400", glow: "shadow-amber-400/20" };
  if (rating >= 4.7) return { label: "Top Rated", color: "text-emerald-400", glow: "shadow-emerald-400/20" };
  if (rating >= 4.5) return { label: "Trusted", color: "text-cyan-400", glow: "shadow-cyan-400/20" };
  return { label: "Rising", color: "text-muted-foreground", glow: "" };
};

const ReputationBadge = ({ rating, companies, savings, compact = false }: ReputationBadgeProps) => {
  const tier = getReputationTier(rating);

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            <Star className={`h-3 w-3 ${tier.color} fill-current`} />
            <span className={`text-xs font-semibold ${tier.color}`}>{rating}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="glass p-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Star className={`h-4 w-4 ${tier.color} fill-current`} />
              <span className="font-semibold text-sm">{tier.label} - {rating}/5.0</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{companies}+ empresas ativas</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              <span>Economia média: {savings}/mês</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/5 ${tier.glow} shadow-lg`}
    >
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={`h-3 w-3 ${i <= Math.floor(rating) ? `${tier.color} fill-current` : "text-white/10"}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs">
        <Badge variant="outline" className={`${tier.color} border-current/20 text-[9px]`}>
          {tier.label}
        </Badge>
        <span className="text-muted-foreground flex items-center gap-1">
          <Users className="h-3 w-3" />
          {companies}+
        </span>
        <span className="text-emerald-400 flex items-center gap-1">
          <Zap className="h-3 w-3" />
          {savings}
        </span>
      </div>
    </motion.div>
  );
};

export default ReputationBadge;
