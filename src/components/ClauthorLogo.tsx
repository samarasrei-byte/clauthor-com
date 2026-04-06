import { cn } from "@/lib/utils";

interface ClauthorLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Premium clauthor wordmark logo.
 * Automatically adapts to light/dark mode via CSS currentColor.
 * The dot on the "o" is always primary (red).
 */
const ClauthorLogo = ({ className, size = "md" }: ClauthorLogoProps) => {
  const sizeClasses = {
    sm: "h-[18px]",
    md: "h-[22px]",
    lg: "h-[28px]",
  };

  return (
    <div className={cn("flex items-center gap-0", sizeClasses[size], className)}>
      <span
        className={cn(
          "font-semibold tracking-[-0.04em] text-foreground leading-none",
          size === "sm" && "text-[15px]",
          size === "md" && "text-[18px]",
          size === "lg" && "text-[24px]",
        )}
      >
        clauth
        <span className="relative">
          o
          <span className="absolute top-[0.05em] right-[0.18em] w-[0.18em] h-[0.18em] rounded-full bg-primary" />
        </span>
        r
      </span>
    </div>
  );
};

export default ClauthorLogo;
