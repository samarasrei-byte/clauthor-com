import LiveTasksTicker from "./LiveTasksTicker";
import HelpButton from "./HelpButton";

/**
 * FloatingDock — Single mount point for every floating UI element.
 *
 * Zone contract (collision-free by design):
 *   ├─ bottom-left   → LiveTasksTicker  (realtime task surface)
 *   ├─ bottom-center → ThorLiveGuide    (mounted globally in ThorCore)
 *   └─ bottom-right  → HelpButton       (FAB de ajuda)
 *
 * Rules for adding a new floating widget:
 *   1. Pick a free zone (or extend this map) — never overlap existing FABs.
 *   2. Use z-40; modals/dialogs (z-50+) sit above the dock.
 *   3. Mount it ONLY here. Self-positioning components stay self-positioned,
 *      but their position class must match the zone they declare.
 *   4. Mobile: each widget must collapse below ≤ 56px on smallest screens.
 */
const FloatingDock = () => {
  return (
    <>
      <LiveTasksTicker />
      <HelpButton />
      {/* ThorLiveGuide is mounted by ThorCore (bottom-center, z-50) */}
    </>
  );
};

export default FloatingDock;
