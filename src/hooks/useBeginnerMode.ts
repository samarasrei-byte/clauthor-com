/**
 * Modo Iniciante · DESATIVADO globalmente.
 *
 * Feedback recorrente: o toggle Simples/Completo confundia os usuários
 * (pensavam que estavam sem acesso a features). A partir de agora TODOS
 * enxergam o menu completo. O hook segue exportado como no-op para não
 * quebrar imports existentes (`GlobalDashboardSidebar`, testes, etc).
 */
export function useBeginnerMode(): [boolean, (v: boolean) => void, () => void] {
  const noop = () => { /* modo iniciante desativado */ };
  return [false, noop, noop];
}

// Rotas/tabs essenciais visíveis no Modo Iniciante.
export const BEGINNER_ALLOWED_IDS = new Set<string>([
  "tab:overview",
  "route:/dashboard/inbox",
  "route:/video",
  "tab:agents",
  "tab:omnix",
]);

