import { useEffect } from "react";

/**
 * Applies the `dash-dense` class to <html> while the component is mounted.
 * Use in routes that should share the Notion/Salesforce-tier density
 * (dashboard, video studio, pitch decks). Safe to nest — the class is
 * idempotent so multiple mounts don't stack.
 */
export function useDenseMode() {
  useEffect(() => {
    document.documentElement.classList.add("dash-dense");
    return () => {
      // Only remove if no other dense route is still mounted. We use a counter
      // on the element to be resilient to overlapping mounts.
      const el = document.documentElement;
      const count = Number(el.dataset.denseCount || "0");
      const next = Math.max(0, count - 1);
      if (next === 0) el.classList.remove("dash-dense");
      el.dataset.denseCount = String(next);
    };
  }, []);

  // Increment mount counter synchronously so overlapping mounts survive unmounts.
  useEffect(() => {
    const el = document.documentElement;
    const count = Number(el.dataset.denseCount || "0");
    el.dataset.denseCount = String(count + 1);
  }, []);
}
