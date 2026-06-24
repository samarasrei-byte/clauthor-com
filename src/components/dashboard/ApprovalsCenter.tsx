import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CheckCircle2, XCircle, MessageSquareWarning, RefreshCw, Clock,
  TrendingUp, ListChecks, Sparkles, Eye, History, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantId } from "@/hooks/useTenantId";
import { cn } from "@/lib/utils";

type Status = "pending" | "in_revision" | "approved" | "rejected";
type DeliveryType = "creative" | "video" | "article" | "post" | "email" | "landing" | "report" | "automation" | "other";

interface Approval {
  id: string;
  title: string;
  delivery_type: DeliveryType;
  status: Status;
  preview_url: string | null;
  current_version: number;
  agent_id: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  content: any;
}

interface AppVersion {
  id: string;
  version_number: number;
  preview_url: string | null;
  notes: string | null;
  created_at: string;
}

interface AppComment {
  id: string;
  body: string;
  is_rejection_reason: boolean;
  user_id: string;
  created_at: string;
}

const DELIVERY_LABEL: Record<DeliveryType, string> = {
  creative: "Criativo", video: "Vídeo", article: "Artigo", post: "Post",
  email: "E-mail", landing: "Landing Page", report: "Relatório",
  automation: "Automação", other: "Outro",
};

const STATUS_META: Record<Status, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Aguardando", color: "bg-amber-500/15 text-amber-600 border-amber-500/20", icon: Clock },
  in_revision: { label: "Em Ajuste", color: "bg-blue-500/15 text-blue-600 border-blue-500/20", icon: RefreshCw },
  approved: { label: "Aprovado", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
  rejected: { label: "Reprovado", color: "bg-rose-500/15 text-rose-600 border-rose-500/20", icon: XCircle },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const ApprovalsCenter = () => {
  const { user } = useAuth();
  const { data: tenantId } = useTenantId();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Status>("pending");
  const [selected, setSelected] = useState<Approval | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState<{ mode: "reject" | "request_changes"; approval: Approval } | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ["approvals", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approvals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Approval[];
    },
  });

  const { data: versions = [] } = useQuery({
    queryKey: ["approval-versions", selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approval_versions")
        .select("*")
        .eq("approval_id", selected!.id)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data as AppVersion[];
    },
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["approval-comments", selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approval_comments")
        .select("*")
        .eq("approval_id", selected!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AppComment[];
    },
  });

  // ── Mutations ──
  const updateStatus = useMutation({
    mutationFn: async ({ approval, status, action, details }: { approval: Approval; status: Status; action: string; details?: any }) => {
      const patch: any = { status };
      if (status === "approved") {
        patch.approved_by = user!.id;
        patch.approved_at = new Date().toISOString();
      }
      const { error } = await supabase.from("approvals").update(patch).eq("id", approval.id);
      if (error) throw error;
      await supabase.from("approval_actions").insert({
        approval_id: approval.id,
        tenant_id: tenantId,
        user_id: user!.id,
        action,
        details: details || {},
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvals", tenantId] });
      qc.invalidateQueries({ queryKey: ["approval-versions"] });
    },
  });

  const addFeedback = useMutation({
    mutationFn: async ({ approval, body, isRejection, newStatus }: { approval: Approval; body: string; isRejection: boolean; newStatus: Status }) => {
      await supabase.from("approval_comments").insert({
        approval_id: approval.id,
        tenant_id: tenantId,
        user_id: user!.id,
        body,
        is_rejection_reason: isRejection,
        version_number: approval.current_version,
      });
      await supabase.from("approvals").update({ status: newStatus }).eq("id", approval.id);
      await supabase.from("approval_actions").insert({
        approval_id: approval.id,
        tenant_id: tenantId,
        user_id: user!.id,
        action: isRejection ? "reject" : "request_changes",
        details: { feedback: body },
      });
    },
    onSuccess: () => {
      toast.success("Feedback enviado ao agente responsável");
      qc.invalidateQueries({ queryKey: ["approvals", tenantId] });
      qc.invalidateQueries({ queryKey: ["approval-comments"] });
      setFeedbackOpen(null);
      setFeedbackText("");
    },
  });

  const newVersion = useMutation({
    mutationFn: async (approval: Approval) => {
      const nextV = approval.current_version + 1;
      const { error: insErr } = await supabase.from("approval_versions").insert({
        approval_id: approval.id,
        tenant_id: tenantId,
        version_number: nextV,
        content: approval.content,
        preview_url: approval.preview_url,
        generated_by_agent: approval.agent_id,
        notes: "Nova versão gerada manualmente",
      });
      if (insErr) throw insErr;
      const { error } = await supabase.from("approvals")
        .update({ current_version: nextV, status: "pending" })
        .eq("id", approval.id);
      if (error) throw error;
      await supabase.from("approval_actions").insert({
        approval_id: approval.id, tenant_id: tenantId, user_id: user!.id, action: "new_version", details: { version: nextV },
      });
    },
    onSuccess: () => {
      toast.success("Nova versão criada");
      qc.invalidateQueries({ queryKey: ["approvals", tenantId] });
      qc.invalidateQueries({ queryKey: ["approval-versions"] });
    },
  });

  // ── Metrics ──
  const metrics = useMemo(() => {
    const total = approvals.length;
    const approved = approvals.filter((a) => a.status === "approved").length;
    const pending = approvals.filter((a) => a.status === "pending" || a.status === "in_revision").length;
    const rejected = approvals.filter((a) => a.status === "rejected").length;
    const rate = total ? Math.round((approved / total) * 100) : 0;
    const avgHours = (() => {
      const done = approvals.filter((a) => a.approved_at);
      if (!done.length) return 0;
      const sum = done.reduce((acc, a) => acc + (new Date(a.approved_at!).getTime() - new Date(a.created_at).getTime()), 0);
      return Math.round(sum / done.length / 3600000);
    })();
    const revisions = approvals.reduce((acc, a) => acc + Math.max(0, a.current_version - 1), 0);
    return { total, approved, pending, rejected, rate, avgHours, revisions };
  }, [approvals]);

  const filtered = approvals.filter((a) => a.status === tab);
  const counts: Record<Status, number> = {
    pending: approvals.filter((a) => a.status === "pending").length,
    in_revision: approvals.filter((a) => a.status === "in_revision").length,
    approved: approvals.filter((a) => a.status === "approved").length,
    rejected: approvals.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Central de Aprovações Inteligentes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Revise, aprove, rejeite ou solicite ajustes em tudo que seus agentes produzem.
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard icon={ListChecks} label="Geradas" value={metrics.total} />
        <MetricCard icon={CheckCircle2} label="Aprovadas" value={metrics.approved} accent="text-emerald-500" />
        <MetricCard icon={Clock} label="Pendentes" value={metrics.pending} accent="text-amber-500" />
        <MetricCard icon={TrendingUp} label="Taxa aprov." value={`${metrics.rate}%`} accent="text-primary" />
        <MetricCard icon={Sparkles} label="Tempo médio" value={`${metrics.avgHours}h`} />
        <MetricCard icon={RefreshCw} label="Revisões" value={metrics.revisions} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList>
          {(Object.keys(STATUS_META) as Status[]).map((s) => {
            const M = STATUS_META[s];
            return (
              <TabsTrigger key={s} value={s} className="gap-2">
                <M.icon className="h-3.5 w-3.5" />
                {M.label}
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{counts[s]}</Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(STATUS_META) as Status[]).map((s) => (
          <TabsContent key={s} value={s} className="mt-4">
            {isLoading ? (
              <div className="text-sm text-muted-foreground py-12 text-center">Carregando...</div>
            ) : filtered.length === 0 ? (
              <Card className="border-dashed">
                <div className="py-16 text-center text-sm text-muted-foreground">
                  Nenhuma entrega em "{STATUS_META[s].label}".
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((a) => (
                  <ApprovalCard
                    key={a.id}
                    approval={a}
                    onOpen={() => setSelected(a)}
                    onApprove={() => updateStatus.mutate({ approval: a, status: "approved", action: "approve" })}
                    onRequestChanges={() => { setFeedbackOpen({ mode: "request_changes", approval: a }); setFeedbackText(""); }}
                    onReject={() => { setFeedbackOpen({ mode: "reject", approval: a }); setFeedbackText(""); }}
                    onNewVersion={() => newVersion.mutate(a)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Drawer detalhes */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Badge variant="outline">v{selected.current_version}</Badge>
                  {selected.title}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-5 space-y-5">
                <div className="flex items-center gap-2 text-xs">
                  <Badge className={cn("border", STATUS_META[selected.status].color)}>{STATUS_META[selected.status].label}</Badge>
                  <Badge variant="secondary">{DELIVERY_LABEL[selected.delivery_type]}</Badge>
                  <span className="text-muted-foreground">há {timeAgo(selected.created_at)}</span>
                </div>

                <PreviewBlock approval={selected} />

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <History className="h-3 w-3" /> Histórico de versões
                  </h3>
                  <div className="space-y-1.5">
                    {versions.map((v) => (
                      <div key={v.id} className="flex items-center gap-3 text-xs p-2 rounded-md bg-muted/30">
                        <Badge variant="outline">v{v.version_number}</Badge>
                        <span className="flex-1 truncate text-muted-foreground">{v.notes || "—"}</span>
                        <span className="text-muted-foreground/70">há {timeAgo(v.created_at)}</span>
                      </div>
                    ))}
                    {versions.length === 0 && (
                      <div className="text-xs text-muted-foreground">Apenas a versão atual.</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <MessageSquareWarning className="h-3 w-3" /> Comentários
                  </h3>
                  <div className="space-y-2">
                    {comments.map((c) => (
                      <div
                        key={c.id}
                        className={cn(
                          "p-2.5 rounded-md text-xs border",
                          c.is_rejection_reason ? "bg-rose-500/5 border-rose-500/20" : "bg-muted/30 border-border/40"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {c.is_rejection_reason && <Badge variant="destructive" className="text-[9px]">Motivo</Badge>}
                          <span className="text-muted-foreground">há {timeAgo(c.created_at)}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{c.body}</p>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <div className="text-xs text-muted-foreground">Sem comentários ainda.</div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-3 border-t border-border/40">
                  <Button size="sm" className="gap-1.5"
                    onClick={() => { updateStatus.mutate({ approval: selected, status: "approved", action: "approve" }); setSelected(null); }}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5"
                    onClick={() => { setFeedbackOpen({ mode: "request_changes", approval: selected }); setFeedbackText(""); }}>
                    <MessageSquareWarning className="h-3.5 w-3.5" /> Solicitar Ajustes
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 text-destructive border-destructive/30"
                    onClick={() => { setFeedbackOpen({ mode: "reject", approval: selected }); setFeedbackText(""); }}>
                    <XCircle className="h-3.5 w-3.5" /> Reprovar
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5"
                    onClick={() => newVersion.mutate(selected)}>
                    <RefreshCw className="h-3.5 w-3.5" /> Nova Versão
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog de feedback */}
      <Dialog open={!!feedbackOpen} onOpenChange={(o) => !o && setFeedbackOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {feedbackOpen?.mode === "reject" ? "Motivo da reprovação" : "Solicitar ajustes"}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Descreva o que precisa ser ajustado. O agente responsável receberá este feedback e gerará uma nova versão."
            rows={5}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFeedbackOpen(null)}>Cancelar</Button>
            <Button
              disabled={!feedbackText.trim() || addFeedback.isPending}
              onClick={() =>
                feedbackOpen &&
                addFeedback.mutate({
                  approval: feedbackOpen.approval,
                  body: feedbackText.trim(),
                  isRejection: feedbackOpen.mode === "reject",
                  newStatus: feedbackOpen.mode === "reject" ? "rejected" : "in_revision",
                })
              }
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" /> Enviar ao agente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Subcomponentes ──
const MetricCard = ({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string | number; accent?: string }) => (
  <Card className="p-3">
    <div className="flex items-center gap-2 mb-1.5">
      <Icon className={cn("h-3.5 w-3.5", accent || "text-muted-foreground")} strokeWidth={1.6} />
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
    </div>
    <div className="text-xl font-semibold">{value}</div>
  </Card>
);

const PreviewBlock = ({ approval }: { approval: Approval }) => {
  const url = approval.preview_url;
  const type = approval.delivery_type;
  if (!url) {
    return (
      <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center text-xs text-muted-foreground border border-border/40">
        Sem preview
      </div>
    );
  }
  if (type === "video") {
    return <video src={url} controls className="w-full rounded-lg border border-border/40" />;
  }
  if (type === "landing" || type === "email") {
    return <iframe src={url} sandbox="allow-same-origin" className="w-full h-72 rounded-lg border border-border/40 bg-background" />;
  }
  // image / creative / post / others with image url
  return <img src={url} alt={approval.title} className="w-full rounded-lg border border-border/40" />;
};

interface CardProps {
  approval: Approval;
  onOpen: () => void;
  onApprove: () => void;
  onRequestChanges: () => void;
  onReject: () => void;
  onNewVersion: () => void;
}
const ApprovalCard = ({ approval, onOpen, onApprove, onRequestChanges, onReject, onNewVersion }: CardProps) => {
  const M = STATUS_META[approval.status];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden hover:border-primary/40 transition-colors flex flex-col">
        <button onClick={onOpen} className="block text-left">
          <div className="aspect-video bg-muted/30 relative">
            {approval.preview_url ? (
              approval.delivery_type === "video" ? (
                <video src={approval.preview_url} className="w-full h-full object-cover" />
              ) : approval.delivery_type === "landing" || approval.delivery_type === "email" ? (
                <iframe src={approval.preview_url} sandbox="" className="w-full h-full pointer-events-none" />
              ) : (
                <img src={approval.preview_url} alt="" className="w-full h-full object-cover" />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/60">
                <Eye className="h-6 w-6" />
              </div>
            )}
            <Badge className={cn("absolute top-2 left-2 border text-[10px]", M.color)}>
              {M.label}
            </Badge>
            <Badge variant="outline" className="absolute top-2 right-2 text-[10px] bg-background/80 backdrop-blur">
              v{approval.current_version}
            </Badge>
          </div>
          <div className="p-3 space-y-1">
            <div className="text-sm font-medium truncate">{approval.title}</div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Badge variant="secondary" className="text-[10px]">{DELIVERY_LABEL[approval.delivery_type]}</Badge>
              <span>há {timeAgo(approval.created_at)}</span>
            </div>
          </div>
        </button>
        <div className="px-3 pb-3 grid grid-cols-2 gap-1.5 mt-auto">
          <Button size="sm" variant="default" className="h-7 text-[11px] gap-1" onClick={onApprove}>
            <CheckCircle2 className="h-3 w-3" /> Aprovar
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={onRequestChanges}>
            <MessageSquareWarning className="h-3 w-3" /> Ajustes
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 text-destructive border-destructive/30" onClick={onReject}>
            <XCircle className="h-3 w-3" /> Reprovar
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={onNewVersion}>
            <RefreshCw className="h-3 w-3" /> Nova v.
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default ApprovalsCenter;
