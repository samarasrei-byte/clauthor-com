import { forwardRef, type SVGProps } from "react";

/**
 * Minimalist mark used site-wide where a "sparkle/AI" hint is needed.
 * Redesigned: no star. A hairline diamond with a small orbit dot.
 * Feels Apple/Linear — quiet, geometric, modern.
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
      absoluteStrokeWidth: _absoluteStrokeWidth,
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
      {/* Hairline diamond (rotated square) — geometric, no star */}
      <path d="M13 4 L20 12 L13 20 L6 12 Z" />
      {/* Small orbit dot — subtle accent */}
      <circle cx="19.5" cy="4.5" r="1" fill={color} stroke="none" />
    </svg>
  ),
);

Sparkles.displayName = "Sparkles";

export default Sparkles;
