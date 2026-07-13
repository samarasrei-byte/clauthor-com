/**
 * SimulationDialog.tsx
 * Sandbox de simulação · antes de contratar, o usuário vê projeção de 30 dias
 * do agente rodando com dados dele. Prova de ROI em 5 minutos.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlayCircle, TrendingUp, Zap, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Projection {
  headline: string;
  actionsPerDay: number;
  outcomesPerMonth: string;
  savings_brl: string;
  confidence: "baixa" | "média" | "alta";
  assumptions: string[];
  risks: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentSlug: string;
  agentName: string;
  onHire?: () => void;
}

const SimulationDialog = ({ open, onOpenChange, agentSlug, agentName, onHire }: Props) => {
  const [context, setContext] = useState("");
  const [running, setRunning] = useState(false);
  const [projection, setProjection] = useState<Projection | null>(null);
  const [simulationId, setSimulationId] = useState<string | null>(null);

  const handleRun = async () => {
    if (!context.trim() || context.trim().length < 20) {
      toast.error("Descreva um pouco mais seu contexto (mín. 20 chars).");
      return;
    }
    setRunning(true);
    setProjection(null);
    try {
      const { data, error } = await supabase.functions.invoke("simulate-agent", {
        body: { agentSlug, agentName, context: context.trim() },
      });
      if (error) throw error;
      setProjection(data);

      // Persist simulation (best-effort; ignore if user is anonymous)
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const { data: row } = await supabase
          .from("simulations")
          .insert({
            user_id: auth.user.id,
            agent_slug: agentSlug,
            agent_name: agentName,
            context: context.trim(),
            projection: data,
          })
          .select("id")
          .single();
        if (row) setSimulationId(row.id);
      }
    } catch (err) {
      toast.error("Simulação falhou. Tente novamente.");
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const handleHire = async () => {
    if (simulationId) {
      await supabase
        .from("simulations")
        .update({ converted_to_hire: true })
        .eq("id", simulationId);
    }
    onHire?.();
  };

  const reset = () => {
    setContext("");
    setProjection(null);
    setSimulationId(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            Simular 30 dias · {agentName}
          </DialogTitle>
          <DialogDescription>
            Veja a projeção do agente rodando no seu negócio antes de contratar.
          </DialogDescription>
        </DialogHeader>

        {!projection && (
          <div className="space-y-3">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Descreva seu negócio (setor, tamanho, volume atual)
            </label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Ex: clínica de estética em SP, 3 atendentes, ~200 mensagens/dia no WhatsApp, ~15 leads/dia."
              className="min-h-[110px]"
              disabled={running}
            />
            <Button onClick={handleRun} disabled={running || !context.trim()} className="w-full">
              {running ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Simulando...</>
              ) : (
                <><Zap className="h-4 w-4 mr-2" /> Rodar simulação</>
              )}
            </Button>
          </div>
        )}

        {projection && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-start gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm font-semibold">{projection.headline}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-background/60 p-2.5">
                  <p className="text-muted-foreground text-[10px] uppercase mb-0.5">Ações/dia</p>
                  <p className="text-base font-bold text-primary">{projection.actionsPerDay}</p>
                </div>
                <div className="rounded-lg bg-background/60 p-2.5">
                  <p className="text-muted-foreground text-[10px] uppercase mb-0.5">Resultado/mês</p>
                  <p className="text-sm font-bold">{projection.outcomesPerMonth}</p>
                </div>
                <div className="rounded-lg bg-background/60 p-2.5">
                  <p className="text-muted-foreground text-[10px] uppercase mb-0.5">Economia</p>
                  <p className="text-sm font-bold text-primary">{projection.savings_brl}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] capitalize">
                  Confiança: {projection.confidence}
                </Badge>
              </div>
            </div>

            {projection.assumptions?.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground mb-1.5">Premissas</p>
                <ul className="space-y-1">
                  {projection.assumptions.slice(0, 4).map((a, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-primary/60 mt-0.5 flex-shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-border/40">
              <Button variant="outline" onClick={reset} className="flex-1">
                Nova simulação
              </Button>
              {onHire && (
                <Button onClick={handleHire} className="flex-1">
                  Contratar agora <TrendingUp className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SimulationDialog;
