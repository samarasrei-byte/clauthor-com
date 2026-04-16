import type { User } from "@supabase/supabase-js";

/**
 * Decide para onde o botão "Acessar" do agente deve levar.
 * - Admin ou usuário que já tem o agente → workspace real (/app/agente/:slug)
 * - Visitante / usuário sem o agente → landing comercial (/agente/:slug)
 *
 * NUNCA retorna /dashboard para fluxos de agente.
 */
export function getAgentTarget(
  slug: string,
  opts: { isAdmin?: boolean; user?: User | null; userAgentSlugs?: string[] } = {}
): string {
  const { isAdmin = false, user = null, userAgentSlugs = [] } = opts;
  const hasAgent = userAgentSlugs.includes(slug);

  if (isAdmin || hasAgent) {
    return `/app/agente/${slug}`;
  }
  if (!user) {
    return `/agente/${slug}`;
  }
  return `/agente/${slug}`;
}
