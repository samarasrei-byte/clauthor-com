import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldAlert, Clock, CheckCircle2, XCircle, AlertTriangle, Zap } from "lucide-react";

interface PendingAction {
  id: string;
  agent_id: string | null;
  action_type: string;
  risk_level: string;
  title: string;
  description: string;
  payload: any;
  status: string;
  created_at: string;
  expires_at: string | null;
}

const riskConfig = {
  low: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: Zap, label: "Baixo" },
  medium: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: AlertTriangle, label: "Médio" },
  high: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: ShieldAlert, label: "Alto" },
  critical: { color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: ShieldAlert, label: "Crítico" },
};

export function PendingActionsPanel() {
  const { user } = useAuth();
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchPending();

    // Realtime subscription
    const channel = supabase
      .channel("pending-actions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pending_actions", filter: `user_id=eq.${user.id}` },
        () => fetchPending()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchPending = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("pending_actions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20);
    setActions((data as PendingAction[] | null) || []);
    setLoading(false);
  };

  const handleDecision = async (actionId: string, decision: "approved" | "rejected") => {
    setProcessingId(actionId);
    try {
      const { error } = await supabase
        .from("pending_actions")
        .update({
          status: decision,
          decided_at: new Date().toISOString(),
          decided_by: user?.id,
          rejection_reason: decision === "rejected" ? rejectionReason[actionId] || null : null,
        })
        .eq("id", actionId);

      if (error) throw error;

      toast.success(decision === "approved" ? "✅ Ação aprovada e executada!" : "❌ Ação rejeitada");

      // Log the decision
      const action = actions.find(a => a.id === actionId);
      if (action) {
        await supabase.from("execution_logs").insert({
          agent_id: action.agent_id || "00000000-0000-0000-0000-000000000000",
          user_id: user!.id,
          action: `autonomy_${decision}`,
          status: decision === "approved" ? "success" : "rejected",
          details: {
            pending_action_id: actionId,
            action_type: action.action_type,
            risk_level: action.risk_level,
            rejection_reason: rejectionReason[actionId] || null,
          },
        });
      }

      setActions(prev => prev.filter(a => a.id !== actionId));
    } catch (err) {
      toast.error("Erro ao processar decisão");
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading || actions.length === 0) return null;

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-red-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5 text-amber-400" />
          Ações Pendentes
          <Badge variant="outline" className="ml-auto bg-amber-500/20 text-amber-400 border-amber-500/30">
            {actions.length}
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Seus agentes querem executar estas ações. Aprove ou rejeite.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="max-h-[400px]">
          <AnimatePresence mode="popLayout">
            {actions.map((action) => {
              const risk = riskConfig[action.risk_level as keyof typeof riskConfig] || riskConfig.high;
              const RiskIcon = risk.icon;
              const isExpired = action.expires_at && new Date(action.expires_at) < new Date();

              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="mb-3 rounded-lg border border-border/50 bg-card/50 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      <RiskIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{action.title}</p>
                        {action.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{action.description}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${risk.color}`}>
                      {risk.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(action.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    {isExpired && <Badge variant="destructive" className="text-[9px] ml-1">Expirada</Badge>}
                  </div>

                  {action.risk_level === "critical" && (
                    <Textarea
                      placeholder="Motivo da rejeição (opcional)..."
                      className="text-xs h-16 resize-none"
                      value={rejectionReason[action.id] || ""}
                      onChange={(e) => setRejectionReason(prev => ({ ...prev, [action.id]: e.target.value }))}
                    />
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={() => handleDecision(action.id, "rejected")}
                      disabled={processingId === action.id}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleDecision(action.id, "approved")}
                      disabled={processingId === action.id || !!isExpired}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Aprovar
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
