import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Linkedin, CheckCircle2, ArrowRight, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import HunterStepper from "@/components/hunter/HunterStepper";

const REDIRECT_PATH = "/hunter-linkedin";

const HunterLinkedIn = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadSession = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("hunter_linkedin_session")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setSession(data);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      await loadSession();
      setLoading(false);
    })();
  }, [user]);

  // Handle OAuth callback (?code=...)
  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    if (error) {
      toast.error(searchParams.get("error_description") || "LinkedIn negou a autorização");
      setSearchParams({}, { replace: true });
      return;
    }
    if (!code || !user) return;
    (async () => {
      setBusy(true);
      const redirect_uri = `${window.location.origin}${REDIRECT_PATH}`;
      const { data, error: fnErr } = await supabase.functions.invoke("hunter-linkedin-oauth", {
        body: { action: "callback", code, redirect_uri },
      });
      setBusy(false);
      setSearchParams({}, { replace: true });
      if (fnErr || !data?.success) {
        toast.error(fnErr?.message || "Falha ao conectar LinkedIn");
        return;
      }
      toast.success("LinkedIn conectado!");
      await loadSession();
    })();
  }, [searchParams, user]);

  const handleConnect = async () => {
    setBusy(true);
    const redirect_uri = `${window.location.origin}${REDIRECT_PATH}`;
    const { data, error } = await supabase.functions.invoke("hunter-linkedin-oauth", {
      body: { action: "authorize", redirect_uri },
    });
    if (error || !data?.url) {
      setBusy(false);
      toast.error(error?.message || "Falha ao iniciar OAuth");
      return;
    }
    window.location.href = data.url;
  };

  const handleDisconnect = async () => {
    setBusy(true);
    const { error } = await supabase.functions.invoke("hunter-linkedin-oauth", {
      body: { action: "disconnect" },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("LinkedIn desconectado");
    setSession(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isConnected = !!session?.access_token;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <HunterStepper current={1} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-primary" /> Passo 1 — Conectar LinkedIn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg border border-green-500/30 bg-green-500/5">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                <Avatar className="h-12 w-12">
                  <AvatarImage src={session.profile_avatar_url} />
                  <AvatarFallback>{(session.profile_name || "L").charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">LinkedIn conectado</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {session.profile_name || "Perfil ativo"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={busy}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Desconectar
                </Button>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => navigate("/hunter-icp")} className="gap-2">
                  Próximo: definir ICP <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5 text-center py-6">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Linkedin className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Conecte sua conta do LinkedIn</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Autorize o Hunter via LinkedIn de forma segura. Nenhum dado sensível é solicitado — usamos o login oficial.
                </p>
              </div>
              <Button onClick={handleConnect} disabled={busy} size="lg" className="gap-2">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Linkedin className="w-4 h-4" />}
                {busy ? "Redirecionando..." : "Conectar LinkedIn"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HunterLinkedIn;
