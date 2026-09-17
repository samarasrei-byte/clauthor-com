import { useState, useEffect, lazy, Suspense } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import Navbar from "./Navbar";
import { ArrowRight, MessageCircle, Network, Tag } from "lucide-react";
// P1 · Consolidação: SalesChatbot, SupportChat, SocialProofToasts e
// ExitIntentCapture não são mais renderizados no layout, o Thor é o único
// concierge visível. Os arquivos seguem existindo por 1 sprint como legado.
import AgentLivePreview from "./library/AgentLivePreview";
const AssistantHierarchy = lazy(() => import("./AssistantHierarchy"));
const CartFab = lazy(() => import("./CartFab"));

const THOR_HIDDEN_ROUTES = ["/pitch"];
const NAVBAR_HIDDEN_ROUTES = ["/thor"];
// Rotas de checkout / pós-checkout que devem ter layout limpo (sem Navbar/Thor)
const CHECKOUT_ROUTE_PREFIXES = ["/contratar/", "/departamento-ativo/", "/checkout"];

const HomeOrientationBar = () => {
  const goToChat = () => {
    const chatInput = document.querySelector<HTMLTextAreaElement>('textarea[placeholder*="Pergunte"]');
    chatInput?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => chatInput?.focus(), 450);
  };

  return (
    <aside
      aria-label="Como começar"
      className="border-b border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-[1120px] flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
            1
          </span>
          <p className="text-xs font-medium text-foreground sm:text-sm">
            Comece pelo que você precisa resolver.
          </p>
        </div>

        <nav aria-label="Atalhos da página inicial" className="flex gap-1 overflow-x-auto pb-0.5 sm:gap-2">
          <button
            type="button"
            onClick={goToChat}
            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-primary/35 bg-primary/10 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <MessageCircle aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
            Falar com o Thor
          </button>
          <Link
            to="/departamentos"
            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <Network aria-hidden="true" className="h-3.5 w-3.5" />
            Ver departamentos
          </Link>
          <Link
            to="/pricing"
            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <Tag aria-hidden="true" className="h-3.5 w-3.5" />
            Ver preços
            <ArrowRight aria-hidden="true" className="h-3 w-3" />
          </Link>
        </nav>
      </div>
    </aside>
  );
};

const AppLayout = () => {
  const [testDriveAgent, setTestDriveAgent] = useState<{ key: string; name: string } | null>(null);
  const location = useLocation();
  const isCheckoutRoute = CHECKOUT_ROUTE_PREFIXES.some((p) => location.pathname.startsWith(p));
  const showThor = !THOR_HIDDEN_ROUTES.includes(location.pathname) && !isCheckoutRoute;
  const showNavbar = !NAVBAR_HIDDEN_ROUTES.includes(location.pathname) && !isCheckoutRoute;
  const isHomePage = location.pathname === "/";

  // Adiar hidratação de add-ons não-críticos (dialogs, greeter, gate) até o
  // browser sinalizar idle · libera o LCP da rota atual primeiro.
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
    <div className="min-h-dvh overflow-x-hidden bg-background">
      {showNavbar && <Navbar />}
      <main className={showNavbar ? "pt-16" : ""}>
        {isHomePage && showNavbar && <HomeOrientationBar />}
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

      {!isCheckoutRoute && (
        <Suspense fallback={null}>
          <CartFab />
        </Suspense>
      )}
    </div>
  );
};

export default AppLayout;
