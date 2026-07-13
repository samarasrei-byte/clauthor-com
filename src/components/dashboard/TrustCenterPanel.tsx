import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/hooks/useTenantId";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditEntry {
  id: string;
  agent_name: string | null;
  action_type: string;
  status: "success" | "failed" | "blocked" | "pending";
  cost_credits: number | null;
  entry_hash: string;
  prev_hash: string | null;
  created_at: string;
}

const statusMeta: Record<AuditEntry["status"], { icon: React.ReactNode; color: string; label: string }> = {
  success: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-emerald-500", label: "Sucesso" },
  failed: { icon: <XCircle className="h-3.5 w-3.5" />, color: "text-destructive", label: "Falhou" },
  blocked: { icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-amber-500", label: "Bloqueado" },
  pending: { icon: <Clock className="h-3.5 w-3.5" />, color: "text-muted-foreground", label: "Pendente" },
};

export default function TrustCenterPanel() {
  const { data: tenantId } = useTenantId();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("agent_audit_trail")
        .select("id, agent_name, action_type, status, cost_credits, entry_hash, prev_hash, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(50);
      setEntries((data as AuditEntry[]) ?? []);
      setLoading(false);
    })();
  }, [tenantId]);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Trust Center
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Trilha de auditoria imutável (SHA-256 encadeado) · prova criptográfica de cada ação dos agentes.
          </p>
        </div>
        <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-500">
          <CheckCircle2 className="h-3 w-3" /> {entries.length} eventos
        </Badge>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted/30 animate-pulse rounded-md" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">
          Nenhuma ação auditada ainda. Conforme seus agentes executam tarefas, elas aparecem aqui.
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {entries.map((e) => {
            const meta = statusMeta[e.status];
            return (
              <div key={e.id} className="py-3 flex items-center gap-3 text-sm">
                <span className={`${meta.color} flex-shrink-0`}>{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {e.agent_name ?? "Sistema"} · <span className="text-muted-foreground">{e.action_type}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono truncate">
                    #{e.entry_hash.slice(0, 12)}…{e.prev_hash ? ` ← ${e.prev_hash.slice(0, 8)}…` : " (gênese)"}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(e.created_at), { addSuffix: true, locale: ptBR })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
