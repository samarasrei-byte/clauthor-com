import { useEffect, useState, useCallback } from "react";

const KEY = "ux:beginner-mode";
const EVT = "ux:beginner-mode-change";

function readInitial(): boolean {
  try {
    const v = localStorage.getItem(KEY);
    // Default: ON for new users (undefined → beginner)
    return v === null ? true : v === "1";
  } catch {
    return true;
  }
}

/**
 * Modo Iniciante: filtra a UI para mostrar apenas o essencial.
 * Persistido em localStorage e sincronizado entre componentes via CustomEvent.
 */
export function useBeginnerMode(): [boolean, (v: boolean) => void, () => void] {
  const [enabled, setEnabled] = useState<boolean>(readInitial);

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { enabled?: boolean } | undefined;
      if (typeof detail?.enabled === "boolean") setEnabled(detail.enabled);
    };
    window.addEventListener(EVT, onChange as EventListener);
    return () => window.removeEventListener(EVT, onChange as EventListener);
  }, []);

  const set = useCallback((v: boolean) => {
    try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* ignore */ }
    setEnabled(v);
    window.dispatchEvent(new CustomEvent(EVT, { detail: { enabled: v } }));
  }, []);

  const toggle = useCallback(() => set(!enabled), [enabled, set]);

  return [enabled, set, toggle];
}

// Rotas/tabs essenciais visíveis no Modo Iniciante.
export const BEGINNER_ALLOWED_IDS = new Set<string>([
  "tab:overview",
  "route:/dashboard/inbox",
  "route:/video",
  "tab:agents",
  "tab:omnix",
]);

