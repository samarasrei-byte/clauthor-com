import { Outlet, Link, useNavigate } from "react-router-dom";
import { Bot, LogOut, Home, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSelector } from "@/components/LanguageSelector";

const DashboardLayout = () => {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Fixed top bar */}
      <header className="h-14 border-b border-white/[0.05] bg-background/80 backdrop-blur-2xl flex items-center justify-between px-4 sm:px-6 shrink-0 z-40">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <span className="font-display font-bold text-base text-foreground tracking-wider">PROMETHEUS</span>
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
          <LanguageSelector />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground gap-1.5 text-xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      {/* Below header: sidebar + scrollable content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
