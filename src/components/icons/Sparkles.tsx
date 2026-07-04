import { forwardRef, type SVGProps } from "react";

/**
 * Minimalist Sparkles icon.
 * Substitui `lucide-react`'s Sparkles em todo o site:
 * 4-point star fino + um dot menor, traço leve (currentColor).
 */
export interface SparklesProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
}

export const Sparkles = forwardRef<SVGSVGElement, SparklesProps>(
  (
    {
      size = 24,
      color = "currentColor",
      strokeWidth = 1.25,
      absoluteStrokeWidth,
      ...props
    },
    ref,
  ) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      stroke="none"
      aria-hidden="true"
      {...props}
    >
      {/* Apple-style: single hairline 4-point spark + tiny accent */}
      <path d="M13.5 3c.28 0 .52.19.6.46l1.05 3.9a3 3 0 0 0 2.1 2.1l3.9 1.05a.62.62 0 0 1 0 1.2l-3.9 1.05a3 3 0 0 0-2.1 2.1l-1.05 3.9a.62.62 0 0 1-1.2 0l-1.05-3.9a3 3 0 0 0-2.1-2.1l-3.9-1.05a.62.62 0 0 1 0-1.2l3.9-1.05a3 3 0 0 0 2.1-2.1l1.05-3.9A.62.62 0 0 1 13.5 3Z" />
      <circle cx="5" cy="5.5" r="0.9" />
    </svg>
  ),
);

Sparkles.displayName = "Sparkles";

export default Sparkles;
