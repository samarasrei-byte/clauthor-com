import { useCallback, useEffect, useState } from "react";
import { hasSeenDiagnosis, markDiagnosisSeen } from "@/lib/diagnosis-routing";

/**
 * Controla o LandingDiagnosisDialog na landing page.
 * - Abre manualmente via `open()`.
 * - Auto-abre 1x na primeira visita, após `autoOpenDelayMs` (default 8s).
 */
export function useLandingDiagnosis(autoOpenDelayMs = 8000) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (hasSeenDiagnosis()) return;
    const t = setTimeout(() => {
      if (!hasSeenDiagnosis()) setIsOpen(true);
    }, autoOpenDelayMs);
    return () => clearTimeout(t);
  }, [autoOpenDelayMs]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    markDiagnosisSeen();
  }, []);

  return { isOpen, open, close, setIsOpen };
}
