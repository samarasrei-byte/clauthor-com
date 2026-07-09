import { useMemo } from "react";

/**
 * NeuralBackdrop — the same aurora + neural mesh used in the
 * onboarding experience, reusable as a section background.
 */
interface Props {
  intensity?: number;
  className?: string;
}

const NeuralBackdrop = ({ intensity = 0.6, className = "" }: Props) => {
  const nodes = useMemo(
    () =>
      Array.from({ length: 42 }).map((_, i) => ({
        id: i,
        x: (i * 71) % 100,
        y: (i * 43) % 100,
      })),
    []
  );

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden>
      <div className="absolute inset-0 bg-[#04040a]" />
      <div
        className="absolute -top-1/3 -left-1/4 w-[75vw] h-[75vw] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, #e11d48 0%, transparent 60%)", opacity: 0.18 + intensity * 0.12 }}
      />
      <div
        className="absolute -bottom-1/3 -right-1/4 w-[75vw] h-[75vw] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, #a78bfa 0%, transparent 60%)", opacity: 0.16 + intensity * 0.12 }}
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[55vw] h-[55vw] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, #22d3ee 0%, transparent 60%)", opacity: 0.10 + intensity * 0.10 }}
      />

      <svg className="absolute inset-0 w-full h-full opacity-[0.28]" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="neural-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e11d48" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {nodes.map((a, i) =>
          nodes.slice(i + 1, i + 4).map((b) => {
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 22) return null;
            return (
              <line
                key={`${a.id}-${b.id}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="url(#neural-line)"
                strokeWidth={0.08}
                opacity={0.35 + intensity * 0.35}
              />
            );
          })
        )}
        {nodes.map((n) => (
          <circle key={n.id} cx={n.x} cy={n.y} r={0.22} fill="#fff" opacity={0.5} />
        ))}
      </svg>

      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70" />
    </div>
  );
};

export default NeuralBackdrop;
