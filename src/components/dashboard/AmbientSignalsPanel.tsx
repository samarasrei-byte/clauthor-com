/**
 * AmbientSignalsPanel · pilar Ambient Agents (fase 1)
 *
 * Escaneia dados reais do tenant (approvals + execution_logs) e apresenta
 * sinais proativos SEM que o CEO tenha pedido. Cada sinal tem CTA em 1 clique
 * (ex.: "revisar aprovações") e pode ser dispensado (persistência local).
 *
 * Racional: o painel padrão é reativo (o CEO abre → vê números). Ambient
 * inverte: o sistema detecta padrões (fila crescendo, confiança caindo,
 * agente parado) e chama a atenção. Base: LangChain "Ambient Agents" (2025)
 * + estudo de calibração LLM da Anthropic.
 *
 * MVP: derivação client-side, dismiss em localStorage (por tenant).
 * Fase 2 (edge function ambient-scan) persiste em `public.ambient_signals`.
 */
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, ShieldAlert, Zap, X, ArrowRight, CheckCircle2, TrendingUp, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantId } from "@/hooks/useTenantId";
import { cn } from "@/lib/utils";
import { normalizeConfidence } from "./ConfidenceBadge";

type Severity = "info" | "warn" | "critical" | "success";

interface Signal {
  id: string;
  kind: string;
  severity: Severity;
  title: string;
  body?: string;
  ctaLabel?: string;
  onAct?: () => void;
}

interface Props {
  onNavigate?: (section: string) => void;
}

const DISMISS_KEY = "ambient-signals-dismissed-v1";

function loadDismissed(tenantId: string | null): Set<string> {
  if (!tenantId) return new Set();
  try {
    const raw = localStorage.getItem(`${DISMISS_KEY}:${tenantId}`);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
}
function persistDismissed(tenantId: string | null, ids: Set<string>) {
  if (!tenantId) return;
  try { localStorage.setItem(`${DISMISS_KEY}:${tenantId}`, JSON.stringify([...ids])); } catch { /* quota */ }
}

const SEVERITY_STYLES: Record<Severity, { chip: string; icon: string; ring: string }> = {
  info:     { chip: "bg-sky-500/10 text-sky-500 border-sky-500/25",           icon: "text-sky-500",     ring: "border-sky-500/20" },
  warn:     { chip: "bg-amber-500/10 text-amber-500 border-amber-500/25",     icon: "text-amber-500",   ring: "border-amber-500/20" },
  critical: { chip: "bg-rose-500/10 text-rose-500 border-rose-500/25",        icon: "text-rose-500",    ring: "border-rose-500/25" },
  success:  { chip: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25", icon: "text-emerald-500", ring: "border-emerald-500/20" },
};

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, warn: 1, success: 2, info: 3 };

function iconFor(kind: string) {
  switch (kind) {
    case "approval_backlog": return Bell;
    case "low_confidence_streak": return ShieldAlert;
    case "opportunity": return TrendingUp;
    case "celebration": return Sparkles;
    case "stale_agent": return Zap;
    default: return Bell;
  }
}

const AmbientSignalsPanel = ({ onNavigate }: Props) => {
  const { user } = useAuth();
  const { data: tenantId } = useTenantId();

  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed(tenantId ?? null));
  const [signals, setSignals] = useState<Signal[] | null>(null);

  useEffect(() => { setDismissed(loadDismissed(tenantId ?? null)); }, [tenantId]);

  // Scanner passivo · sempre que tenant carrega, roda 1x.
  useEffect(() => {
    if (!user || !tenantId) return;
    let mounted = true;

    (async () => {
      const derived: Signal[] = [];

      // 1) fila de aprovações pendentes (últimos 30d)
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const [{ data: pending }, { data: recentApproved }] = await Promise.all([
        supabase.from("approvals").select("id, content, created_at")
          .eq("tenant_id", tenantId).eq("status", "pending")
          .order("created_at", { ascending: false }).limit(50),
        supabase.from("approvals").select("id, content, approved_at")
          .eq("tenant_id", tenantId).eq("status", "approved")
          .gte("approved_at", since).order("approved_at", { ascending: false }).limit(30),
      ]);

      const pendingCount = pending?.length ?? 0;
      if (pendingCount >= 5) {
        derived.push({
          id: "approval-backlog",
          kind: "approval_backlog",
          severity: pendingCount >= 15 ? "critical" : "warn",
          title: `${pendingCount} entregas aguardando sua aprovação`,
          body: "Agentes finalizaram tarefas e estão parados esperando. Cada dia parado = ROI perdido.",
          ctaLabel: "Revisar agora",
          onAct: () => onNavigate?.("approvals"),
        });
      }

      // 2) baixa confiança sustentada
      const scores = (recentApproved ?? [])
        .map((r: any) => normalizeConfidence(r?.content?.confidence_score))
        .filter((n): n is number => typeof n === "number");
      if (scores.length >= 5) {
        const low = scores.filter((s) => s < 70).length;
        const share = low / scores.length;
        if (share >= 0.3) {
          derived.push({
            id: "low-confidence-streak",
            kind: "low_confidence_streak",
            severity: share >= 0.5 ? "critical" : "warn",
            title: `${Math.round(share * 100)}% das últimas entregas com confiança baixa`,
            body: "Seus agentes estão pedindo mais ajuda humana que o normal. Vale revisar prompts e contexto.",
            ctaLabel: "Ver aprovações",
            onAct: () => onNavigate?.("approvals"),
          });
        }
      }

      // 3) celebração · muitas aprovações no mês
      if ((recentApproved?.length ?? 0) >= 10) {
        derived.push({
          id: "celebration-monthly",
          kind: "celebration",
          severity: "success",
          title: `${recentApproved!.length} entregas aprovadas nos últimos 30 dias`,
          body: "Seus agentes estão performando. Considere ativar mais um departamento e expandir a operação.",
          ctaLabel: "Ver departamentos",
          onAct: () => onNavigate?.("departments"),
        });
      }

      // 4) oportunidade · nenhum log recente + sem approvals pendentes = agente parado
      if (pendingCount === 0 && (recentApproved?.length ?? 0) === 0) {
        const { data: logs } = await supabase.from("execution_logs")
          .select("id, created_at").eq("user_id", user.id)
          .order("created_at", { ascending: false }).limit(1);
        const lastLog = logs?.[0]?.created_at;
        const ageDays = lastLog ? (Date.now() - new Date(lastLog).getTime()) / 86_400_000 : Infinity;
        if (ageDays > 3) {
          derived.push({
            id: "stale-agent",
            kind: "stale_agent",
            severity: "info",
            title: "Seus agentes estão ociosos há alguns dias",
            body: "Delegue uma tarefa ao Thor ou ative um novo agente. IA parada é orçamento parado.",
            ctaLabel: "Pedir tarefa ao Thor",
            onAct: () => onNavigate?.("omnix"),
          });
        }
      }

      if (mounted) setSignals(derived);
    })().catch(() => { if (mounted) setSignals([]); });

    return () => { mounted = false; };
  }, [user, tenantId, onNavigate]);

  const visible = useMemo(
    () => (signals ?? []).filter((s) => !dismissed.has(s.id))
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
      .slice(0, 3),
    [signals, dismissed],
  );

  if (!signals || visible.length === 0) return null;

  const handleDismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    persistDismissed(tenantId ?? null, next);
  };

  return (
    <section aria-label="Sinais proativos" className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
        <h2 className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
          Thor detectou {visible.length} {visible.length === 1 ? "sinal" : "sinais"}
        </h2>
        <Badge variant="outline" className="ml-auto text-[10px] border-primary/25 text-primary">
          Ambient
        </Badge>
      </div>

      <AnimatePresence initial={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map((s) => {
            const style = SEVERITY_STYLES[s.severity];
            const Icon = iconFor(s.kind);
            return (
              <motion.article
                key={s.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className={cn(
                  "relative rounded-xl border bg-card/60 backdrop-blur-sm p-4 flex flex-col gap-2",
                  style.ring,
                )}
              >
                <button
                  type="button"
                  onClick={() => handleDismiss(s.id)}
                  className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors"
                  aria-label="Dispensar sinal"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", style.icon)} />
                  <Badge variant="outline" className={cn("text-[10px] border", style.chip)}>
                    {s.severity === "critical" ? "Crítico"
                      : s.severity === "warn" ? "Atenção"
                      : s.severity === "success" ? "Sucesso"
                      : "Info"}
                  </Badge>
                </div>

                <h3 className="text-sm font-semibold leading-snug pr-6">{s.title}</h3>
                {s.body && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
                )}

                {s.onAct && s.ctaLabel && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { s.onAct?.(); handleDismiss(s.id); }}
                    className="justify-start h-8 px-2 mt-1 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10"
                  >
                    {s.ctaLabel}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </motion.article>
            );
          })}
        </div>
      </AnimatePresence>

      <p className="px-1 text-[10px] text-muted-foreground/60 font-mono uppercase tracking-[0.14em] flex items-center gap-1.5">
        <CheckCircle2 className="h-3 w-3" />
        Ambient agents · sinais gerados sem você pedir
      </p>
    </section>
  );
};

export default AmbientSignalsPanel;
