import { createContext, useCallback, useContext, useMemo, useState, lazy, Suspense, ReactNode } from "react";
import LiveTasksTicker from "./LiveTasksTicker";
import HelpButton from "./HelpButton";

const ThorLiveGuide = lazy(() => import("./ThorLiveGuide"));

/**
 * FloatingDock · Single mount point for every floating UI element.
 *
 * Zone contract (collision-free by design):
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ ZONE              │ POSITION              │ Z-INDEX      │
 *   ├──────────────────────────────────────────────────────────┤
 *   │ bottom-left       │ bottom-4 left-4       │ z-40         │
 *   │ bottom-center     │ bottom-4 left-1/2     │ z-50         │
 *   │ bottom-right      │ bottom-4 right-4      │ z-40         │
 *   └──────────────────────────────────────────────────────────┘
 *
 * Reserved widgets:
 *   - bottom-left   → LiveTasksTicker
 *   - bottom-center → ThorLiveGuide (registered via useFloatingDock())
 *   - bottom-right  → HelpButton
 *
 * Rules for adding a new floating widget:
 *   1. Pick a free zone (or extend ZONES) · never overlap an existing FAB.
 *   2. FABs use z-40; the active guidance overlay uses z-50; modals/dialogs ≥ z-60.
 *   3. Mount it ONLY here, never inline in a page.
 *   4. Mobile: each widget collapses ≤ 56px and respects safe-area-inset-bottom.
 */
export type FloatingZone = "bottom-left" | "bottom-center" | "bottom-right";

export const ZONES: Record<FloatingZone, { position: string; zIndex: number; reservedFor: string }> = {
  "bottom-left":   { position: "fixed bottom-4 left-4",                       zIndex: 40, reservedFor: "LiveTasksTicker" },
  "bottom-center": { position: "fixed bottom-4 left-1/2 -translate-x-1/2",    zIndex: 50, reservedFor: "ThorLiveGuide" },
  "bottom-right":  { position: "fixed bottom-4 right-4",                      zIndex: 40, reservedFor: "HelpButton" },
};

export interface ThorDockConfig {
  activeSection: string;
  onNavigate: (section: string) => void;
  onDismiss: () => void;
}

interface FloatingDockContextValue {
  thor: ThorDockConfig | null;
  registerThor: (cfg: ThorDockConfig | null) => void;
}

const FloatingDockContext = createContext<FloatingDockContextValue | null>(null);

export const useFloatingDock = () => {
  const ctx = useContext(FloatingDockContext);
  if (!ctx) {
    // Soft fallback: outside provider, becomes a no-op.
    return { thor: null, registerThor: () => {} } as FloatingDockContextValue;
  }
  return ctx;
};

export const FloatingDockProvider = ({ children }: { children: ReactNode }) => {
  const [thor, setThor] = useState<ThorDockConfig | null>(null);
  const registerThor = useCallback((cfg: ThorDockConfig | null) => setThor(cfg), []);
  const value = useMemo(() => ({ thor, registerThor }), [thor, registerThor]);
  return <FloatingDockContext.Provider value={value}>{children}</FloatingDockContext.Provider>;
};

const FloatingDock = () => {
  const { thor } = useFloatingDock();

  return (
    <>
      {/* bottom-left */}
      <LiveTasksTicker />
      {/* bottom-right */}
      <HelpButton />
      {/* bottom-center (reserved zone) */}
      {thor && (
        <Suspense fallback={null}>
          <ThorLiveGuide
            activeSection={thor.activeSection}
            onNavigate={thor.onNavigate}
            onDismiss={thor.onDismiss}
          />
        </Suspense>
      )}
    </>
  );
};

export default FloatingDock;
