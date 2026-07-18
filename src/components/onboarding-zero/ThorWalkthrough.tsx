import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Bubble {
  text: string;
  highlight?: string; // data-tour attribute to spotlight (optional)
}

const BUBBLES: Bubble[] = [
  { text: "Oi! Sou o Thor. Em 60 segundos você aprende a usar tudo — sem termos técnicos, prometo." },
  { text: "Este é o seu Command Center. Aqui você comanda, a IA executa. Você não precisa fazer nada operacional — só aprovar." },
  { text: "Veja o menu à esquerda destacado. Cada item é um setor da sua empresa. Clique no primeiro item quando quiser entrar.", highlight: "nav-overview" },
  { text: "Aqui aparecem seus agentes de IA — cada um com nome, função e memória própria, como um funcionário digital.", highlight: "nav-agents" },
  { text: "Central de Aprovações: tudo que os agentes produzem (posts, propostas, vídeos) chega aqui pra você aprovar com 👍 ou 👎.", highlight: "nav-approvals" },
  { text: "Video Studio: crie vídeos com IA, corte vídeos longos em Shorts/Reels automaticamente e poste nas redes conectadas.", highlight: "nav-video" },
  { text: "Precisa de ajuda a qualquer momento? Clique no T (Thor) no rodapé que eu abro um chat pra resolver junto com você." },
];

/**
 * Tela 4 · Walkthrough conversacional do Thor no painel.
 * Substitui o DashboardTour de tooltips por uma apresentação com blur + 3 balões.
 * Auto-avanço em 6s ou toque para pular. Marca walkthrough_completed=true no perfil.
 */
export default function ThorWalkthrough({ onFinish }: { onFinish?: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [idx, setIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-walkthrough", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("walkthrough_completed")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data as { walkthrough_completed?: boolean } | null;
    },
    enabled: !!user,
    staleTime: Infinity,
  });

  const complete = useCallback(async () => {
    setDismissed(true);
    if (user) {
      await supabase
        .from("profiles")
        .update({ walkthrough_completed: true, tour_completed: true } as never)
        .eq("user_id", user.id);
      queryClient.invalidateQueries({ queryKey: ["profile-walkthrough"] });
      queryClient.invalidateQueries({ queryKey: ["profile-tour"] });
    }
    onFinish?.();
  }, [user, queryClient, onFinish]);

  useEffect(() => {
    if (dismissed || isLoading || profile?.walkthrough_completed) return;
    if (idx >= BUBBLES.length) return;
    const t = setTimeout(() => setIdx((p) => p + 1), 7500);
    return () => clearTimeout(t);
  }, [idx, dismissed, isLoading, profile?.walkthrough_completed]);

  if (isLoading || dismissed || profile?.walkthrough_completed) return null;

  const showFinal = idx >= BUBBLES.length;
  const current = BUBBLES[idx];

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-6">
      {/* Backdrop with heavy blur so the dashboard fades behind */}
      <button
        type="button"
        aria-label="Pular apresentação"
        onClick={complete}
        className="absolute inset-0 bg-background/60 backdrop-blur-xl cursor-default"
      />

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Thor orb */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mx-auto mb-8 w-20 h-20 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/40 flex items-center justify-center relative"
          aria-hidden
        >
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <span className="relative font-display text-2xl font-bold text-primary">T</span>
        </motion.div>

        <AnimatePresence mode="wait">
          {showFinal ? (
            <motion.div
              key="final"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-8 leading-tight">
                Pronto pra <span className="text-primary">ativar seu time?</span>
              </h2>
              <button
                type="button"
                onClick={complete}
                className="inline-flex items-center gap-2 h-14 px-8 rounded-full bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-all"
              >
                Ativar agora <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <p className="font-display text-2xl sm:text-3xl font-medium text-foreground leading-snug mb-8">
                {current.text}
              </p>
              <div className="flex items-center justify-center gap-2 mb-6" aria-hidden>
                {BUBBLES.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-primary" : "w-1.5 bg-muted/40"}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIdx((p) => p + 1)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Toque para continuar <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <div className="mt-8">
                <button
                  type="button"
                  onClick={complete}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pular apresentação
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
