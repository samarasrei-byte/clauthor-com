/**
 * AgentsWorkingScene — mini painel futurista Apple-like que mostra
 * agentes "trabalhando" ao vivo dentro do card do departamento.
 *
 * Puramente visual, sem side-effects. Loop cíclico de status.
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

const ACTIONS: readonly string[] = [
  "Escrevendo mensagem…",
  "Analisando dados…",
  "Executando fluxo…",
  "Consultando CRM…",
  "Gerando relatório…",
  "Sincronizando…",
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
        return { slug, name, initials: initialsOf(name), offset: i };
      }),
    [agentSlugs],
  );

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 2400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/[0.06] bg-black/40 backdrop-blur-md",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
        className,
      )}
      aria-hidden
    >
      {/* Faint grid + scanline */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(120% 80% at 50% 50%, black 30%, transparent 80%)",
        }}
      />
      <motion.div
        className="pointer-events-none absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-white/[0.04] to-transparent"
        initial={{ y: -40 }}
        animate={{ y: 200 }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
      />

      {/* Terminal header */}
      <div className="relative flex items-center justify-between px-3 py-2 border-b border-white/[0.05]">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center gap-1.5">
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.35, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
          <span className="text-[9.5px] font-medium tracking-[0.18em] text-white/40 uppercase">
            Live · Agents
          </span>
        </div>
      </div>

      {/* Agent rows */}
      <div className="relative p-3 space-y-2">
        {agents.map((agent, idx) => {
          const action = ACTIONS[(tick + idx) % ACTIONS.length];
          return (
            <div key={agent.slug} className="flex items-center gap-2.5">
              <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] text-[10px] font-semibold text-white/80">
                {agent.initials}
                <motion.span
                  className="absolute -bottom-0 -right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-black"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.9, 0.5, 0.9] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: idx * 0.3 }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-white/85 truncate">{agent.name}</div>
                <div className="flex items-center gap-1.5 h-3">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={action}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.35 }}
                      className="text-[10px] text-white/40 truncate"
                    >
                      {action}
                    </motion.span>
                  </AnimatePresence>
                  <span className="flex gap-0.5 shrink-0">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="h-0.5 w-0.5 rounded-full bg-white/50"
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1.1, repeat: Infinity, delay: d * 0.18 + idx * 0.15 }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentsWorkingScene;
