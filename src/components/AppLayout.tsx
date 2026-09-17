import { useState, useEffect, lazy, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import AgentLivePreview from "./library/AgentLivePreview";

const AssistantHierarchy = lazy(() => import("./AssistantHierarchy"));
const CartFab = lazy(() => import("./CartFab"));

const THOR_HIDDEN_ROUTES = ["/pitch"];
const NAVBAR_HIDDEN_ROUTES = ["/thor"];
const CHECKOUT_ROUTE_PREFIXES = ["/contratar/", "/departamento-ativo/", "/checkout"];

const AppLayout = () => {
  const [testDriveAgent, setTestDriveAgent] = useState<{ key: string; name: string } | null>(null);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isCheckoutRoute = CHECKOUT_ROUTE_PREFIXES.some((p) => location.pathname.startsWith(p));
  const showThor = !isHomePage && !THOR_HIDDEN_ROUTES.includes(location.pathname) && !isCheckoutRoute;
  const showNavbar = !isHomePage && !NAVBAR_HIDDEN_ROUTES.includes(location.pathname) && !isCheckoutRoute;

  const [addonsReady, setAddonsReady] = useState(false);
  useEffect(() => {
    const w = window as any;
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(() => setAddonsReady(true), { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const timer = setTimeout(() => setAddonsReady(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-dvh bg-background overflow-x-hidden">
      {showNavbar && <Navbar />}
      <main className={showNavbar ? "pt-16" : ""}>
        <Outlet />
      </main>

      {!isHomePage && (
        <AgentLivePreview
          agentName={testDriveAgent?.name || ""}
          agentDesc="Converse com este agente antes de contratar"
          isOpen={!!testDriveAgent}
          onClose={() => setTestDriveAgent(null)}
        />
      )}

      {addonsReady && showThor && (
        <Suspense fallback={null}>
          <AssistantHierarchy />
        </Suspense>
      )}

      {!isHomePage && !isCheckoutRoute && (
        <Suspense fallback={null}>
          <CartFab />
        </Suspense>
      )}
    </div>
  );
};

export default AppLayout;
