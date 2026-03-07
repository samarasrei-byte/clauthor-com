import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, ArrowRight, Eye, EyeOff, Loader2, ShoppingCart } from "lucide-react";
import HelpTooltip from "@/components/HelpTooltip";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

export interface HireIntent {
  type: "agent" | "department" | "squad";
  label: string;
  // For agent: slug to hire from templates
  slugs?: string[];
  // For department: department id
  departmentId?: string;
}

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const { t } = useTranslation();
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { from?: { pathname: string }; hireIntent?: HireIntent; signup?: boolean } | null;
  const from = state?.from?.pathname || "/dashboard";
  const hireIntent = state?.hireIntent || null;

  // If redirected with signup=true, show signup form
  useEffect(() => {
    if (state?.signup) {
      setIsLogin(false);
    }
  }, [state?.signup]);

  // If user is already logged in, redirect immediately
  useEffect(() => {
    if (user) {
      if (hireIntent) {
        // Store intent for post-login processing
        localStorage.setItem("hireIntent", JSON.stringify(hireIntent));
      }
      navigate(from, { replace: true });
    }
  }, [user, from, hireIntent, navigate]);

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
          // Redirect after signup (auto-confirm is enabled)
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      toast.error(t("auth.error_generic"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 -mt-16 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 blur-[150px] rounded-full" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Bot className="h-8 w-8 text-primary" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold mb-2">{isLogin ? t("auth.welcome") : t("auth.create_account")}</h1>
          <p className="text-muted-foreground">
            {isLogin ? t("auth.login_subtitle") : t("auth.register_subtitle")}
            {" "}<HelpTooltip id="auth-intro" text={t("auth.help_tooltip", { defaultValue: "Crie sua conta ou faça login para acessar o painel de controle, contratar agentes e gerenciar seu time de IA." })} position="bottom" size={14} />
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

        <div className="glass-card rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("auth.full_name")}</Label>
                <Input placeholder={t("auth.your_name")} value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 bg-background/50 border-white/10 rounded-xl focus:border-primary/50 transition-colors" required />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("auth.email")}</Label>
              <Input type="email" placeholder={t("auth.your_email")} value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-background/50 border-white/10 rounded-xl focus:border-primary/50 transition-colors" required />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("auth.password")}</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-background/50 border-white/10 rounded-xl pr-12 focus:border-primary/50 transition-colors" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 glow font-semibold rounded-xl shine group" disabled={isLoading}>
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
                className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {t("auth.forgot_password", { defaultValue: "Esqueceu sua senha?" })}
              </button>
            )}
          </form>
          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? t("auth.no_account") : t("auth.has_account")}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">
                {isLogin ? t("auth.register_link") : t("auth.login_link")}
              </button>
            </p>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">{t("auth.terms_agree")}</p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
