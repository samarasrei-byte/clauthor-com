/**
 * DepartmentCard — hero card de "Departamento Pronto".
 *
 * Exibe uma solução amarrada a uma dor + outcome mensurável + agentes envolvidos.
 * Dois CTAs: "Ver funcionando (60s)" (abre o LiveDemo, Bloco 3) e
 * "Contratar departamento" (dispara o fluxo de contratação existente).
 *
 * Este componente é puramente apresentacional — não faz fetch, não conhece
 * a lógica de contratação. Consumidores passam `onSeeLiveDemo` e `onHire`.
 */
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { DepartmentPackage } from "@/data/departmentPackages";
import { DEPT_COLOR_TOKENS, formatBRL } from "@/data/departmentPackages";
import AgentAvatarStrip from "./AgentAvatarStrip";

interface DepartmentCardProps {
  department: DepartmentPackage;
  onSeeLiveDemo: (department: DepartmentPackage) => void;
  onHire: (department: DepartmentPackage) => void;
  /** Compacto para grades densas (secondary departments). */
  variant?: "flagship" | "compact";
  className?: string;
}

const DepartmentCard = ({
  department,
  onSeeLiveDemo,
  onHire,
  variant = "flagship",
  className,
}: DepartmentCardProps) => {
  const tokens = DEPT_COLOR_TOKENS[department.color];
  const Icon = department.icon;
  const isCompact = variant === "compact";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className={cn("h-full", className)}
    >
      <Card
        className={cn(
          "group relative flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-500",
          // Glass base — unified across all departments
          "border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl",
          "shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_20px_40px_-20px_rgba(0,0,0,0.6)]",
          "hover:border-white/[0.14] hover:bg-white/[0.035] hover:-translate-y-0.5",
        )}
      >
        {/* Subtle top highlight — mimics glass reflection */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
        {/* Soft ambient glow on hover — monochrome */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-white/[0.04] opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
        />

        <CardHeader className={cn("relative z-10 space-y-3", isCompact && "pb-3")}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
              <Icon className="h-5 w-5 text-white/80" strokeWidth={1.5} />
            </div>

            {department.flagship && (
              <Badge
                variant="outline"
                className="gap-1 font-medium border-white/[0.1] bg-white/[0.03] text-white/60 rounded-full"
              >
                <Sparkles className="h-3 w-3" />
                Flagship
              </Badge>
            )}
          </div>

          <div className="space-y-1.5">
            <h3 className={cn("font-semibold leading-tight tracking-tight text-white", isCompact ? "text-lg" : "text-xl")}>
              {department.name}
            </h3>
            <p className="text-[13px] text-white/45 leading-relaxed">
              {department.painPoint}
            </p>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 flex flex-1 flex-col gap-4">
          {/* Outcome — glass panel */}
          {department.outcome && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-white/40 uppercase tracking-wider">
                <ArrowRight className="h-3 w-3" />
                Outcome garantido
              </div>
              <div className={cn("mt-1.5 font-semibold text-white/95", isCompact ? "text-[14px]" : "text-[15px]")}>
                {department.outcome}
              </div>
            </div>
          )}

          <AgentAvatarStrip
            agentSlugs={department.agentSlugs}
            color={department.color}
            maxVisible={isCompact ? 4 : 5}
          />
        </CardContent>

        <CardFooter className="relative z-10 flex flex-col items-stretch gap-3 border-t border-white/[0.06] bg-white/[0.015] pt-4">
          <div className="flex items-baseline justify-between">
            <div>
              <div className={cn("font-bold tracking-tight text-white", isCompact ? "text-xl" : "text-2xl")}>
                {formatBRL(department.priceMonthly)}
              </div>
              <div className="text-[11px] text-white/40">
                {department.outcome ? "por mês, com outcome incluso" : "por mês"}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size={isCompact ? "sm" : "default"}
              className="flex-1 gap-2 border-white/[0.08] bg-white/[0.02] text-white/80 hover:bg-white/[0.05] hover:text-white hover:border-white/[0.14]"
              onClick={() => onSeeLiveDemo(department)}
              aria-label={`Ver ${department.name} funcionando por 60 segundos`}
            >
              <PlayCircle className="h-4 w-4" />
              Ver funcionando (60s)
            </Button>
            <Button
              size={isCompact ? "sm" : "default"}
              className="flex-1 gap-2 bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 border-0"
              onClick={() => onHire(department)}
              aria-label={`Contratar ${department.name}`}
            >
              Contratar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};


export default DepartmentCard;
