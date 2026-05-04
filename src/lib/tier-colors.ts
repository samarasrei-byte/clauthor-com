/**
 * Shared tier color mappings - single source of truth.
 * Use semantic tokens where possible.
 */
export const TIER_COLORS: Record<string, string> = {
  basic: "bg-muted text-muted-foreground",
  intermediate: "bg-cyan-500/15 text-cyan-400",
  advanced: "bg-violet-500/15 text-violet-400",
  enterprise: "bg-primary/15 text-primary",
};

/** Gradient variant for visual elements (cards, badges with gradients) */
export const TIER_GRADIENT_COLORS: Record<string, string> = {
  basic: "from-muted to-muted",
  intermediate: "from-cyan-500 to-cyan-600",
  advanced: "from-violet-500 to-violet-600",
  enterprise: "from-primary to-primary/60",
};
