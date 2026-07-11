import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PremiumCTAButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Main label */
  children: ReactNode;
  /** Optional icon (rendered inside the white glass capsule on the left) */
  icon?: ReactNode;
  /** Show trailing arrow (default true) */
  showArrow?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Label shown while loading */
  loadingLabel?: string;
  /** Size preset */
  size?: "md" | "lg";
}

/**
 * PremiumCTAButton — Apple-futurista.
 * Layered obsidian glass, chromatic hairline, ambient halo, and liquid shine sweep.
 * Uses semantic tokens only (--primary). Dark-mode safe.
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
      className,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const heightCls = size === "lg" ? "h-14" : "h-12";

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "group relative rounded-2xl overflow-hidden cursor-pointer",
          "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "hover:-translate-y-[2px] active:translate-y-0 active:scale-[0.985]",
          "disabled:opacity-60 disabled:pointer-events-none disabled:hover:translate-y-0",
          heightCls,
          "px-6",
          className,
        )}
        {...rest}
      >
        {/* Layer 1 — obsidian glass base */}
        <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,hsl(var(--primary)/0.95)_0%,hsl(var(--primary)/0.75)_50%,hsl(var(--primary)/0.9)_100%)]" />
        {/* Layer 2 — top inner shine */}
        <div className="absolute inset-x-3 top-0 h-[45%] rounded-t-2xl bg-gradient-to-b from-white/25 via-white/[0.06] to-transparent pointer-events-none" />
        {/* Layer 3 — bottom inner glow */}
        <div className="absolute inset-x-2 bottom-0 h-[35%] rounded-b-2xl bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
        {/* Layer 4 — chromatic hairline */}
        <div className="absolute inset-0 rounded-2xl border border-white/25 [box-shadow:inset_0_1px_0_0_rgba(255,255,255,0.35),inset_0_-1px_0_0_rgba(0,0,0,0.25)] pointer-events-none" />
        {/* Layer 5 — ambient halo */}
        <div className="absolute -inset-[3px] rounded-[18px] bg-[radial-gradient(120%_120%_at_50%_0%,hsl(var(--primary)/0.55),transparent_70%)] blur-xl opacity-40 group-hover:opacity-90 transition-opacity duration-700 pointer-events-none -z-10" />
        {/* Layer 6 — liquid sweep */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-1/2 h-full w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] translate-x-0 group-hover:translate-x-[350%] transition-transform duration-[1100ms] ease-out" />
        </div>

        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-3 text-primary-foreground">
          {loading ? (
            <>
              <Loader2 className="h-[18px] w-[18px] animate-spin" strokeWidth={2.25} />
              <span className="font-display font-semibold text-[15px] tracking-tight">
                {loadingLabel}
              </span>
            </>
          ) : (
            <>
              {icon && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/30 shadow-[0_0_12px_rgba(255,255,255,0.35)] transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-110">
                  {icon}
                </span>
              )}
              <span className="font-display font-semibold text-[15px] tracking-[-0.01em] text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.25)] whitespace-nowrap">
                {children}
              </span>
              {showArrow && (
                <ArrowRight
                  className="h-[16px] w-[16px] text-white transition-all duration-500 ease-out group-hover:translate-x-1.5 group-hover:scale-110"
                  strokeWidth={2.25}
                />
              )}
            </>
          )}
        </span>
      </button>
    );
  },
);

PremiumCTAButton.displayName = "PremiumCTAButton";
