import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Coins, TrendingUp, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export interface TokenUsageRecord {
  id?: string;
  user_id?: string;
  agent_id?: string | null;
  tokens_used: number;
  action_type?: string | null;
  model?: string | null;
  created_at?: string;
}

export interface CreditRecord {
  user_id: string;
  total_credits: number;
  used_credits: number;
  plan_type?: string;
  email?: string | null;
}

interface TokenAlertsTableProps {
  /** admin: shows one row per user. user: shows one row per model/agent bucket. */
  mode: "admin" | "user";
  credits?: CreditRecord[];
  tokenUsage?: TokenUsageRecord[];
  profiles?: Array<{ id: string; email?: string | null; full_name?: string | null }>;
  /** % thresholds for warning/critical (default 80 / 95) */
  warnAt?: number;
  criticalAt?: number;
  /** Force demo mode: always show the alert row even if no critical/warning row exists */
  forceDemo?: boolean;
  title?: string;
}

const PLAN_LIMITS: Record<string, number> = {
  free: 100_000,
  starter: 5_000_000,
  pro: 25_000_000,
  enterprise: 100_000_000,
};

// Never expose provider/model names to end users. Map anything to a friendly category.
function friendlyModelLabel(model?: string | null): string {
  if (!model) return "Motor Padrão";
  const m = model.toLowerCase();
  if (m.includes("claude") || m.includes("opus") || m.includes("sonnet")) return "Raciocínio Avançado";
  if (m.includes("gpt-5") || m.includes("gpt5")) return "Núcleo Cognitivo";
  if (m.includes("gpt")) return "Motor Generalista";
  if (m.includes("gemini-2.5-pro") || m.includes("gemini-3") || m.includes("pro")) return "Análise Profunda";
  if (m.includes("gemini")) return "Motor Rápido";
  if (m.includes("embedding")) return "Vetorização";
  if (m.includes("tts") || m.includes("speech")) return "Áudio Neural";
  return "Motor Especializado";
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString("pt-BR");
}

function levelFor(pct: number, warn: number, crit: number): "ok" | "warn" | "crit" {
  if (pct >= crit) return "crit";
  if (pct >= warn) return "warn";
  return "ok";
}

function LevelBadge({ level }: { level: "ok" | "warn" | "crit" }) {
  if (level === "crit")
    return <Badge className="bg-destructive/15 text-destructive border-0">🔴 Crítico</Badge>;
  if (level === "warn")
    return <Badge className="bg-amber-500/15 text-amber-500 border-0">🟡 Atenção</Badge>;
  return <Badge className="bg-emerald-500/10 text-emerald-500 border-0">🟢 OK</Badge>;
}

export default function TokenAlertsTable({
  mode,
  credits = [],
  tokenUsage = [],
  profiles = [],
  warnAt = 80,
  criticalAt = 95,
  forceDemo = true,
  title,
}: TokenAlertsTableProps) {
  const profileMap = useMemo(() => {
    const m = new Map<string, { email?: string | null; full_name?: string | null }>();
    profiles.forEach((p) => m.set(p.id, { email: p.email, full_name: p.full_name }));
    return m;
  }, [profiles]);

  const rows = useMemo(() => {
    if (mode === "admin") {
      // Aggregate token usage per user
      const usageByUser = new Map<string, number>();
      tokenUsage.forEach((t) => {
        if (!t.user_id) return;
        usageByUser.set(t.user_id, (usageByUser.get(t.user_id) || 0) + (t.tokens_used || 0));
      });

      const list = credits.map((c) => {
        const limit = c.total_credits || PLAN_LIMITS[c.plan_type || "free"] || 100_000;
        const used = c.used_credits ?? usageByUser.get(c.user_id) ?? 0;
        const pct = limit > 0 ? Math.round((used / limit) * 100) : 0;
        const p = profileMap.get(c.user_id);
        return {
          key: c.user_id,
          label: p?.full_name || p?.email || c.user_id.slice(0, 8),
          sub: c.plan_type ? c.plan_type.toUpperCase() : "FREE",
          used,
          limit,
          pct,
          level: levelFor(pct, warnAt, criticalAt),
        };
      });
      return list.sort((a, b) => b.pct - a.pct).slice(0, 12);
    }

    // user mode: aggregate own usage by friendly model bucket
    const byBucket = new Map<string, number>();
    tokenUsage.forEach((t) => {
      const bucket = friendlyModelLabel(t.model);
      byBucket.set(bucket, (byBucket.get(bucket) || 0) + (t.tokens_used || 0));
    });
    const totalLimit = credits[0]?.total_credits || 100_000;
    return Array.from(byBucket.entries())
      .map(([bucket, used]) => {
        const pct = totalLimit > 0 ? Math.round((used / totalLimit) * 100) : 0;
        return {
          key: bucket,
          label: bucket,
          sub: "Consumo neste ciclo",
          used,
          limit: totalLimit,
          pct,
          level: levelFor(pct, warnAt, criticalAt),
        };
      })
      .sort((a, b) => b.used - a.used);
  }, [mode, credits, tokenUsage, profileMap, warnAt, criticalAt]);

  const hasAlert = rows.some((r) => r.level !== "ok") || forceDemo;
  const critCount = rows.filter((r) => r.level === "crit").length;
  const warnCount = rows.filter((r) => r.level === "warn").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/40 border border-border/30 rounded-xl overflow-hidden backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Coins className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">
              {title || (mode === "admin" ? "Alerta de Créditos por Usuário" : "Consumo por Motor de IA")}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Limite de alerta: {warnAt}% • Crítico: {criticalAt}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {critCount > 0 && (
            <Badge className="bg-destructive/15 text-destructive border-0 gap-1">
              <AlertTriangle className="h-3 w-3" />
              {critCount}
            </Badge>
          )}
          {warnCount > 0 && (
            <Badge className="bg-amber-500/15 text-amber-500 border-0 gap-1">
              <TrendingUp className="h-3 w-3" />
              {warnCount}
            </Badge>
          )}
          {!hasAlert && (
            <Badge className="bg-emerald-500/10 text-emerald-500 border-0 gap-1">
              <ShieldCheck className="h-3 w-3" />
              Saudável
            </Badge>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-6 text-center text-xs text-muted-foreground">
          Sem consumo registrado neste ciclo.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground/70 border-b border-border/10">
                <th className="text-left px-4 py-2 font-medium">{mode === "admin" ? "Usuário" : "Motor"}</th>
                <th className="text-left px-2 py-2 font-medium hidden sm:table-cell">{mode === "admin" ? "Plano" : "Categoria"}</th>
                <th className="text-right px-2 py-2 font-medium">Consumido</th>
                <th className="text-right px-2 py-2 font-medium hidden md:table-cell">Limite</th>
                <th className="text-left px-2 py-2 font-medium w-[120px]">Uso</th>
                <th className="text-right px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.key}
                  className={`border-b border-border/5 last:border-0 transition-colors ${
                    r.level === "crit"
                      ? "bg-destructive/5 hover:bg-destructive/10"
                      : r.level === "warn"
                        ? "bg-amber-500/5 hover:bg-amber-500/10"
                        : "hover:bg-muted/20"
                  }`}
                >
                  <td className="px-4 py-2.5 font-medium truncate max-w-[180px]">{r.label}</td>
                  <td className="px-2 py-2.5 text-muted-foreground hidden sm:table-cell">{r.sub}</td>
                  <td className="px-2 py-2.5 text-right font-mono">{fmt(r.used)}</td>
                  <td className="px-2 py-2.5 text-right font-mono text-muted-foreground hidden md:table-cell">{fmt(r.limit)}</td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      <Progress value={Math.min(100, r.pct)} className="h-1.5 flex-1" />
                      <span className="text-[10px] font-mono w-8 text-right">{r.pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <LevelBadge level={r.level} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
