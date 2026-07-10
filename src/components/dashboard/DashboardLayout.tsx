import { Outlet, Link, useNavigate } from "react-router-dom";
import { LogOut, Home, Shield, Coins, AlertTriangle, X } from "lucide-react";
import ClauthorLogo from "@/components/ClauthorLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSelector } from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import FloatingDock, { FloatingDockProvider } from "./FloatingDock";
import { lazy, Suspense } from "react";

import { useTokenMonitor } from "@/hooks/useTokenMonitor";
import TokenUpgradeDialog from "./TokenUpgradeDialog";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const PlatformUpdatesDialog = lazy(() => import("@/components/PlatformUpdatesDialog"));
const ThorDailyGreeting = lazy(() => import("@/components/ThorDailyGreeting"));

const DashboardLayout = () => {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
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
        <header className="h-14 border-b border-white/[0.05] bg-background/80 backdrop-blur-2xl flex items-center justify-between px-4 sm:px-6 shrink-0 z-40">
          <Link to="/" className="flex items-center group">
            <ClauthorLogo size="md" />
          </Link>

          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                  <Shield className="h-4 w-4" />
                </Button>
              </Link>
            )}
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
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>

        <FloatingDock />

        <Suspense fallback={null}>
          <PlatformUpdatesDialog />
          <ThorDailyGreeting />
        </Suspense>
      </div>
    </FloatingDockProvider>
  );
};


export default DashboardLayout;
