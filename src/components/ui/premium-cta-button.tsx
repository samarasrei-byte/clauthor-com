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
}

/**
 * PremiumCTAButton — Black glass + red neon.
 * Vidro obsidiano com hairline cromada, halo vermelho ambient,
 * texto neon vermelho e sweep de luz no hover. Estilo Apple/Vision Pro.
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
    const heightCls = size === "lg" ? "h-14" : size === "sm" ? "h-9" : "h-12";
    const paddingCls = size === "sm" ? "px-4" : "px-7";
    const textCls = size === "sm" ? "text-[13px]" : "text-[15px]";

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "group relative rounded-2xl overflow-visible cursor-pointer isolate",
          "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "hover:-translate-y-[2px] active:translate-y-0 active:scale-[0.985]",
          "disabled:opacity-60 disabled:pointer-events-none disabled:hover:translate-y-0",
          heightCls,
          paddingCls,
          className,
        )}
        {...rest}
      >
        {/* Ambient red halo (fora do botão, dá o "flutuando com neon") */}
        <div
          aria-hidden
          className="absolute -inset-[6px] rounded-[20px] bg-[radial-gradient(120%_120%_at_50%_50%,hsl(var(--primary)/0.65),transparent_70%)] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -z-10"
        />

        {/* Base — obsidian glass */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(20,10,12,0.92)_0%,rgba(6,4,6,0.98)_50%,rgba(28,12,14,0.94)_100%)] backdrop-blur-xl"
        />

        {/* Inner red glow — vermelho vazando por baixo do vidro */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-2xl bg-[radial-gradient(80%_120%_at_50%_120%,hsl(var(--primary)/0.55),transparent_60%)] opacity-80 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        />

        {/* Top inner shine (glass reflection) */}
        <div
          aria-hidden
          className="absolute inset-x-3 top-0 h-[45%] rounded-t-2xl bg-gradient-to-b from-white/[0.18] via-white/[0.04] to-transparent pointer-events-none"
        />

        {/* Chromatic hairline — vermelha sutil */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-2xl border border-white/[0.08] [box-shadow:inset_0_1px_0_0_rgba(255,255,255,0.15),inset_0_-1px_0_0_hsl(var(--primary)/0.35),inset_0_0_0_1px_hsl(var(--primary)/0.15)] pointer-events-none"
        />

        {/* Liquid sweep (hover) */}
        <div aria-hidden className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-1/2 h-full w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg] translate-x-0 group-hover:translate-x-[350%] transition-transform duration-[1100ms] ease-out" />
        </div>

        {/* Content — texto neon vermelho */}
        <span className="relative z-10 flex items-center justify-center gap-3">
          {loading ? (
            <>
              <Loader2
                className="h-[18px] w-[18px] animate-spin text-[hsl(var(--primary))]"
                strokeWidth={2.25}
                style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.9))" }}
              />
              <span
                className="font-display font-semibold text-[15px] tracking-tight text-[hsl(var(--primary))]"
                style={{
                  textShadow:
                    "0 0 8px hsl(var(--primary) / 0.9), 0 0 20px hsl(var(--primary) / 0.6), 0 0 40px hsl(var(--primary) / 0.35)",
                }}
              >
                {loadingLabel}
              </span>
            </>
          ) : (
            <>
              {icon && (
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm ring-1 ring-[hsl(var(--primary)/0.5)] transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-110"
                  style={{
                    boxShadow:
                      "0 0 12px hsl(var(--primary) / 0.6), inset 0 0 8px hsl(var(--primary) / 0.3)",
                  }}
                >
                  <span
                    className="text-[hsl(var(--primary))]"
                    style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.9))" }}
                  >
                    {icon}
                  </span>
                </span>
              )}
              <span
                className="font-display font-semibold text-[15px] tracking-[0.01em] whitespace-nowrap text-[hsl(var(--primary))]"
                style={{
                  textShadow:
                    "0 0 6px hsl(var(--primary) / 0.9), 0 0 16px hsl(var(--primary) / 0.65), 0 0 36px hsl(var(--primary) / 0.4)",
                }}
              >
                {children}
              </span>
              {showArrow && (
                <ArrowRight
                  className="h-[16px] w-[16px] text-[hsl(var(--primary))] transition-all duration-500 ease-out group-hover:translate-x-1.5 group-hover:scale-110"
                  strokeWidth={2.5}
                  style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.9))" }}
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
