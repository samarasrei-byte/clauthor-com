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
          "group relative flex h-full flex-col overflow-hidden border-2 transition-all duration-300",
          "bg-gradient-to-br",
          tokens.gradient,
          tokens.border,
          "hover:shadow-lg hover:-translate-y-0.5"
        )}
      >
        {/* Halo decorativo */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-60",
            tokens.bg
          )}
        />

        <CardHeader className={cn("relative z-10 space-y-3", isCompact && "pb-3")}>
          <div className="flex items-start justify-between gap-3">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border",
                tokens.bg,
                tokens.border
              )}
            >
              <Icon className={cn("h-6 w-6", tokens.text)} strokeWidth={2} />
            </div>

            {department.flagship && (
              <Badge
                variant="outline"
                className={cn(
                  "gap-1 font-medium",
                  tokens.text,
                  tokens.border,
                  tokens.bg
                )}
              >
                <Sparkles className="h-3 w-3" />
                Flagship
              </Badge>
            )}
          </div>

          <div className="space-y-1">
            <h3 className={cn("font-semibold leading-tight tracking-tight", isCompact ? "text-lg" : "text-xl")}>
              {department.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {department.painPoint}
            </p>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 flex flex-1 flex-col gap-4">
          {/* Outcome badge */}
          <div
            className={cn(
              "rounded-lg border p-3",
              tokens.border,
              tokens.bg
            )}
          >
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <ArrowRight className={cn("h-3.5 w-3.5", tokens.text)} />
              Outcome garantido
            </div>
            <div className={cn("mt-1 font-semibold", tokens.text, isCompact ? "text-base" : "text-lg")}>
              {department.outcome}
            </div>
            {department.outcomeGuarantee && (
              <div className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{department.outcomeGuarantee}</span>
              </div>
            )}
          </div>

          {/* Agentes */}
          <AgentAvatarStrip
            agentSlugs={department.agentSlugs}
            color={department.color}
            maxVisible={isCompact ? 4 : 5}
          />
        </CardContent>

        <CardFooter className="relative z-10 flex flex-col items-stretch gap-3 border-t bg-background/40 pt-4 backdrop-blur-sm">
          <div className="flex items-baseline justify-between">
            <div>
              <div className={cn("font-bold tracking-tight", isCompact ? "text-xl" : "text-2xl")}>
                {formatBRL(department.priceMonthly)}
              </div>
              <div className="text-xs text-muted-foreground">
                por mês, com outcome incluso
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size={isCompact ? "sm" : "default"}
              className="flex-1 gap-2"
              onClick={() => onSeeLiveDemo(department)}
              aria-label={`Ver ${department.name} funcionando por 60 segundos`}
            >
              <PlayCircle className="h-4 w-4" />
              Ver funcionando (60s)
            </Button>
            <Button
              size={isCompact ? "sm" : "default"}
              className={cn("flex-1 gap-2")}
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
