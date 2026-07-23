import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref?: string;
  onCta?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
  className?: string;
}

/**
 * Empty state canônico com CTA gigante e ilustração de ícone gradient.
 * Uso: <EmptyStateCTA icon={Users} title="Sem clientes ainda" ... />
 */
const EmptyStateCTA = ({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCta,
  secondaryLabel,
  secondaryHref,
  className,
}: Props) => {
  const navigate = useNavigate();

  const handleCta = () => {
    if (onCta) return onCta();
    if (ctaHref) navigate(ctaHref);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "rounded-3xl border border-border/20 bg-gradient-to-br from-card/60 via-card/30 to-transparent",
        "px-6 py-12 sm:py-16 max-w-2xl mx-auto",
        className,
      )}
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl shadow-primary/30">
          <Icon className="h-9 w-9 text-primary-foreground" strokeWidth={1.75} />
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 tracking-tight">
        {title}
      </h2>
      <p className="text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
        {description}
      </p>

      <button
        onClick={handleCta}
        className={cn(
          "group inline-flex items-center gap-2 rounded-2xl",
          "bg-primary text-primary-foreground",
          "px-8 py-4 min-h-[52px] text-base font-semibold",
          "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40",
          "hover:-translate-y-0.5 transition-all",
        )}
      >
        👉 {ctaLabel}
        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
      </button>

      {secondaryLabel && (
        <button
          onClick={() => secondaryHref && navigate(secondaryHref)}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground min-h-11 px-4"
        >
          {secondaryLabel}
        </button>
      )}
    </motion.div>
  );
};

export default EmptyStateCTA;
