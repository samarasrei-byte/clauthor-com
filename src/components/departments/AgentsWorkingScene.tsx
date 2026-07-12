/**
 * AgentsWorkingScene — cena futurista Apple-like com agentes
 * "conversando" ao vivo dentro do card do departamento.
 *
 * Layout de chat: bolhas alternadas esquerda/direita, cada agente com
 * ping vermelho pulsante. Um sheen de luz cruza a cena periodicamente.
 * Puramente visual, sem side-effects externos.
 */
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { WORKFORCE } from "@/data/workforceArchitecture";

const SLUG_TO_NAME: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const dept of WORKFORCE) {
    for (const squad of dept.squads) {
      for (const agent of squad.agents) {
        map[agent.slug] = agent.name;
      }
    }
  }
  return map;
})();

const humanize = (slug: string): string =>
  slug.split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");

const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

/** Falas curtas e alternadas simulando uma conversa entre agentes. */
const DIALOGUE: readonly string[] = [
  "Achei 47 leads no ICP.",
  "Qualifiquei 24, mando pro CRM.",
  "Ok, disparo cadência agora.",
  "Fechei 3 reuniões pra amanhã.",
  "Atualizei o pipeline.",
  "Consolidando o relatório…",
];

interface AgentsWorkingSceneProps {
  agentSlugs: readonly string[];
  className?: string;
}

const AgentsWorkingScene = ({ agentSlugs, className }: AgentsWorkingSceneProps) => {
  const agents = useMemo(
    () =>
      agentSlugs.slice(0, 3).map((slug, i) => {
        const name = SLUG_TO_NAME[slug] ?? humanize(slug);
        return { slug, name, initials: initialsOf(name), side: i % 2 === 0 ? "left" : "right" as "left" | "right" };
      }),
    [agentSlugs],
  );

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 2600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/[0.08]",
        // Fundo ligeiramente mais claro que antes
        "bg-gradient-to-b from-white/[0.045] via-white/[0.025] to-white/[0.015] backdrop-blur-md",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
        className,
      )}
      aria-hidden
    >
      {/* Grade sutil */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(120% 80% at 50% 50%, black 30%, transparent 80%)",
        }}
      />

      {/* Sheen de luz que percorre a cena */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
        initial={{ x: "-120%" }}
        animate={{ x: "320%" }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.4 }}
      />
      {/* Halo vermelho difuso no rodapé — ancora o brand */}
      <div
        className="pointer-events-none absolute -bottom-10 left-1/2 h-24 w-2/3 -translate-x-1/2 rounded-full blur-2xl opacity-40"
        style={{ background: "radial-gradient(closest-side, hsl(var(--destructive) / 0.35), transparent)" }}
      />

      {/* Header estilo status bar */}
      <div className="relative flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
        </div>
        <div className="flex items-center gap-1.5">
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--destructive))] shadow-[0_0_8px_hsl(var(--destructive)/0.8)]"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
          <span className="text-[9.5px] font-medium tracking-[0.2em] text-white/50 uppercase">
            Live · Squad
          </span>
        </div>
      </div>

      {/* Chat entre agentes */}
      <div className="relative p-3 space-y-2">
        {agents.map((agent, idx) => {
          const line = DIALOGUE[(tick + idx) % DIALOGUE.length];
          const isLeft = agent.side === "left";
          return (
            <div
              key={agent.slug}
              className={cn(
                "flex items-end gap-2",
                isLeft ? "justify-start" : "justify-end flex-row-reverse",
              )}
            >
              {/* Avatar */}
              <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.06] text-[10px] font-semibold text-white/85">
                {agent.initials}
                <motion.span
                  className="absolute -bottom-0 -right-0 h-2 w-2 rounded-full bg-[hsl(var(--destructive))] ring-2 ring-black/60"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.95, 0.55, 0.95] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: idx * 0.3 }}
                />
              </div>

              {/* Balão de fala */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${agent.slug}-${line}`}
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.35 }}
                  className={cn(
                    "relative max-w-[70%] rounded-2xl px-2.5 py-1.5 text-[10.5px] leading-tight",
                    "border backdrop-blur-sm",
                    isLeft
                      ? "border-white/[0.1] bg-white/[0.05] text-white/85 rounded-bl-sm"
                      : "border-[hsl(var(--destructive)/0.25)] bg-[hsl(var(--destructive)/0.12)] text-white rounded-br-sm",
                  )}
                >
                  <div className="text-[9px] font-medium text-white/45 mb-0.5 truncate">{agent.name}</div>
                  <div className="flex items-center gap-1.5">
                    <span className="truncate">{line}</span>
                    <span className="flex gap-0.5 shrink-0">
                      {[0, 1, 2].map((d) => (
                        <motion.span
                          key={d}
                          className={cn(
                            "h-0.5 w-0.5 rounded-full",
                            isLeft ? "bg-white/60" : "bg-[hsl(var(--destructive))]",
                          )}
                          animate={{ opacity: [0.2, 1, 0.2] }}
                          transition={{ duration: 1.1, repeat: Infinity, delay: d * 0.18 + idx * 0.15 }}
                        />
                      ))}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentsWorkingScene;
