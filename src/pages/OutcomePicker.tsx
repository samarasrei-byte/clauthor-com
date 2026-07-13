/**
 * OutcomePicker.tsx - Nova porta de entrada baseada em RESULTADO, não em catálogo.
 * Rota: /outcomes
 * O usuário descreve o que quer alcançar; Thor recomenda o time.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Target, TrendingUp, Users, MessageCircle, Zap } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Outcome {
  id: string;
  icon: typeof Target;
  title: string;
  description: string;
  suggestedFilter: string;
}

const PRESETS: Outcome[] = [
  {
    id: "leads",
    icon: TrendingUp,
    title: "Capturar mais leads qualificados",
    description: "Prospecção ativa em LinkedIn + qualificação automática",
    suggestedFilter: "Vendas",
  },
  {
    id: "support",
    icon: MessageCircle,
    title: "Atender clientes 24/7 sem equipe",
    description: "WhatsApp + e-mail + FAQ inteligente sempre online",
    suggestedFilter: "Atendimento",
  },
  {
    id: "content",
    icon: Sparkles,
    title: "Produzir conteúdo em escala",
    description: "Posts, artigos e roteiros com sua voz de marca",
    suggestedFilter: "Marketing",
  },
  {
    id: "ops",
    icon: Users,
    title: "Automatizar operação repetitiva",
    description: "Cobrança, follow-up, relatórios semanais no automático",
    suggestedFilter: "Operações",
  },
];

const OutcomePicker = () => {
  const navigate = useNavigate();
  const [freeText, setFreeText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const handlePreset = (o: Outcome) => {
    navigate(`/library?filter=${encodeURIComponent(o.suggestedFilter)}&outcome=${o.id}`);
  };

  const handleFreeText = async () => {
    if (!freeText.trim() || freeText.trim().length < 15) {
      toast.error("Descreva um pouco mais o resultado que você quer.");
      return;
    }
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("outcome-picker", {
        body: { goal: freeText.trim() },
      });
      if (error) throw error;
      const filter = data?.suggestedDepartment || "";
      toast.success(`Thor recomenda: ${data?.recommendation || "time completo"}`);
      navigate(`/library?filter=${encodeURIComponent(filter)}&goal=${encodeURIComponent(freeText.trim())}`);
    } catch (err) {
      toast.error("Não consegui interpretar. Tente escolher um dos exemplos acima.");
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background via-background to-primary/5 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-4">
            <Sparkles className="h-3 w-3" />
            Powered by Thor
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
            O que você quer <span className="text-primary">alcançar</span>?
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Não escolha agentes. Descreva o resultado · Thor monta o time por você.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          {PRESETS.map((o, i) => (
            <motion.button
              key={o.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              onClick={() => handlePreset(o)}
              className={cn(
                "group text-left rounded-xl border border-border/50 bg-card p-5",
                "hover:border-primary/50 hover:bg-primary/5 transition-all",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <o.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">
                    {o.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{o.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border/50 bg-card p-5"
        >
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Zap className="h-3 w-3" />
            Ou descreva com suas palavras
          </label>
          <Textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Ex: quero fechar 30% mais contratos por mês na minha clínica, sem contratar mais gente."
            className="min-h-[80px] resize-none bg-background border-border/40 text-sm"
            disabled={analyzing}
          />
          <div className="flex justify-end mt-3">
            <Button onClick={handleFreeText} disabled={analyzing || !freeText.trim()} size="sm">
              {analyzing ? "Analisando..." : "Recomendar time"}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </motion.div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/library")}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Prefiro navegar no catálogo completo →
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutcomePicker;
