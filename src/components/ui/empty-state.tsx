import { type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { type LucideIcon } from "lucide-react";

export interface EmptyStateProps extends ComponentProps<"div"> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  hint?: ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  illustration?: ReactNode;
  size?: "sm" | "md" | "lg";
}

/**
 * EmptyState · momento de ensino, não mensagem de erro.
 * Padrão Linear/Notion: ícone/ilustração + título + explicação + CTA + exemplo/dica.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  hint,
  action,
  secondaryAction,
  illustration,
  size = "md",
  className,
  ...rest
}: EmptyStateProps) {
  const sizes = {
    sm: "py-8 px-4 gap-2",
    md: "py-14 px-6 gap-3",
    lg: "py-20 px-8 gap-4",
  } as const;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "rounded-2xl border border-dashed border-border/60 bg-card/30",
        sizes[size],
        className,
      )}
      {...rest}
    >
      {illustration ?? (Icon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-2xl",
            "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
            "border border-primary/15 mb-2",
            size === "sm" ? "w-11 h-11" : size === "lg" ? "w-16 h-16" : "w-14 h-14",
          )}
        >
          <Icon
            className={cn(
              "text-primary",
              size === "sm" ? "w-5 h-5" : size === "lg" ? "w-8 h-8" : "w-6 h-6",
            )}
            strokeWidth={1.6}
          />
        </div>
      ))}

      <h3
        className={cn(
          "font-semibold text-foreground tracking-tight",
          size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg",
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            "text-muted-foreground max-w-md leading-relaxed",
            size === "sm" ? "text-xs" : "text-sm",
          )}
        >
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          {action && (
            <Button
              onClick={action.onClick}
              {...(action.href ? { asChild: true } : {})}
              size={size === "sm" ? "sm" : "default"}
            >
              {action.href ? (
                <a href={action.href}>
                  {action.icon && <action.icon className="w-4 h-4 mr-1.5" />}
                  {action.label}
                </a>
              ) : (
                <>
                  {action.icon && <action.icon className="w-4 h-4 mr-1.5" />}
                  {action.label}
                </>
              )}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              size={size === "sm" ? "sm" : "default"}
              onClick={secondaryAction.onClick}
              {...(secondaryAction.href ? { asChild: true } : {})}
            >
              {secondaryAction.href ? (
                <a href={secondaryAction.href}>{secondaryAction.label}</a>
              ) : (
                secondaryAction.label
              )}
            </Button>
          )}
        </div>
      )}

      {hint && (
        <div className="mt-4 max-w-md text-xs text-muted-foreground/80 bg-muted/30 border border-border/40 rounded-lg px-3 py-2 flex items-start gap-2">
          <span className="text-primary/70 shrink-0">💡</span>
          <span className="text-left leading-relaxed">{hint}</span>
        </div>
      )}
    </div>
  );
}
