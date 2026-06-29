import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface ParallaxBandProps {
  image: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
  height?: string;
}

/**
 * Cinematic full-bleed parallax band for the investor page.
 * Background image translates slower than the foreground content,
 * creating depth without heavy libraries.
 */
const ParallaxBand = ({
  image,
  eyebrow,
  title,
  subtitle,
  align = "center",
  height = "h-[70vh] min-h-[520px]",
}: ParallaxBandProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1.05, 1.15]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  const alignment =
    align === "left"
      ? "items-start text-left"
      : align === "right"
      ? "items-end text-right"
      : "items-center text-center";

  return (
    <section
      ref={ref}
      className={`relative ${height} w-full overflow-hidden border-y border-border/40`}
      aria-label={title}
    >
      {/* Parallax image layer */}
      <motion.div
        style={{ y, scale }}
        className="absolute inset-0 -z-10 will-change-transform"
      >
        <img
          src={image}
          alt=""
          aria-hidden="true"
          width={1920}
          height={1280}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </motion.div>

      {/* Gradient overlay for legibility */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/80 via-background/30 to-background/90" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background)/0.6)_100%)]" />

      {/* Foreground content */}
      <motion.div
        style={{ opacity }}
        className={`relative z-10 h-full flex flex-col justify-center ${alignment} max-w-5xl mx-auto px-6`}
      >
        {eyebrow && (
          <div className="font-mono text-[11px] uppercase tracking-[0.35em] text-primary mb-6">
            {eyebrow}
          </div>
        )}
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.05] text-foreground drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </motion.div>
    </section>
  );
};

export default ParallaxBand;
