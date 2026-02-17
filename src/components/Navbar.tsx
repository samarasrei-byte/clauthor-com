import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";
import prometheusLogo from "@/assets/prometheus-logo.png";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { t } = useTranslation();

  const publicNavItems = [
    { label: t("nav.library"), href: "/library" },
    { label: t("nav.pricing"), href: "/pricing" },
    { label: t("nav.how_it_works"), href: "/how-it-works" },
  ];

  const authNavItems = [
    { label: t("nav.dashboard"), href: "/dashboard" },
    { label: t("nav.my_agents"), href: "/agents" },
    { label: t("nav.library"), href: "/library" },
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
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={prometheusLogo} alt="PROMETHEUS" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-display font-bold text-base text-foreground tracking-wider">
              PROMETHEUS
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-1">
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
                <Shield className="h-3.5 w-3.5" />
                Admin
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector />
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut} 
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4 mr-2" />
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
                  <Button size="sm" className="glow font-medium rounded-lg">
                    {t("auth.create_account")}
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
                <Shield className="h-4 w-4" />
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
                   <LogOut className="h-4 w-4 mr-2" />
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
