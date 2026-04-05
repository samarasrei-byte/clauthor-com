import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, ShieldCheck, ChevronDown } from "lucide-react";
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
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const solutionsRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin, signOut } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    setSolutionsOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!solutionsOpen) return;
    const handler = (e: MouseEvent) => {
      if (solutionsRef.current && !solutionsRef.current.contains(e.target as Node)) {
        setSolutionsOpen(false);
      }
    };
    const timer = setTimeout(() => document.addEventListener("click", handler, true), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handler, true);
    };
  }, [solutionsOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navLinks = [
    { label: t("navbar.solutions"), dropdown: true },
    ...(user
      ? [
          { label: t("nav.dashboard"), href: "/dashboard" },
          { label: t("nav.my_agents"), href: "/agents" },
        ]
      : [
          { label: t("nav.pricing"), href: "/pricing" },
        ]),
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40 ${mobileOpen ? "z-[9999]" : ""}`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img src={clauthorLogo} alt="CLAUTHOR" className="w-7 h-7 object-contain" />
            <span className="font-semibold text-[15px] text-foreground tracking-tight">
              CLAUTHOR
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {/* Solutions dropdown */}
            <div ref={solutionsRef} className="relative">
              <button
                onClick={() => setSolutionsOpen(!solutionsOpen)}
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors flex items-center gap-1 ${
                  solutionsOpen
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {t("navbar.solutions")}
                <ChevronDown className={`h-3 w-3 transition-transform ${solutionsOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {solutionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-full left-0 mt-1 w-[280px] rounded-xl bg-popover border border-border shadow-lg p-1.5 z-50"
                  >
                    {[
                      { href: "/marketplace", label: t("navbar.marketplace_label"), desc: t("navbar.marketplace_desc") },
                      { href: "/departamentos", label: t("navbar.ai_teams_label"), desc: t("navbar.ai_teams_desc"), badge: t("navbar.new_badge") },
                      { href: "/team-builder", label: t("navbar.team_builder_label", { defaultValue: "Build Team" }), desc: t("navbar.team_builder_desc", { defaultValue: "Pick agents and see costs in real time" }) },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setSolutionsOpen(false)}
                        className="flex flex-col gap-0.5 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-foreground">{item.label}</span>
                          {item.badge && (
                            <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{item.badge}</span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground leading-snug">{item.desc}</span>
                      </Link>
                    ))}
                    <div className="border-t border-border my-1" />
                    <div className="grid grid-cols-2 gap-0.5">
                      {[
                        { href: "/how-it-works", label: t("nav.how_it_works") },
                        { href: "/pricing", label: t("nav.pricing") },
                        { href: "/community", label: t("navbar.community", { defaultValue: "Community" }) },
                        { href: "/api-docs", label: t("navbar.api_docs", { defaultValue: "API Docs" }) },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setSolutionsOpen(false)}
                          className="px-3 py-2 rounded-lg text-[12px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Direct links */}
            {navLinks.filter(l => !l.dropdown).map((item) => (
              <Link
                key={item.href}
                to={item.href!}
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                  location.pathname === item.href
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors flex items-center gap-1 ${
                  location.pathname === "/admin"
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
                Admin
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-1.5">
            <ThemeToggle />
            <LanguageSelector />
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-foreground h-8 text-[13px]"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
                  {t("nav.logout")}
                </Button>
                <Link to="/create-agent">
                  <Button size="sm" className="h-8 text-[13px] rounded-lg font-medium">
                    {t("dashboard.new_agent")}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 text-[13px] font-medium">
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link to="/auth" state={{ signup: true }}>
                  <Button size="sm" className="h-8 text-[13px] rounded-lg font-medium">
                    {t("auth.create_account")}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-foreground p-2 hover:bg-accent rounded-lg transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {[
                { href: "/marketplace", label: t("navbar.marketplace_label") },
                { href: "/departamentos", label: t("navbar.ai_teams_label") },
                { href: "/team-builder", label: t("navbar.team_builder_label", { defaultValue: "Build Team" }) },
                { href: "/pricing", label: t("nav.pricing") },
                { href: "/how-it-works", label: t("nav.how_it_works") },
              ].map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                    location.pathname === item.href
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {user && (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-[14px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50">
                    {t("nav.dashboard")}
                  </Link>
                  <Link to="/agents" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-[14px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50">
                    {t("nav.my_agents")}
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-[14px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50">
                  <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
                  Admin
                </Link>
              )}
              <div className="flex items-center gap-2 px-3 py-2">
                <LanguageSelector />
                <ThemeToggle />
              </div>
              <div className="pt-2 border-t border-border space-y-1.5">
                {user ? (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-10 text-[14px]"
                      onClick={() => { handleSignOut(); setMobileOpen(false); }}
                    >
                      <LogOut className="h-4 w-4 mr-2" strokeWidth={1.5} />
                      {t("nav.logout")}
                    </Button>
                    <Link to="/create-agent" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full h-10 text-[14px]">
                        {t("dashboard.new_agent")}
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full h-10 text-[14px]">
                        {t("nav.login")}
                      </Button>
                    </Link>
                    <Link to="/auth" state={{ signup: true }} onClick={() => setMobileOpen(false)}>
                      <Button className="w-full h-10 text-[14px]">
                        {t("auth.create_account")}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
