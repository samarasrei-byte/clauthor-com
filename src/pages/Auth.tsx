import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, ArrowRight, Eye, EyeOff, Loader2, ShoppingCart, Shield, Zap, Users, Scale, CheckCircle2 } from "lucide-react";
import HelpTooltip from "@/components/HelpTooltip";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export interface HireIntent {
  type: "agent" | "department" | "squad";
  label: string;
  slugs?: string[];
  departmentId?: string;
  /** Optional one-time setup fee in cents (charged on first billing cycle) */
  setupFee?: number;
  /** Optional monthly override in cents - bypasses pricing tier lookup */
  monthlyOverride?: number;
}

const AuthPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const { t } = useTranslation();
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { from?: { pathname: string }; hireIntent?: HireIntent; signup?: boolean } | null;

  // Parse URL search params (Block 2.3): /auth?redirect=/advocacia/onboarding&vertical=advocacia
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get("redirect");
  const verticalParam = searchParams.get("vertical");
  const modeParam = searchParams.get("mode"); // "signup" | "login"

  // Default para signup quando vem de "Create your account" (?mode=signup) ou via state.signup.
  const [isLogin, setIsLogin] = useState(() => !(modeParam === "signup" || state?.signup));

  const from = redirectParam || state?.from?.pathname || "/dashboard";
  const hireIntent = state?.hireIntent || null;

  // Block 2.1 + 2.2 — detect advocacia context (URL param, redirect target, or referrer)
  const isAdvocaciaContext =
    verticalParam === "advocacia" ||
    (redirectParam?.includes("/advocacia") ?? false) ||
    (state?.from?.pathname?.startsWith("/advocacia") ?? false) ||
    (typeof document !== "undefined" && document.referrer.includes("/advocacia"));

  useEffect(() => {
    if (state?.signup || modeParam === "signup") {
      setIsLogin(false);
    }
  }, [state?.signup, modeParam]);

  // Block 2.1 — page title based on context
  useEffect(() => {
    document.title = isAdvocaciaContext
      ? "Entrar | Clauthor Advocacia"
      : "Entrar | Clauthor";
  }, [isAdvocaciaContext]);

  useEffect(() => {
    if (user) {
      if (hireIntent) {
        localStorage.setItem("hireIntent", JSON.stringify(hireIntent));
      }
      navigate(from, { replace: true });
    }
  }, [user, from, hireIntent, navigate]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      if (hireIntent) {
        localStorage.setItem("hireIntent", JSON.stringify(hireIntent));
      }
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error(t("auth.google_error", { defaultValue: "Erro ao conectar com Google. Tente novamente." }));
      }
    } catch {
      toast.error(t("auth.error_generic"));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(t("auth.login_success"));
          if (hireIntent) {
            localStorage.setItem("hireIntent", JSON.stringify(hireIntent));
          }
          navigate(from, { replace: true });
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(t("auth.signup_success"));
          if (hireIntent) {
            localStorage.setItem("hireIntent", JSON.stringify(hireIntent));
          }
          // Novo usuário: sempre passa pelo diagnóstico em /welcome antes do dashboard,
          // exceto quando há um redirect explícito para outro fluxo (ex.: /advocacia).
          const signupDestination = redirectParam || state?.from?.pathname || "/welcome";
          navigate(signupDestination, { replace: true });
        }
      }
    } catch {
      toast.error(t("auth.error_generic"));
    } finally {
      setIsLoading(false);
    }
  };

  const trustSignals = [
    { icon: Shield, text: t("auth.trust_secure", { defaultValue: "Dados criptografados" }) },
    { icon: Zap, text: t("auth.trust_fast", { defaultValue: "Acesso em segundos" }) },
    { icon: Users, text: t("auth.trust_companies", { defaultValue: "Empresas confiam" }) },
  ];

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 -mt-16 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 blur-[150px] rounded-full" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            {isAdvocaciaContext ? <Scale className="h-7 w-7 text-primary" /> : <Bot className="h-7 w-7 text-primary" />}
          </motion.div>
          {isAdvocaciaContext && (
            <Badge className="mb-3 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/15 gap-1.5">
              <CheckCircle2 className="h-3 w-3" />
              Squad Jurídico Ativo
            </Badge>
          )}
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">
            {isAdvocaciaContext
              ? "Acesse sua área jurídica"
              : isLogin ? t("auth.welcome") : t("auth.create_account")}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {isAdvocaciaContext
              ? "Seus agentes de advocacia estão esperando por você."
              : isLogin
              ? t("auth.login_subtitle")
              : t("auth.register_subtitle_enhanced", { defaultValue: "Crie sua conta gratuita e tenha acesso imediato a 200 agentes de IA." })}
          </p>
        </div>

        {/* Show hire intent banner */}
        {hireIntent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/15 flex items-center gap-3"
          >
            <ShoppingCart className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">
                {hireIntent.type === "department" ? t("auth.department_selected", { defaultValue: "Departamento selecionado" }) : t("auth.agent_selected", { defaultValue: "Agente selecionado" })}
              </p>
              <p className="text-sm font-semibold text-foreground truncate">{hireIntent.label}</p>
            </div>
            <Badge variant="outline" className="shrink-0 border-primary/20 text-primary text-[10px]">
              {t("auth.auto_hire", { defaultValue: "Auto-contrata" })}
            </Badge>
          </motion.div>
        )}

        <div className="glass-card rounded-2xl p-6 sm:p-8">
          {/* Google OAuth - primary action */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full h-12 rounded-xl gap-3 border-border/40 hover:bg-accent/50 mb-5 text-sm font-medium"
          >
            {isGoogleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {t("auth.google_signin", { defaultValue: "Continuar com Google" })}
          </Button>

          <div className="flex items-center gap-3 mb-5">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">{t("auth.or_email", { defaultValue: "ou com e-mail" })}</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">{t("auth.full_name")}</Label>
                <Input placeholder={t("auth.your_name")} value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11 bg-background/50 border-border/40 rounded-xl focus:border-primary/50 transition-colors" required autoFocus={!isLogin} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">{t("auth.email")}</Label>
              <Input type="email" placeholder={t("auth.your_email")} value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 bg-background/50 border-border/40 rounded-xl focus:border-primary/50 transition-colors" required autoFocus={isLogin} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">{t("auth.password")}</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 bg-background/50 border-border/40 rounded-xl pr-12 focus:border-primary/50 transition-colors" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11 glow font-semibold rounded-xl group" disabled={isLoading || isGoogleLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>{isLogin ? t("auth.login") : t("auth.register")}<ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>)}
            </Button>
            {isLogin && (
              <button
                type="button"
                onClick={async () => {
                  if (!email) { toast.error(t("auth.enter_email_first", { defaultValue: "Digite seu e-mail primeiro" })); return; }
                  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
                  if (error) toast.error(error.message);
                  else toast.success(t("auth.reset_email_sent", { defaultValue: "E-mail de redefinição enviado! Verifique sua caixa de entrada." }));
                }}
                className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {t("auth.forgot_password", { defaultValue: "Esqueceu sua senha?" })}
              </button>
            )}
          </form>
          <div className="mt-5 pt-5 border-t border-border/30 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? t("auth.no_account") : t("auth.has_account")}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">
                {isLogin ? t("auth.register_link") : t("auth.login_link")}
              </button>
            </p>
          </div>
        </div>

        {/* Trust signals below card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-4 sm:gap-6 mt-6"
        >
          {trustSignals.map((signal) => (
            <div key={signal.text} className="flex items-center gap-1.5">
              <signal.icon className="h-3 w-3 text-muted-foreground/50" strokeWidth={1.5} />
              <span className="text-[10px] text-muted-foreground/50">{signal.text}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
