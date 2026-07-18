import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, Home, Shield, Coins, AlertTriangle, X, Clapperboard, GraduationCap, Sparkles, Menu } from "lucide-react";
import { useBeginnerMode } from "@/hooks/useBeginnerMode";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";

import ClauthorLogo from "@/components/ClauthorLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSelector } from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import FloatingDock, { FloatingDockProvider } from "./FloatingDock";
import GlobalDashboardSidebar from "./GlobalDashboardSidebar";
import PrimaryCTA from "./PrimaryCTA";
import { lazy, Suspense, useEffect, useState } from "react";


import { useTokenMonitor } from "@/hooks/useTokenMonitor";
import TokenUpgradeDialog from "./TokenUpgradeDialog";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

// Single-channel: AssistantHierarchy decides which (if any) modal to show.
const AssistantHierarchy = lazy(() => import("@/components/AssistantHierarchy"));
const LiveTasksTicker = lazy(() => import("@/components/dashboard/LiveTasksTicker"));



const DashboardLayout = () => {
  const { isAdmin, signOut } = useAuth();
  const [beginner, , toggleBeginner] = useBeginnerMode();
  const navigate = useNavigate();

  const location = useLocation();
  // /dashboard já monta seu próprio sidebar (com estado de "sections").
  // Em todas as outras rotas do dashboard, injetamos o sidebar global.
  const showGlobalSidebar = location.pathname !== "/dashboard";

  // Track sidebar collapsed state so the main content padding follows the width
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem("sb:collapsed") === "1"; } catch { return false; }
  });
  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { collapsed?: boolean } | undefined;
      if (typeof detail?.collapsed === "boolean") setSidebarCollapsed(detail.collapsed);
    };
    window.addEventListener("sb:collapsed-change", onChange as EventListener);
    return () => window.removeEventListener("sb:collapsed-change", onChange as EventListener);
  }, []);

  const { alertLevel, showUpgradePrompt, dismissUpgradePrompt } = useTokenMonitor();
  const { t } = useTranslation();

  const BANNER_CONFIG: Record<string, { bg: string; border: string; icon: string; text: string }> = {
    caution: { bg: "bg-amber-500/10", border: "border-amber-500/20", icon: "text-amber-400", text: t("token_banner.caution") },
    warning: { bg: "bg-orange-500/10", border: "border-orange-500/20", icon: "text-orange-400", text: t("token_banner.warning") },
    critical: { bg: "bg-destructive/10", border: "border-destructive/20", icon: "text-destructive", text: t("token_banner.critical") },
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const bannerCfg = alertLevel !== "normal" ? BANNER_CONFIG[alertLevel] : null;

  return (
    <FloatingDockProvider>
      <div className="h-dvh flex flex-col bg-background overflow-hidden">
        {/* Token upgrade banner */}
        <AnimatePresence>
          {showUpgradePrompt && bannerCfg && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`${bannerCfg.bg} border-b ${bannerCfg.border} shrink-0 overflow-hidden z-50`}
            >
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${bannerCfg.icon}`} />
                  <span className="text-xs font-medium">{bannerCfg.text}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TokenUpgradeDialog trigger={
                    <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 border-primary/20 text-primary">
                      <Coins className="h-3 w-3" /> Upgrade
                    </Button>
                  } />
                  <button onClick={dismissUpgradePrompt} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fixed top bar */}
        <header className="h-14 bg-background/80 backdrop-blur-2xl flex items-center justify-between px-4 sm:px-6 shrink-0 z-40">
          <Link to="/" className="flex items-center group">
            <ClauthorLogo size="md" />
          </Link>

          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/video-studio" title="Video Studio">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                <Clapperboard className="h-4 w-4" />
              </Button>
            </Link>
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                  <Shield className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleBeginner}
              title={beginner ? "Modo Iniciante ativo — clique para ver menu completo" : "Modo Avançado — clique para simplificar"}
              className="text-muted-foreground hover:text-foreground gap-1.5 text-xs h-8 px-2"
            >
              {beginner ? <GraduationCap className="h-3.5 w-3.5 text-primary" /> : <Sparkles className="h-3.5 w-3.5" />}
              <span className="hidden md:inline">{beginner ? "Iniciante" : "Avançado"}</span>
            </Button>
            <ThemeToggle />
            <LanguageSelector />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground gap-1.5 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("nav.logout")}</span>
            </Button>
          </div>
        </header>

        {/* Below header: sidebar + scrollable content */}
        <div className="flex-1 overflow-hidden relative">
          {showGlobalSidebar && (
            <div className="hidden lg:block fixed left-2 top-[68px] bottom-2 z-30 pointer-events-none">
              <div className="h-full pointer-events-auto">
                <GlobalDashboardSidebar />
              </div>
            </div>
          )}
          <div
            className={showGlobalSidebar ? "h-full transition-[padding] duration-200 ease-out" : "h-full"}
            style={showGlobalSidebar ? { paddingLeft: undefined } : undefined}
          >
            <div
              className={showGlobalSidebar ? "h-full lg:transition-[padding] lg:duration-200" : "h-full"}
              style={showGlobalSidebar ? { paddingLeft: `var(--sb-safe, 0px)` } : undefined}
            >
              <Outlet />
            </div>
          </div>
        </div>
        {/* CSS variable driven by sidebar collapsed state (only applied ≥ lg) */}
        <style>{`
          @media (min-width: 1024px) {
            :root { --sb-safe: ${sidebarCollapsed ? "68px" : "228px"}; }
          }
        `}</style>


        <FloatingDock />
        <PrimaryCTA />


        <Suspense fallback={null}>
          <AssistantHierarchy />
          <LiveTasksTicker />
        </Suspense>
      </div>
    </FloatingDockProvider>
  );
};


export default DashboardLayout;
