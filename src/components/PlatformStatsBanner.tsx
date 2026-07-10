import { motion } from "framer-motion";
import { Bot, Users, Building2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PlatformStatsBannerProps {
  className?: string;
  variant?: "default" | "compact" | "minimal";
}

const STATS = [
  { value: "20", label: "Departamentos", icon: Building2 },
  { value: "Custom", label: "Squads", icon: Users },
  { value: "+200", label: "Especialistas IA", icon: Bot },
  { value: "99.9%", label: "Uptime", icon: Activity },
] as const;

/**
 * Banner unificado de métricas da plataforma Clauthor.
 * Use em landing pages, dashboards e painéis para reforçar escala da operação.
 */
const PlatformStatsBanner = ({ className, variant = "default" }: PlatformStatsBannerProps) => {
  const isCompact = variant === "compact";
  const isMinimal = variant === "minimal";

  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4",
        !isMinimal && "p-4 md:p-6 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm",
        className,
      )}
      role="group"
      aria-label="Estatísticas da plataforma Clauthor"
    >
      {STATS.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className={cn(
              "flex flex-col items-center text-center",
              !isCompact && !isMinimal && "py-2",
            )}
          >
            <Icon
              className={cn(
                "text-primary mb-2",
                isCompact ? "h-3.5 w-3.5" : "h-4 w-4",
              )}
              aria-hidden="true"
            />
            <div
              className={cn(
                "font-bold leading-none bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent",
                isCompact ? "text-2xl" : "text-3xl md:text-4xl",
              )}
            >
              {s.value}
            </div>
            <div
              className={cn(
                "font-mono uppercase tracking-[0.18em] text-muted-foreground mt-2",
                isCompact ? "text-[9px]" : "text-[10px] md:text-[11px]",
              )}
            >
              {s.label}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PlatformStatsBanner;
