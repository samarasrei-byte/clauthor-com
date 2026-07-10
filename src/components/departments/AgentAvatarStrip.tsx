/**
 * AgentAvatarStrip — renderiza avatares empilhados de agentes de um departamento.
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
    <div className={cn("flex items-center", className)}>
      <div className="flex -space-x-2">
        {visible.map((agent, idx) => (
          <motion.div
            key={agent.slug}
            initial={{ opacity: 0, scale: 0.6, x: -6 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.05 }}
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-background text-[10px] font-semibold tracking-wide",
              tokens.bg,
              tokens.text,
              tokens.border
            )}
            title={agent.name}
            aria-label={agent.name}
          >
            {agent.initials}
          </motion.div>
        ))}

        {overflow > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: visible.length * 0.05 }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-muted-foreground"
            aria-label={`Mais ${overflow} agentes`}
            title={`+${overflow} agentes`}
          >
            +{overflow}
          </motion.div>
        )}
      </div>

      <span className="ml-3 text-xs text-muted-foreground">
        {agents.length} agentes trabalhando
      </span>
    </div>
  );
};

export default AgentAvatarStrip;
