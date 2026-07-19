import { Children, type ComponentProps, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface StaggerGridProps extends ComponentProps<"div"> {
  children: ReactNode;
  /** delay between children in seconds */
  delay?: number;
  /** initial y offset in px */
  offset?: number;
}

/**
 * StaggerGrid · entrada em cascata para grids/listas do painel.
 * Cada filho direto fade+lift em sequência. Respeita prefers-reduced-motion.
 */
export function StaggerGrid({
  children,
  delay = 0.06,
  offset = 12,
  className,
  ...rest
}: StaggerGridProps) {
  const reduce = useReducedMotion();
  const items = Children.toArray(children);

  if (reduce) {
    return (
      <div className={cn(className)} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: delay, delayChildren: 0.04 } },
      }}
      {...(rest as any)}
    >
      {items.map((child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: offset },
            show: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default StaggerGrid;
