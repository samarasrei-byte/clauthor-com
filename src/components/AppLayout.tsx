import { useState, useEffect, lazy, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./Navbar";
// OnboardingWizard legado removido.
import AgentLivePreview from "./library/AgentLivePreview";
import { supabase } from "@/integrations/supabase/client";
const ThorGreeter = lazy(() => import("./ThorGreeter"));
const SocialProofToasts = lazy(() => import("./SocialProofToasts"));
const ExitIntentCapture = lazy(() => import("./ExitIntentCapture"));
const JourneyProgressBar = lazy(() => import("./JourneyProgressBar"));
const SoundWaveIntro = lazy(() => import("./intro/SoundWaveIntro"));
const AssistantHierarchy = lazy(() => import("./AssistantHierarchy"));
const CartFab = lazy(() => import("./CartFab"));

const THOR_HIDDEN_ROUTES = ["/pitch"];
const NAVBAR_HIDDEN_ROUTES = ["/thor"];
// Rotas de checkout / pós-checkout que devem ter layout limpo (sem Navbar/Thor)
const CHECKOUT_ROUTE_PREFIXES = ["/contratar/", "/departamento-ativo/", "/checkout"];

const AppLayout = () => {
  const [testDriveAgent, setTestDriveAgent] = useState<{ key: string; name: string } | null>(null);
  const location = useLocation();
  const isCheckoutRoute = CHECKOUT_ROUTE_PREFIXES.some((p) => location.pathname.startsWith(p));
  const showThor = !THOR_HIDDEN_ROUTES.includes(location.pathname) && !isCheckoutRoute;
  const showNavbar = !NAVBAR_HIDDEN_ROUTES.includes(location.pathname) && !isCheckoutRoute;
  const isHomePage = location.pathname === "/";

  // Adiar hidratação de add-ons não-críticos (dialogs, greeter, gate) até o
  // browser sinalizar idle — libera o LCP da rota atual primeiro.
  const [addonsReady, setAddonsReady] = useState(false);
  useEffect(() => {
    const w = window as any;
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(() => setAddonsReady(true), { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setAddonsReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-dvh bg-background overflow-x-hidden">
      {showNavbar && <Navbar />}
      <main className={showNavbar ? "pt-16" : ""}>
        <Outlet />
      </main>

      <AgentLivePreview
        agentName={testDriveAgent?.name || ""}
        agentDesc="Converse com este agente antes de contratar"
        isOpen={!!testDriveAgent}
        onClose={() => setTestDriveAgent(null)}
      />

      {addonsReady && showThor && (
        <Suspense fallback={null}>
          {/* Hierarquia única: 1º contato = só Thor (onboarding). Depois = greeting + updates. */}
          <AssistantHierarchy />
        </Suspense>
      )}
    </div>
  );
};

export default AppLayout;
