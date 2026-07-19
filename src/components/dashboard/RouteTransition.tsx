import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation, Outlet } from "react-router-dom";
import { type ReactNode } from "react";

/**
 * Wave 5 · Route transitions
 * -----------------------------------------------------------------------------
 * Wraps `<Outlet />` in an AnimatePresence keyed by pathname so navigations
 * between dashboard routes fade+lift instead of hard-cutting. Respects
 * `prefers-reduced-motion`.
 */
type Props = { children?: ReactNode };

export default function RouteTransition({ children }: Props) {
  const location = useLocation();
  const reduce = useReducedMotion();

  const variants = reduce
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
      };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="h-full"
      >
        {children ?? <Outlet />}
      </motion.div>
    </AnimatePresence>
  );
}
