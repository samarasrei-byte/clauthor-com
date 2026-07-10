import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Bot, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Bot className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-display text-6xl font-bold mb-2 gradient-text">404</h1>
        <p className="text-lg text-muted-foreground mb-2">Página não encontrada</p>
        <p className="text-sm text-muted-foreground mb-8">
          A rota <code className="text-primary/70 bg-primary/5 px-2 py-0.5 rounded">{location.pathname}</code> não existe.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/">
            <Button className="glow gap-2">
              <Home className="h-4 w-4" /> Voltar ao Início
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" className="gap-2 border-white/10">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
