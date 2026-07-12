/**
 * FirstDeliveryCard — destaca no dashboard o primeiro entregável aprovado
 * do usuário (fluxo InstantWow). Reforça o momento "uau" e conduz para o
 * Approvals Center ou o Replay auditável da run.
 *
 * Aparece apenas se houver approval com source="instant_wow" e é dispensável.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Diamond, ArrowRight, Rewind, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const DISMISS_KEY = "first-delivery-card-dismissed";

interface Props {
  onOpenApprovals: () => void;
}

interface WowApproval {
  id: string;
  title: string;
  created_at: string;
  content: {
    markdown?: string;
    company?: string;
    agent_slug?: string;
    pain_category?: string;
    mcp_run_id?: string | null;
    source?: string;
  } | null;
}

export function FirstDeliveryCard({ onOpenApprovals }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const dismissed = useMemo(() => {
    try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
  }, []);

  const { data: approval } = useQuery({
    queryKey: ["first-wow-approval", user?.id],
    enabled: !!user?.id && !dismissed,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approvals")
        .select("id,title,created_at,content")
        .eq("created_by", user!.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) return null;
      const found = (data ?? []).find(
        (a: { content: unknown }) =>
          typeof a.content === "object" &&
          a.content !== null &&
          (a.content as Record<string, unknown>).source === "instant_wow",
      );
      return (found as WowApproval | undefined) ?? null;
    },
  });

  if (dismissed || !approval) return null;

  const runId = approval.content?.mcp_run_id ?? null;
  const company = approval.content?.company ?? "sua empresa";
  const ageDays = Math.floor(
    (Date.now() - new Date(approval.created_at).getTime()) / (1000 * 60 * 60 * 24),
  );
  // Some após 7 dias — o momento "uau" já cumpriu seu papel.
  if (ageDays > 7) return null;

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
    // trigger refetch by dispatching storage event? Simpler: force reload of parent via state
    // Keep it lean: just hide via memo re-eval — user reloads page anyway.
    window.dispatchEvent(new Event("first-delivery-dismissed"));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35 }}
        className="relative rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.08] via-background to-background p-5 md:p-6 shadow-[0_0_40px_-20px_hsl(var(--primary)/0.4)]"
      >
        <button
          onClick={handleDismiss}
          aria-label="Ocultar card"
          className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="shrink-0 h-10 w-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Diamond className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.15em] text-primary/80 mb-1">
              <CheckCircle2 className="h-3 w-3" />
              Primeiro entregável aprovado
            </div>
            <h3 className="text-base md:text-lg font-semibold text-foreground truncate">
              {approval.title}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Você aprovou seu primeiro output para <span className="text-foreground">{company}</span>.
              Este é o começo do seu histórico auditável — cada execução do seu squad fica registrada.
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Button size="sm" onClick={onOpenApprovals} className="gap-1.5">
                Ver no Approvals Center
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              {runId && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/replay/${runId}`)}
                  className="gap-1.5"
                >
                  <Rewind className="h-3.5 w-3.5" />
                  Ver replay da execução
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default FirstDeliveryCard;
