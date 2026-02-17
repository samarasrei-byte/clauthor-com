import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[13px] font-medium tracking-wider uppercase ring-offset-background transition-all duration-400 ease-[cubic-bezier(0.25,0.1,0.25,1)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary/90 text-primary-foreground hover:bg-primary hover:shadow-[0_0_24px_hsl(var(--primary)/0.15)] active:scale-[0.97]",
        destructive: "bg-destructive/90 text-destructive-foreground hover:bg-destructive active:scale-[0.97]",
        outline: "border border-white/[0.08] bg-transparent hover:border-white/[0.15] hover:bg-white/[0.03] active:scale-[0.97]",
        secondary: "bg-white/[0.04] text-secondary-foreground hover:bg-white/[0.07] active:scale-[0.97]",
        ghost: "hover:bg-white/[0.04] hover:text-foreground active:scale-[0.97]",
        link: "text-primary/80 underline-offset-4 hover:text-primary hover:underline tracking-normal normal-case text-sm",
      },
      size: {
        default: "h-9 px-5 py-2",
        sm: "h-8 px-3.5 text-[11px]",
        lg: "h-10 px-7",
        icon: "h-9 w-9",
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
