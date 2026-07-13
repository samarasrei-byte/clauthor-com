import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, ShieldCheck, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PremiumCTAButton } from "@/components/ui/premium-cta-button";
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
  const [scrolled, setScrolled] = useState(false);
  const solutionsRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin, signOut } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    setSolutionsOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  // P1 · consolidação: menu principal enxuto e canônico.
  //  Público:  Departamentos · Como funciona · Preços · Comunidade · Entrar
  //  Logado:   Painel · Meus agentes  (o resto vive em "Mais")
  //  "Mais":   Team Builder · Marketplace · Enterprise · Developers · API
  const navLinks = user
    ? [
        { label: t("nav.dashboard"), href: "/dashboard" },
        { label: t("nav.my_agents"), href: "/agents" },
      ]
    : [
        { label: t("navbar.ai_teams_label", { defaultValue: "Departamentos" }), href: "/departamentos" },
        { label: t("nav.how_it_works", { defaultValue: "Como funciona" }), href: "/how-it-works" },
        { label: t("nav.pricing", { defaultValue: "Preços" }), href: "/pricing" },
        { label: t("nav.community", { defaultValue: "Comunidade" }), href: "/community" },
      ];

  const moreLinks = [
    { href: "/team-builder", label: t("navbar.team_builder_label", { defaultValue: "Monte seu Squad" }), desc: "Escolha especialistas e veja o custo em tempo real" },
    { href: "/marketplace", label: t("navbar.marketplace_label", { defaultValue: "Marketplace" }), desc: "Especialistas de IA individuais (avançado)" },
    { href: "/enterprise", label: "Enterprise", desc: "Squads dedicadas, SSO, SLA 99.9% e suporte white-glove" },
    { href: "/developers", label: "Developers", desc: "APIs, MCP Server e integrações" },
    { href: "/api-docs", label: "API Docs", desc: "Documentação técnica completa" },
  ];


  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 border-b ${
        scrolled
          ? "bg-black/95 backdrop-blur-2xl border-white/10 [&_*]:!text-white/80"
          : "bg-background/60 backdrop-blur-2xl border-border/30"
      } ${mobileOpen ? "z-[9999]" : ""}`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="max-w-[1120px] mx-auto px-5 sm:px-6">
        <div className="flex items-center justify-between h-12">
          {/* Logo - pure text, Apple style */}
          <Link to="/" aria-label="ClAuthor · Página inicial" className="flex items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-md">
            <ClauthorLogo size="md" />
          </Link>

          {/* Desktop Nav · P1 canônica: 4 diretas + "Mais" */}
          <div className="hidden md:flex items-center gap-0">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`px-3 py-1 rounded-md text-[13px] transition-colors ${
                  location.pathname === item.href
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* "Mais" dropdown · Team Builder · Marketplace · Enterprise · Devs · API */}
            {!user && (
              <div ref={solutionsRef} className="relative">
                <button
                  onClick={() => setSolutionsOpen(!solutionsOpen)}
                  aria-haspopup="menu"
                  aria-expanded={solutionsOpen}
                  aria-controls="nav-more-menu"
                  className={`px-3 py-1 rounded-md text-[13px] transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                    solutionsOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("navbar.more", { defaultValue: "Mais" })}
                  <ChevronDown aria-hidden="true" className={`h-3 w-3 transition-transform ${solutionsOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {solutionsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      id="nav-more-menu"
                      role="menu"
                      className="absolute top-full right-0 mt-2 w-[280px] rounded-xl bg-popover border border-border/50 shadow-lg shadow-black/[0.08] dark:shadow-black/[0.3] p-1 z-50"
                    >
                      {moreLinks.map((item) => (
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
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
                  <PremiumCTAButton variant="red" size="sm" showArrow={false}>
                    {t("auth.create_account")}
                  </PremiumCTAButton>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-foreground p-1.5 min-h-11 min-w-11 inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-md"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-menu"
          >
            {mobileOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            id="mobile-nav-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-2xl overflow-hidden max-h-[calc(100dvh-3rem)] overflow-y-auto"
          >
            <div className="px-5 py-5 space-y-0.5">
              {/* Principais */}
              {(user
                ? [
                    { href: "/dashboard", label: t("nav.dashboard") },
                    { href: "/agents", label: t("nav.my_agents") },
                  ]
                : [
                    { href: "/departamentos", label: t("navbar.ai_teams_label", { defaultValue: "Departamentos" }) },
                    { href: "/how-it-works", label: t("nav.how_it_works", { defaultValue: "Como funciona" }) },
                    { href: "/pricing", label: t("nav.pricing", { defaultValue: "Preços" }) },
                    { href: "/community", label: t("nav.community", { defaultValue: "Comunidade" }) },
                  ]
              ).map((item) => (
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

              {/* "Mais" · secundárias · só público */}
              {!user && (
                <div className="pt-3 mt-2 border-t border-border/30">
                  <p className="px-3 pb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                    {t("navbar.more", { defaultValue: "Mais" })}
                  </p>
                  {moreLinks.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="block px-3 py-2 rounded-lg text-[13px] text-muted-foreground hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
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
                      <PremiumCTAButton variant="red" size="sm" showArrow={false} className="w-full">
                        {t("auth.create_account")}
                      </PremiumCTAButton>
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
