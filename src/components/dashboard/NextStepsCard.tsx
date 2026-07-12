import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, ArrowRight, Upload, Link2, MessageCircle, X, Diamond } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingAnswers } from "@/hooks/useGuidedOnboarding";

const HIDDEN_KEY = "clauthor_next_steps_hidden";

interface Step {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  cta: string;
  onClick: () => void;
  done?: boolean;
}

const NextStepsCard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<OnboardingAnswers | null>(null);
  const [hidden, setHidden] = useState(() => localStorage.getItem(HIDDEN_KEY) === "1");
  const [progress, setProgress] = useState({ files: false, integration: false });

  useEffect(() => {
    if (!user || hidden) return;
    let cancelled = false;
    (async () => {
      const [{ data: profile }, { count: filesCount }, { count: integrationsCount }] = await Promise.all([
        supabase.from("profiles").select("onboarding_answers").eq("user_id", user.id).maybeSingle(),
        supabase.from("knowledge_documents").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("agent_credentials").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      if (cancelled) return;
      if (profile?.onboarding_answers) {
        setAnswers(profile.onboarding_answers as unknown as OnboardingAnswers);
      }
      setProgress({ files: (filesCount ?? 0) > 0, integration: (integrationsCount ?? 0) > 0 });
    })();
    return () => { cancelled = true; };
  }, [user, hidden]);

  if (hidden || !answers) return null;

  const marketingLike = answers.department === "marketing" || answers.teamGoal === "conteudo" || answers.agentArea === "marketing";

  const steps: Step[] = [
    {
      id: "files",
      title: "Envie arquivos da sua empresa",
      desc: "Documentos, decks e planilhas para os agentes entenderem seu contexto.",
      icon: Upload,
      cta: "Enviar agora",
      onClick: () => navigate("/knowledge-base"),
      done: progress.files,
    },
    ...(marketingLike ? [{
      id: "integration",
      title: "Conecte Instagram e LinkedIn",
      desc: "Para o time de marketing publicar e medir resultados diretamente.",
      icon: Link2,
      cta: "Conectar contas",
      onClick: () => navigate("/integrations"),
      done: progress.integration,
    }] : [{
      id: "integration",
      title: "Configure suas integrações",
      desc: "Conecte as ferramentas que sua operação já usa.",
      icon: Link2,
      cta: "Ver integrações",
      onClick: () => navigate("/integrations"),
      done: progress.integration,
    }]),
    {
      id: "thor",
      title: "Fale com Thor",
      desc: "Seu orquestrador tira dúvidas e sugere o próximo passo.",
      icon: MessageCircle,
      cta: "Abrir chat",
      onClick: () => window.dispatchEvent(new CustomEvent("thor:open")),
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount >= 2) return null;

  const pathLabel =
    answers.path === "team" ? "seu time"
    : answers.path === "department" ? `o departamento de ${answers.department ?? ""}`
    : "seu agente";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] via-card to-card p-5 relative overflow-hidden"
    >
      <button
        onClick={() => { localStorage.setItem(HIDDEN_KEY, "1"); setHidden(true); }}
        className="absolute top-3 right-3 text-muted-foreground/60 hover:text-foreground transition-colors"
        aria-label="Ocultar"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 mb-1">
        <Diamond className="h-4 w-4 text-primary" />
        <p className="text-[11px] font-mono uppercase tracking-wider text-primary">Próximos passos</p>
      </div>
      <h3 className="font-display text-lg font-bold leading-tight capitalize">
        Agora que {pathLabel} está a caminho…
      </h3>
      <p className="text-sm text-muted-foreground mt-1">Três passos rápidos para deixar tudo redondo.</p>

      <div className="grid gap-2.5 mt-4 md:grid-cols-3">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={s.onClick}
              className={cn(
                "text-left p-3.5 rounded-xl border transition-all group",
                s.done
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-border bg-background/50 hover:border-primary/40 hover:bg-primary/[0.03]"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  s.done ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-primary/10 text-primary"
                )}>
                  {s.done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                {!s.done && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />}
              </div>
              <p className="text-sm font-semibold leading-tight">{s.title}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{s.desc}</p>
              {!s.done && <p className="text-[11px] text-primary mt-2 font-medium">{s.cta} →</p>}
              {s.done && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">Concluído</p>}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default NextStepsCard;
