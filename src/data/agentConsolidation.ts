/**
 * Agent Consolidation Map
 * 
 * Groups redundant agents under a "primary" agent to reduce user confusion.
 * The primary agent absorbs the capabilities of its aliases.
 * 
 * Used by SmartAgentRouter and Library to present a cleaner view.
 */

export interface AgentGroup {
  primary: string;
  aliases: string[];
  reason: string;
}

/** Groups of agents that are functionally overlapping */
export const AGENT_CONSOLIDATIONS: AgentGroup[] = [
  // SDR Channel-specific → merge under unified SDR agents
  {
    primary: "sdr_outbound",
    aliases: ["sdr_linkedin", "sdr_instagram", "sdr_social", "sdr_whatsapp", "sdr_database", "sdr_events", "sdr_partnerships"],
    reason: "SDR de canal específico integrado ao SDR Outbound com suporte multicanal",
  },
  // Creative writing overlap
  {
    primary: "copywriting",
    aliases: ["creative_writer"],
    reason: "Copywriting absorve capacidades de redação criativa",
  },
  // Content overlap
  {
    primary: "content",
    aliases: ["content_producer"],
    reason: "Content Strategy absorve produção de conteúdo",
  },
];

/** Set of all alias slugs (agents hidden from simplified view) */
export const ALIAS_SLUGS = new Set(
  AGENT_CONSOLIDATIONS.flatMap((g) => g.aliases)
);

/** Maps alias → primary */
export const ALIAS_TO_PRIMARY: Record<string, string> = {};
for (const group of AGENT_CONSOLIDATIONS) {
  for (const alias of group.aliases) {
    ALIAS_TO_PRIMARY[alias] = group.primary;
  }
}

/**
 * Filters agent keys to show only primary agents (hides aliases).
 * Used in Library/Marketplace to reduce cognitive load.
 */
export function getSimplifiedAgentKeys(allKeys: readonly string[]): string[] {
  return allKeys.filter((k) => !ALIAS_SLUGS.has(k));
}

/**
 * Given a slug, returns the primary slug if it's an alias.
 */
export function resolvePrimaryAgent(slug: string): string {
  return ALIAS_TO_PRIMARY[slug] || slug;
}
