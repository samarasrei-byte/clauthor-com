import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "onboarding-banner-dismissed";

/**
 * Banner sticky no topo do dashboard para usuários que ainda não completaram
 * o diagnóstico em /welcome. Some após concluído ou dispensado nesta sessão.
 */
export default function OnboardingResumeBanner() {
  const { user, loading: authLoading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    try { setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1"); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarded_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) setNeedsOnboarding(!data?.onboarded_at);
    })();
    return () => { cancelled = true; };
  }, [authLoading, user]);

  if (!user || !needsOnboarding || dismissed) return null;

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <div className="relative z-30 border-b border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <p className="text-sm text-foreground flex-1 min-w-0">
          <span className="font-medium">Complete seu diagnóstico</span>
          <span className="text-muted-foreground hidden sm:inline"> — 60s para descobrir o agente ideal para sua dor.</span>
        </p>
        <Button asChild size="sm" className="gap-1.5 shrink-0">
          <Link to="/welcome">
            Começar <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <button
          onClick={dismiss}
          aria-label="Dispensar"
          className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
