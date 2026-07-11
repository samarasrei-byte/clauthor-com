import { cn } from "@/lib/utils";

interface PricePillProps {
  price: string;
  period?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * PricePill — Botão minimalista vermelho para exibir preço/mês.
 *
 * Design: monocromático, sem gradiente, foco em legibilidade e ancoragem
 * cromática (destructive = red brand). Substitui os antigos price displays
 * espalhados por Pricing.tsx / Departamentos.tsx / SquadPlans.tsx.
 */
const PricePill = ({ price, period = "/mês", size = "md", className }: PricePillProps) => {
  const sizeMap = {
    sm: { pad: "px-3 py-1.5", price: "text-base", period: "text-[10px]" },
    md: { pad: "px-4 py-2", price: "text-xl", period: "text-xs" },
    lg: { pad: "px-5 py-2.5", price: "text-3xl", period: "text-sm" },
  };
  const s = sizeMap[size];

  return (
    <div
      className={cn(
        "inline-flex items-baseline gap-1.5 rounded-full",
        "bg-destructive/10 border border-destructive/30",
        "text-destructive font-display font-bold",
        "transition-colors hover:bg-destructive/15",
        s.pad,
        className,
      )}
    >
      <span className={cn("tracking-tight", s.price)}>{price}</span>
      <span className={cn("font-medium opacity-70", s.period)}>{period}</span>
    </div>
  );
};

export default PricePill;
