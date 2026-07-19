import { cn } from "@/lib/utils";

/**
 * Skeleton · shimmer premium (Linear/Vercel-like).
 * Use `variant="pulse"` só para casos legacy — o default agora é shimmer.
 */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "shimmer" | "pulse";
}

function Skeleton({ className, variant = "shimmer", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        variant === "shimmer" ? "skeleton-shimmer" : "animate-pulse rounded-md bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
