import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Linkedin, CheckCircle2, ArrowRight, Loader2, LogOut, Shield, Zap, Lock, Sparkles } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      {/* Ambient gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-20 -right-40 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="relative p-4 md:p-8 max-w-4xl mx-auto space-y-8">
        <HunterStepper current={1} />

        {/* Hero header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-card/40 backdrop-blur-sm text-[11px] font-medium text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            Passo 1 de 4 · Conexão segura
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Conecte seu LinkedIn
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
            O Hunter usa o login oficial do LinkedIn (OAuth 2.0) para prospectar com segurança em seu nome. Sem cookies, sem extensões, sem risco de banimento.
          </p>
        </div>

        {isConnected ? (
          <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden animate-fade-in">
            {/* Connected header */}
            <div className="relative p-6 md:p-8 border-b border-border/60 bg-gradient-to-br from-emerald-500/[0.04] to-transparent">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16 ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-background">
                    <AvatarImage src={session.profile_avatar_url} />
                    <AvatarFallback className="text-lg font-medium">
                      {(session.profile_name || "L").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-400">
                      Conectado
                    </span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                    <span className="text-[10px] text-muted-foreground">OAuth 2.0</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground truncate">
                    {session.profile_name || "Perfil LinkedIn"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pronto para iniciar prospecção automatizada
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={busy}
                  className="gap-1.5 text-muted-foreground hover:text-foreground h-8 text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Desconectar
                </Button>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 divide-x divide-border/60">
              {[
                { label: "Status", value: "Ativo", accent: "text-emerald-600 dark:text-emerald-400" },
                { label: "Permissões", value: "4 escopos", accent: "text-foreground" },
                { label: "Próximo passo", value: "ICP", accent: "text-primary" },
              ].map((s) => (
                <div key={s.label} className="px-6 py-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{s.label}</p>
                  <p className={`text-sm font-semibold mt-1 ${s.accent}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Action footer */}
            <div className="p-5 md:p-6 bg-muted/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Tudo certo. Vamos definir seu cliente ideal.
              </div>
              <Button onClick={() => navigate("/hunter-icp")} className="gap-2 rounded-full">
                Continuar <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-[1.2fr_1fr] gap-5 animate-fade-in">
            {/* Main connect card */}
            <div className="relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[#0A66C2]/10 border border-[#0A66C2]/20 flex items-center justify-center">
                    <Linkedin className="w-6 h-6 text-[#0A66C2]" />
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">OAuth 2.0</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">
                    Autorize com um clique
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Você será redirecionado para o LinkedIn. Após autorizar, voltamos aqui automaticamente com sua conta conectada.
                  </p>
                </div>

                <ul className="space-y-2.5">
                  {[
                    "Login oficial pelo LinkedIn (sem senhas armazenadas)",
                    "Tokens criptografados, revogáveis a qualquer momento",
                    "Conformidade total com termos de uso",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={handleConnect}
                  disabled={busy}
                  size="lg"
                  className="w-full gap-2 h-12 rounded-xl bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white shadow-lg shadow-[#0A66C2]/20 transition-all"
                >
                  {busy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecionando para o LinkedIn...
                    </>
                  ) : (
                    <>
                      <Linkedin className="w-4 h-4" />
                      Conectar com LinkedIn
                    </>
                  )}
                </Button>

                <p className="text-[10px] text-center text-muted-foreground">
                  Ao continuar, você concorda em compartilhar seus dados públicos do LinkedIn com o Hunter.
                </p>
              </div>
            </div>

            {/* Side benefits */}
            <div className="space-y-3">
              {[
                {
                  icon: Shield,
                  title: "Seguro por design",
                  desc: "Não pedimos cookies li_at nem instalamos extensões. Apenas o fluxo oficial.",
                  color: "text-emerald-500",
                  bg: "bg-emerald-500/5",
                  border: "border-emerald-500/20",
                },
                {
                  icon: Zap,
                  title: "Setup em 30 segundos",
                  desc: "Um clique, autorize no LinkedIn, e o Hunter está pronto para prospectar.",
                  color: "text-amber-500",
                  bg: "bg-amber-500/5",
                  border: "border-amber-500/20",
                },
                {
                  icon: Lock,
                  title: "Você no controle",
                  desc: "Desconecte quando quiser. Tokens são apagados imediatamente.",
                  color: "text-blue-500",
                  bg: "bg-blue-500/5",
                  border: "border-blue-500/20",
                },
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.title}
                    className={`rounded-xl border ${b.border} ${b.bg} p-4 backdrop-blur-sm transition-all hover:scale-[1.01]`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-4 h-4 ${b.color} flex-shrink-0 mt-0.5`} strokeWidth={2} />
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-foreground">{b.title}</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{b.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Trust strip */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t border-border/40">
          {["LinkedIn Partner API", "OAuth 2.0", "GDPR Ready", "SOC 2"].map((badge) => (
            <span key={badge} className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 font-medium">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HunterLinkedIn;
