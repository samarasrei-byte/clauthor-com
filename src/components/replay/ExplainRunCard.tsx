import { useState } from "react";
import { motion } from "framer-motion";
import { Diamond, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackKpi } from "@/lib/kpiTracker";

interface ExplainRunCardProps {
  runId: string;
}

export const ExplainRunCard = ({ runId }: ExplainRunCardProps) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState(false);

  const fetchExplanation = async (force = false) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("explain-run", {
        body: { run_id: runId, force },
      });
      if (error) throw error;
      const text = (data as { explanation?: string; cached?: boolean })?.explanation;
      if (!text) throw new Error("Sem narrativa");
      setExplanation(text);
      setCached(Boolean((data as { cached?: boolean })?.cached));
      trackKpi("replay_explained", { run_id: runId, cached: (data as { cached?: boolean })?.cached ?? false });
    } catch (err) {
      console.error("[ExplainRunCard]", err);
      toast.error("Não foi possível gerar a narrativa agora.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Diamond className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Explique este run</h3>
            <p className="text-xs text-muted-foreground">Narrativa gerada por IA a partir dos passos</p>
          </div>
        </div>
        {explanation && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchExplanation(true)}
            disabled={loading}
            className="h-7 gap-1 text-xs text-muted-foreground"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Regenerar
          </Button>
        )}
      </div>

      {!explanation && !loading && (
        <Button
          onClick={() => fetchExplanation(false)}
          size="sm"
          className="gap-1.5"
        >
          <Diamond className="h-3.5 w-3.5" />
          Gerar narrativa
        </Button>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analisando execução…
        </div>
      )}

      {explanation && !loading && (
        <div className="space-y-2">
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{explanation}</p>
          {cached && (
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Cache</p>
          )}
        </div>
      )}
    </motion.div>
  );
};
