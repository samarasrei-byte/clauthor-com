import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Building2, CheckCircle2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PostSignupOnboardingProps {
  onComplete: () => void;
}

const PostSignupOnboarding = ({ onComplete }: PostSignupOnboardingProps) => {
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [saving, setSaving] = useState(false);

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "CEO";

  const handleFinish = async () => {
    setSaving(true);
    try {
      if (companyName.trim()) {
        await supabase.from("profiles").upsert({
          user_id: user!.id,
          company_name: companyName.trim(),
          full_name: user?.user_metadata?.full_name || null,
        }, { onConflict: "user_id" });
      }
    } catch (e) {
      console.error("Profile update:", e);
    }

    if (user) {
      localStorage.setItem(`clauthor_onboarding_done_${user.id}`, "true");
    }
    setSaving(false);
    onComplete();
    toast.success("Bem-vindo à CLAUTHOR! 🚀");
  };

  const handleSkip = () => {
    if (user) {
      localStorage.setItem(`clauthor_onboarding_done_${user.id}`, "true");
    }
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] bg-background overflow-hidden flex items-center justify-center"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 blur-[200px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", damping: 20 }}
        className="relative z-10 w-full max-w-md px-6 text-center space-y-8"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2, damping: 12 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto border border-primary/10"
        >
          <Sparkles className="h-7 w-7 text-primary" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <h1 className="font-display text-2xl sm:text-3xl font-bold">
            Bem-vindo, {userName}! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Só uma coisa rápida antes de começar
          </p>
        </motion.div>

        {/* Company input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span>Nome da sua empresa (opcional)</span>
          </div>
          <Input
            placeholder="Ex: Minha Empresa Ltda"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="h-12 text-center text-base text-foreground bg-muted/50 border-border rounded-xl focus:border-primary/40 placeholder:text-muted-foreground"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleFinish()}
          />
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="space-y-3"
        >
          <Button
            onClick={handleFinish}
            disabled={saving}
            className="w-full h-12 glow rounded-xl gap-2 text-sm font-semibold"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                Entrar no Painel
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Pular →
          </Button>
        </motion.div>

        {/* Trust signal */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-[10px] text-muted-foreground/40"
        >
          Seus dados estão seguros e protegidos
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default PostSignupOnboarding;