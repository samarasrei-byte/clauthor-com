import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[13px] font-semibold tracking-wide ring-offset-background transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 rounded-lg",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground backdrop-blur-sm border border-primary/30 shadow-[0_1px_3px_hsl(0_0%_0%/0.3),0_0_12px_hsl(var(--primary)/0.1)] hover:shadow-[0_2px_8px_hsl(0_0%_0%/0.3),0_0_20px_hsl(var(--primary)/0.15)] hover:-translate-y-px active:translate-y-0 active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground border border-destructive/30 backdrop-blur-sm shadow-[0_1px_3px_hsl(0_0%_0%/0.3)] hover:shadow-[0_2px_8px_hsl(0_0%_0%/0.3)] hover:-translate-y-px active:translate-y-0 active:scale-[0.98]",
        outline: "border border-border/60 bg-card/30 backdrop-blur-sm text-foreground/90 hover:border-primary/20 hover:bg-card/50 hover:text-foreground hover:shadow-[0_0_16px_hsl(var(--primary)/0.06)] hover:-translate-y-px active:translate-y-0 active:scale-[0.98]",
        secondary: "bg-secondary/80 text-secondary-foreground backdrop-blur-sm border border-border/40 hover:bg-secondary hover:border-border/60 hover:-translate-y-px active:translate-y-0 active:scale-[0.98]",
        ghost: "hover:bg-muted/60 hover:text-foreground active:scale-[0.98]",
        link: "text-primary/80 underline-offset-4 hover:text-primary hover:underline tracking-normal normal-case text-sm font-medium",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 px-4 text-[11px]",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
