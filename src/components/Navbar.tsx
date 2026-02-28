import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, ShieldCheck, ChevronDown, Bot, Sparkles, Layers3, Bolt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import clauthorLogo from "@/assets/clauthor-logo.png";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin, signOut } = useAuth();
  const { t } = useTranslation();

  // Close menus on route change
  useEffect(() => {
    setMegaMenuOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mega menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node)) {
        setMegaMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const publicNavItems = [
    { label: t("nav.pricing"), href: "/pricing" },
    { label: t("nav.how_it_works"), href: "/how-it-works" },
  ];

  const authNavItems = [
    { label: t("nav.dashboard"), href: "/dashboard" },
    { label: t("nav.my_agents"), href: "/agents" },
    { label: t("nav.pricing"), href: "/pricing" },
    { label: t("nav.integrations"), href: "/integrations" },
  ];

  const navItems = user ? authNavItems : publicNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-2xl border-b border-white/[0.05]"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={clauthorLogo} alt="CLAUTHOR" className="w-8 h-8 object-contain mix-blend-lighten" />
            <span className="font-display font-bold text-base text-foreground tracking-wider">
              CLAUTHOR
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {/* Mega Menu — Solutions */}
            <div ref={megaMenuRef} className="relative">
              <button
                onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  ["/marketplace", "/library", "/departamentos"].includes(location.pathname)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {t("navbar.solutions")}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${megaMenuOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {megaMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-[380px] rounded-2xl bg-background/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl p-3 z-50"
                  >
                    <Link
                      to="/marketplace"
                      onClick={() => setMegaMenuOpen(false)}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/[0.04] transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-accent-violet/10 flex items-center justify-center shrink-0 icon-container-glow">
                        <Sparkles className="h-5 w-5 text-accent-violet icon-lift" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{t("navbar.marketplace_label")}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("navbar.marketplace_desc")}</p>
                      </div>
                    </Link>
                    <Link
                      to="/departamentos"
                      onClick={() => setMegaMenuOpen(false)}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/[0.04] transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 icon-container-glow">
                        <Layers3 className="h-5 w-5 text-primary icon-lift" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-foreground">{t("navbar.ai_teams_label")}</p>
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{t("navbar.new_badge")}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("navbar.ai_teams_desc")}</p>
                      </div>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === item.href
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  location.pathname === "/admin"
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
                Admin
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <LanguageSelector />
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut} 
                  className="text-muted-foreground hover:text-foreground"
                >
                   <LogOut className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  {t("nav.logout")}
                </Button>
                <Link to="/create-agent">
                  <Button size="sm" className="glow font-medium rounded-lg">
                    {t("dashboard.new_agent")}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground font-medium">
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="relative overflow-hidden glow font-semibold rounded-lg group">
                    <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-primary bg-[length:200%_100%] animate-gradient-shift" />
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Bolt className="h-3.5 w-3.5" strokeWidth={1.5} />
                      {t("auth.create_account")}
                    </span>
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-foreground p-2 hover:bg-white/5 rounded-lg transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-background/95 backdrop-blur-2xl border-t border-white/[0.05]"
        >
          <div className="px-4 py-6 space-y-2">
            <Link
              to="/marketplace"
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === "/marketplace" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              🛒 {t("navbar.marketplace_label")}
            </Link>
            <Link
              to="/departamentos"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === "/departamentos" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              🏢 {t("navbar.ai_teams_label")}
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{t("navbar.new_badge")}</span>
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  location.pathname === item.href
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
                Admin
              </Link>
            )}
            <div className="pt-4 space-y-2">
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      handleSignOut();
                      setMobileOpen(false);
                    }}
                  >
                   <LogOut className="h-4 w-4 mr-2" strokeWidth={1.5} />
                    {t("nav.logout")}
                  </Button>
                  <Link to="/create-agent" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full glow">
                      {t("dashboard.new_agent")}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full">
                      {t("nav.login")}
                    </Button>
                  </Link>
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full glow">
                      {t("auth.create_account")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
