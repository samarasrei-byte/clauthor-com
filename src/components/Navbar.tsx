import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, ShieldCheck, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import ClauthorLogo from "@/components/ClauthorLogo";

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
    const onClick = (e: MouseEvent) => {
      if (solutionsRef.current && !solutionsRef.current.contains(e.target as Node)) {
        setSolutionsOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSolutionsOpen(false);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
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
      className={`fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/30 ${mobileOpen ? "z-[9999]" : ""}`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="max-w-[1120px] mx-auto px-5 sm:px-6">
        <div className="flex items-center justify-between h-12">
          {/* Logo - pure text, Apple style */}
          <Link to="/" className="flex items-center group">
            <ClauthorLogo size="md" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0">
            {/* Solutions dropdown */}
            <div ref={solutionsRef} className="relative">
              <button
                onClick={() => setSolutionsOpen(!solutionsOpen)}
                className={`px-3 py-1 rounded-md text-[13px] transition-colors flex items-center gap-1 ${
                  solutionsOpen
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("navbar.solutions")}
                <ChevronDown className={`h-3 w-3 transition-transform ${solutionsOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {solutionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[260px] rounded-xl bg-popover border border-border/50 shadow-lg shadow-black/[0.08] dark:shadow-black/[0.3] p-1 z-50"
                  >
                    {[
                      { href: "/marketplace", label: t("navbar.marketplace_label"), desc: t("navbar.marketplace_desc") },
                      { href: "/departamentos", label: t("navbar.ai_teams_label"), desc: t("navbar.ai_teams_desc") },
                      { href: "/team-builder", label: t("navbar.team_builder_label", { defaultValue: "Build Team" }), desc: t("navbar.team_builder_desc", { defaultValue: "Pick agents and see costs in real time" }) },
                      { href: "/enterprise", label: "Enterprise", desc: "Squads dedicadas, SSO, SLA 99.9% e suporte white-glove" },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setSolutionsOpen(false)}
                        className="flex flex-col gap-0.5 px-3 py-2.5 rounded-lg hover:bg-accent/60 transition-colors"
                      >
                        <span className="text-[13px] font-medium text-foreground">{item.label}</span>
                        <span className="text-[11px] text-muted-foreground leading-snug">{item.desc}</span>
                      </Link>
                    ))}
                    <div className="border-t border-border/40 my-1" />
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
                        className="block px-3 py-2 rounded-lg text-[12px] text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Direct links */}
            {navLinks.filter(l => !l.dropdown).map((item) => (
              <Link
                key={item.href}
                to={item.href!}
                className={`px-3 py-1 rounded-md text-[13px] transition-colors ${
                  location.pathname === item.href
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3 py-1 rounded-md text-[13px] transition-colors flex items-center gap-1 ${
                  location.pathname === "/admin"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
                Admin
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-1">
            <ThemeToggle />
            <LanguageSelector />
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-foreground h-8 text-[13px] font-normal"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
                  {t("nav.logout")}
                </Button>
                <Link to="/create-agent">
                  <Button size="sm" className="h-8 text-[13px] rounded-full font-medium px-4">
                    {t("dashboard.new_agent")}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 text-[13px] font-normal">
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link to="/auth" state={{ signup: true }}>
                  <Button size="sm" className="h-8 text-[13px] rounded-full font-medium px-4">
                    {t("auth.create_account")}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-foreground p-1.5"
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
            className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-2xl overflow-hidden"
          >
            <div className="px-5 py-5 space-y-0.5">
              {[
                { href: "/marketplace", label: t("navbar.marketplace_label") },
                { href: "/departamentos", label: t("navbar.ai_teams_label") },
                { href: "/team-builder", label: t("navbar.team_builder_label", { defaultValue: "Build Team" }) },
                { href: "/enterprise", label: "Enterprise" },
                { href: "/pricing", label: t("nav.pricing") },
                { href: "/how-it-works", label: t("nav.how_it_works") },
              ].map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-[14px] transition-colors ${
                    location.pathname === item.href
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {user && (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-[14px] text-muted-foreground hover:text-foreground">
                    {t("nav.dashboard")}
                  </Link>
                  <Link to="/agents" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-[14px] text-muted-foreground hover:text-foreground">
                    {t("nav.my_agents")}
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-[14px] text-muted-foreground hover:text-foreground">
                  <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
                  Admin
                </Link>
              )}
              <div className="flex items-center gap-2 px-3 py-2">
                <LanguageSelector />
                <ThemeToggle />
              </div>
              <div className="pt-3 border-t border-border/30 space-y-1.5">
                {user ? (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-10 text-[14px] font-normal"
                      onClick={() => { handleSignOut(); setMobileOpen(false); }}
                    >
                      <LogOut className="h-4 w-4 mr-2" strokeWidth={1.5} />
                      {t("nav.logout")}
                    </Button>
                    <Link to="/create-agent" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full h-10 text-[14px] rounded-full">
                        {t("dashboard.new_agent")}
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full h-10 text-[14px] font-normal">
                        {t("nav.login")}
                      </Button>
                    </Link>
                    <Link to="/auth" state={{ signup: true }} onClick={() => setMobileOpen(false)}>
                      <Button className="w-full h-10 text-[14px] rounded-full">
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
