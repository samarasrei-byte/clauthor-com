/**
 * KpiStrip · Grid compartilhado de métricas para os hubs do dashboard.
 *
 * Design token-first (bg-card / border-border / text-*) e mobile-first
 * (2 cols → 4 cols em md). Suporta:
 *   · valor numérico ou string
 *   · limite opcional (max) com Progress bar
 *   · sub-label opcional (contexto)
 *   · accent semântico (primary | emerald | amber | sky | violet | muted)
 *
 * Uso:
 *   <KpiStrip items={[
 *     { label: "Agentes ativos", value: 5, icon: Bot, accent: "primary" },
 *     { label: "Membros", value: 2, max: 10, icon: Users, accent: "emerald" },
 *   ]} />
 */
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type KpiAccent = "primary" | "emerald" | "amber" | "sky" | "violet" | "muted";

export interface KpiItem {
  label: string;
  value: string | number;
  /** Optional cap (renders `value / max` + progress). Use "∞" for unlimited. */
  max?: number | string | null;
  sub?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  accent?: KpiAccent;
}

interface KpiStripProps {
  items: KpiItem[];
  /** Column count on lg+ (default 4). Use 8 for dense strips (ex.: Approvals). */
  cols?: 4 | 8;
  className?: string;
}

const ACCENT_ICON: Record<KpiAccent, string> = {
  primary: "text-primary",
  emerald: "text-emerald-500",
  amber:   "text-amber-500",
  sky:     "text-sky-500",
  violet:  "text-violet-500",
  muted:   "text-muted-foreground",
};

const KpiStrip = ({ items, cols = 4, className }: KpiStripProps) => {
  const gridCols = cols === 8
    ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-8"
    : "grid-cols-2 lg:grid-cols-4";

  return (
    <div className={cn("grid gap-3", gridCols, className)}>
      {items.map((item, i) => {
        const Icon = item.icon;
        const accent = item.accent ?? "muted";
        const hasNumericMax = typeof item.max === "number" && typeof item.value === "number";
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
            className="glass-card rounded-xl p-4 border border-border/10 flex flex-col gap-1.5 relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-medium uppercase tracking-wide truncate">
                {item.label}
              </span>
              {Icon && <Icon className={cn("h-3.5 w-3.5 shrink-0", ACCENT_ICON[accent])} />}
            </div>
            <div className="flex items-end gap-1">
              <span className="font-display text-2xl font-bold tracking-tight text-foreground tabular-nums">
                {item.value}
              </span>
              {item.max != null && (
                <span className="text-xs text-muted-foreground mb-0.5">/ {item.max}</span>
              )}
            </div>
            {item.sub && (
              <span className="text-[10px] text-muted-foreground/80 truncate">{item.sub}</span>
            )}
            {hasNumericMax && (
              <Progress
                value={((item.value as number) / (item.max as number)) * 100}
                className="h-1 mt-1"
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default KpiStrip;
