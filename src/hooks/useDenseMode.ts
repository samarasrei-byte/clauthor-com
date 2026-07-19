import { useEffect } from "react";

/**
 * Applies the `dash-dense` class to <html> while mounted.
 * Shared by dashboard, video studio and pitch routes so they get
 * the same Notion/Salesforce-tier typography density.
 */
export function useDenseMode() {
  useEffect(() => {
    document.documentElement.classList.add("dash-dense");
    return () => document.documentElement.classList.remove("dash-dense");
  }, []);
}
