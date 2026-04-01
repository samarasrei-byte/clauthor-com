import { useEffect, useRef, useCallback } from "react";

/**
 * Hook that detects scroll position and triggers Thor contextual messages.
 * Each trigger fires ONCE per session using sessionStorage.
 */

interface ScrollTrigger {
  id: string;
  message: string;
}

const SCROLL_TRIGGERS: ScrollTrigger[] = [
  {
    id: "roi_section",
    message: "Quer que eu calcule o ROI específico para o seu negócio? 📊",
  },
  {
    id: "pricing_section",
    message: "Posso recomendar o plano ideal para você. Me conta qual é sua maior dor operacional. 💡",
  },
];

const HESITATION_MSG = "Ficou com alguma dúvida? Pode me perguntar qualquer coisa. 😊";
const HESITATION_KEY = "thor_scroll_hesitation";
const SESSION_PREFIX = "thor_scroll_";

export function useThorScrollTrigger(
  onTrigger: (message: string) => void
) {
  const hesitationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const resetHesitation = useCallback(() => {
    if (hesitationTimer.current) {
      clearTimeout(hesitationTimer.current);
    }
    if (!sessionStorage.getItem(HESITATION_KEY)) {
      hesitationTimer.current = setTimeout(() => {
        if (!sessionStorage.getItem(HESITATION_KEY)) {
          sessionStorage.setItem(HESITATION_KEY, "1");
          onTrigger(HESITATION_MSG);
        }
      }, 30_000);
    }
  }, [onTrigger]);

  useEffect(() => {
    // Observe sections with data-thor-trigger attribute
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const triggerId = (entry.target as HTMLElement).dataset.thorTrigger;
        if (!triggerId) return;
        
        const key = SESSION_PREFIX + triggerId;
        if (sessionStorage.getItem(key)) return;
        
        const trigger = SCROLL_TRIGGERS.find(t => t.id === triggerId);
        if (trigger) {
          sessionStorage.setItem(key, "1");
          onTrigger(trigger.message);
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersect, {
      threshold: 0.3,
    });

    // Observe sections after a short delay to let DOM render
    const timer = setTimeout(() => {
      document.querySelectorAll("[data-thor-trigger]").forEach((el) => {
        observerRef.current?.observe(el);
      });
    }, 2000);

    // Hesitation detection
    const scrollHandler = () => resetHesitation();
    window.addEventListener("scroll", scrollHandler, { passive: true });
    resetHesitation();

    return () => {
      clearTimeout(timer);
      if (hesitationTimer.current) clearTimeout(hesitationTimer.current);
      observerRef.current?.disconnect();
      window.removeEventListener("scroll", scrollHandler);
    };
  }, [onTrigger, resetHesitation]);
}
