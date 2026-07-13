/**
 * AgentAvatarStrip · renderiza avatares empilhados de agentes de um departamento.
 *
 * Sem dependência de imagens: gera iniciais coloridas a partir do nome.
 * Usa lookup em WORKFORCE para descobrir o nome de cada slug; se o slug não
 * existir (não deveria acontecer, já validamos em Bloco 1), cai num fallback
 * legível.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { WORKFORCE } from "@/data/workforceArchitecture";
import type { DeptColorKey } from "@/data/departmentPackages";
import { DEPT_COLOR_TOKENS } from "@/data/departmentPackages";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AgentAvatarStripProps {
  agentSlugs: readonly string[];
  color: DeptColorKey;
  /** Máximo de avatares exibidos antes do "+N". Default 5. */
  maxVisible?: number;
  className?: string;
}

/** Índice slug → nome curto, construído uma vez a partir de WORKFORCE. */
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

/** Gera iniciais legíveis a partir de um nome ("Hunter LinkedIn" → "HL"). */
const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

/** Fallback humanizado caso o slug não esteja no WORKFORCE. */
const humanize = (slug: string): string =>
  slug
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");

const AgentAvatarStrip = ({
  agentSlugs,
  color,
  maxVisible = 5,
  className,
}: AgentAvatarStripProps) => {
  const tokens = DEPT_COLOR_TOKENS[color];

  const agents = useMemo(
    () =>
      agentSlugs.map((slug) => {
        const name = SLUG_TO_NAME[slug] ?? humanize(slug);
        return { slug, name, initials: initialsOf(name) };
      }),
    [agentSlugs]
  );

  const visible = agents.slice(0, maxVisible);
  const overflow = agents.length - visible.length;

  return (
    <TooltipProvider delayDuration={120} skipDelayDuration={0}>
      <div className={cn("flex items-center", className)}>
        <div className="flex -space-x-2">
          {visible.map((agent, idx) => (
            <Tooltip key={agent.slug}>
              <TooltipTrigger asChild>
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.6, x: -6 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  whileHover={{ scale: 1.12, y: -2, zIndex: 10 }}
                  transition={{ duration: 0.25, delay: idx * 0.05 }}
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-background text-[10px] font-semibold tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                    tokens.bg,
                    tokens.text,
                    tokens.border,
                  )}
                  aria-label={agent.name}
                >
                  {agent.initials}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top" className="px-2.5 py-1.5">
                <div className="text-[12px] font-medium leading-tight">{agent.name}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{agent.slug}</div>
              </TooltipContent>
            </Tooltip>
          ))}

          {overflow > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.12, y: -2, zIndex: 10 }}
                  transition={{ duration: 0.25, delay: visible.length * 0.05 }}
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  aria-label={`Mais ${overflow} agentes`}
                >
                  +{overflow}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top" className="px-2.5 py-1.5 max-w-[220px]">
                <div className="text-[11px] font-medium mb-1">+{overflow} agentes neste squad</div>
                <div className="text-[10px] text-muted-foreground leading-snug">
                  {agents.slice(maxVisible).map((a) => a.name).join(" · ")}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <span className="ml-3 text-xs text-muted-foreground">
          {agents.length} agentes trabalhando
        </span>
      </div>
    </TooltipProvider>
  );
};

export default AgentAvatarStrip;
