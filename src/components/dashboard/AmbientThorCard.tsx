/**
 * AmbientThorCard.tsx
 * Home ambiente logada — mostra "Thor está rodando" em vez de dashboard vazio.
 * Puxa últimas ações do usuário (execution_logs) e apresenta como card proativo.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RecentAction {
  id: string;
  action: string;
  status: string;
  created_at: string;
  agent_name?: string;
}

interface Props {
  onOpenOmnix: () => void;
  onOpenLibrary: () => void;
}

const AmbientThorCard = ({ onOpenOmnix, onOpenLibrary }: Props) => {
  const { user } = useAuth();
  const [actions, setActions] = useState<RecentAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase
          .from("execution_logs")
          .select("id, action, status, created_at, agent:agents(name)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3);

        if (!mounted) return;
        setActions(
          (data || []).map((d: any) => ({
            id: d.id,
            action: d.action,
            status: d.status,
            created_at: d.created_at,
            agent_name: d.agent?.name,
          })),
        );
      } catch {
        // silent
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  const hasActivity = actions.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-6"
    >
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-primary/40 blur-md"
          />
          <div className="relative h-12 w-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold">Thor está ativo</h3>
            <Badge variant="outline" className="border-primary/30 text-primary text-[10px] gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              LIVE
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {loading
              ? "Sincronizando sua operação..."
              : hasActivity
                ? `Última hora: ${actions.length} ação${actions.length > 1 ? "ões" : ""} registrada${actions.length > 1 ? "s" : ""} pelos seus agentes.`
                : "Nenhuma ação ainda. Ative seu primeiro agente e Thor começa a rodar."}
          </p>

          {hasActivity && (
            <div className="space-y-1.5 mb-4">
              {actions.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-xs">
                  <CheckCircle2
                    className={cn(
                      "h-3.5 w-3.5 flex-shrink-0",
                      a.status === "success" ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="font-medium truncate">
                    {a.agent_name || "Agente"} · {a.action}
                  </span>
                  <span className="text-muted-foreground text-[10px] ml-auto flex-shrink-0">
                    {formatDistanceToNow(new Date(a.created_at), { locale: ptBR, addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={onOpenOmnix} className="h-8 rounded-lg">
              <Activity className="h-3.5 w-3.5 mr-1.5" />
              Ver o que Thor fez
            </Button>
            {!hasActivity && (
              <Button size="sm" variant="outline" onClick={onOpenLibrary} className="h-8 rounded-lg">
                Ativar primeiro agente <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AmbientThorCard;
