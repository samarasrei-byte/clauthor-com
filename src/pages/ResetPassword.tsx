import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, ArrowRight, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t("auth.passwords_dont_match", { defaultValue: "As senhas não coincidem" }));
      return;
    }
    if (password.length < 6) {
      toast.error(t("auth.password_min", { defaultValue: "A senha deve ter pelo menos 6 caracteres" }));
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        setSuccess(true);
        toast.success(t("auth.password_updated", { defaultValue: "Senha atualizada com sucesso!" }));
        setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
      }
    } catch {
      toast.error(t("auth.error_generic", { defaultValue: "Erro inesperado" }));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <Bot className="h-12 w-12 text-primary mx-auto" />
          <h1 className="font-display text-2xl font-bold">{t("auth.invalid_link", { defaultValue: "Link inválido" })}</h1>
          <p className="text-muted-foreground">{t("auth.invalid_link_desc", { defaultValue: "Este link de redefinição é inválido ou expirou." })}</p>
          <Button onClick={() => navigate("/auth")}>{t("auth.back_to_login", { defaultValue: "Voltar ao login" })}</Button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto" />
          <h1 className="font-display text-2xl font-bold">{t("auth.password_updated", { defaultValue: "Senha atualizada!" })}</h1>
          <p className="text-muted-foreground">{t("auth.redirecting", { defaultValue: "Redirecionando..." })}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 -mt-16 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 blur-[150px] rounded-full" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">{t("auth.new_password", { defaultValue: "Nova senha" })}</h1>
          <p className="text-muted-foreground">{t("auth.new_password_desc", { defaultValue: "Digite sua nova senha abaixo" })}</p>
        </div>
        <div className="glass-card rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("auth.new_password", { defaultValue: "Nova senha" })}</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-background/50 border-white/10 rounded-xl pr-12" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("auth.confirm_password", { defaultValue: "Confirmar senha" })}</Label>
              <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 bg-background/50 border-white/10 rounded-xl" required minLength={6} />
            </div>
            <Button type="submit" className="w-full h-12 glow font-semibold rounded-xl shine group" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>{t("auth.update_password", { defaultValue: "Atualizar senha" })}<ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>)}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
