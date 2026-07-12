import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PremiumCTAButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  showArrow?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  size?: "sm" | "md" | "lg";
  /** "solid" (branco, Apple) | "outline" (borda, Tesla) | "red" (destructive) */
  variant?: "solid" | "outline" | "red";
}

/**
 * PremiumCTAButton — Apple/Tesla/Notion clean.
 * Sem glow, sem gradient, sem sweep. Pura hierarquia tipográfica.
 * solid: fundo branco puro + texto preto (CTA primário).
 * outline: hairline branca + texto branco (CTA secundário premium).
 */
export const PremiumCTAButton = forwardRef<HTMLButtonElement, PremiumCTAButtonProps>(
  (
    {
      children,
      icon,
      showArrow = true,
      loading = false,
      loadingLabel = "Processing…",
      size = "lg",
      variant = "solid",
      className,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const heightCls = size === "lg" ? "h-12" : size === "sm" ? "h-9" : "h-11";
    const paddingCls = size === "sm" ? "px-4" : size === "lg" ? "px-7" : "px-6";
    const textCls = size === "sm" ? "text-[13px]" : "text-[14px]";

    const variantCls =
      variant === "solid"
        ? "bg-white text-black hover:bg-white/90"
        : "bg-transparent text-white border border-white/25 hover:border-white/60 hover:bg-white/[0.04]";

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "group relative rounded-full inline-flex items-center justify-center gap-2 whitespace-nowrap",
          "font-medium tracking-tight",
          "transition-colors duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          "disabled:opacity-40 disabled:pointer-events-none",
          heightCls,
          paddingCls,
          textCls,
          variantCls,
          className,
        )}
        {...rest}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            <span>{loadingLabel}</span>
          </>
        ) : (
          <>
            {icon && (
              <span className="inline-flex items-center justify-center [&_svg]:h-3.5 [&_svg]:w-3.5">
                {icon}
              </span>
            )}
            <span>{children}</span>
            {showArrow && (
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                strokeWidth={2.25}
              />
            )}
          </>
        )}
      </button>
    );
  },
);

PremiumCTAButton.displayName = "PremiumCTAButton";
