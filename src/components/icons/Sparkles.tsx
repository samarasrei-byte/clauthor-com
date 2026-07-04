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
      strokeWidth = 1.5,
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
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* main 4-point star */}
      <path d="M14 4 L15.6 10.4 L22 12 L15.6 13.6 L14 20 L12.4 13.6 L6 12 L12.4 10.4 Z" />
      {/* small accent dot / spark */}
      <path d="M5.5 5 L6 7 L8 7.5 L6 8 L5.5 10 L5 8 L3 7.5 L5 7 Z" />
    </svg>
  ),
);

Sparkles.displayName = "Sparkles";

export default Sparkles;
