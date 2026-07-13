/**
 * MonthlyROICard · P2 · prova visível de resultado.
 *
 * Card compacto e destacado no topo do dashboard, com 3 números do mês
 * corrente:
 *   1. Tarefas entregues  · execution_logs.status = 'success'
 *   2. Horas poupadas     · tarefas × MINUTES_SAVED_PER_TASK / 60
 *   3. Economia estimada  · horas × HOURLY_RATE_BRL − custo dos departamentos
 *
 * Regras de honestidade:
 *   - Só usa dados reais (nada de mock).
 *   - Estimativas de "horas" e "R$" são conservadoras e explicadas no card.
 *   - Se ainda não há tarefas no mês, mostra estado zerado com CTA — nunca
 *     inventa número.
 *
 * Design: usa tokens semânticos (bg-card, border-border/60, text-primary).
 * Sem cores hardcoded, dark-mode automático.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, TrendingUp, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// ── Fórmula de ROI · assumptions conservadoras e auditáveis ──
const MINUTES_SAVED_PER_TASK = 12;   // média conservadora por tarefa (12 min)
const HOURLY_RATE_BRL = 80;          // custo hora média operacional analista BR

function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Math.max(0, n));
}

function startOfMonthISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

interface MonthlyROICardProps {
  onCTA?: () => void;
}

export default function MonthlyROICard({ onCTA }: MonthlyROICardProps) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["monthly-roi", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const since = startOfMonthISO();

      // Paralelo · logs de execução do mês + preço dos departamentos ativos.
      const [logsRes, deptsRes] = await Promise.all([
        supabase
          .from("execution_logs")
          .select("status")
          .eq("user_id", user!.id)
          .gte("created_at", since),
        supabase
          .from("contracted_departments")
          .select("monthly_price_cents, status")
          .eq("user_id", user!.id)
          .eq("status", "active"),
      ]);

      const logs = logsRes.data ?? [];
      const depts = deptsRes.data ?? [];

      const tasksDelivered = logs.filter((l) => l.status === "success").length;
      const monthlyDeptCostBRL = depts.reduce(
        (acc, d) => acc + (d.monthly_price_cents ?? 0) / 100,
        0,
      );

      return { tasksDelivered, monthlyDeptCostBRL };
    },
  });

  const metrics = useMemo(() => {
    const tasks = data?.tasksDelivered ?? 0;
    const deptCost = data?.monthlyDeptCostBRL ?? 0;
    const hoursSaved = Math.round((tasks * MINUTES_SAVED_PER_TASK) / 60);
    const humanEquivalent = hoursSaved * HOURLY_RATE_BRL;
    const savings = Math.max(0, humanEquivalent - deptCost);
    return { tasks, hoursSaved, savings, humanEquivalent, deptCost };
  }, [data]);

  const isEmpty = !isLoading && metrics.tasks === 0;
  const monthName = new Date().toLocaleDateString("pt-BR", { month: "long" });

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      aria-labelledby="monthly-roi-title"
      className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 sm:p-6"
    >
      <header className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            ROI do mês · {monthName}
          </p>
          <h2
            id="monthly-roi-title"
            className="text-lg font-semibold text-foreground tracking-tight"
          >
            {isEmpty
              ? "Ainda sem tarefas este mês"
              : "Sua operação em números"}
          </h2>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Como calculamos"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Info className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[280px] text-xs leading-relaxed">
              Horas poupadas = tarefas entregues × {MINUTES_SAVED_PER_TASK} min.
              <br />
              Economia = (horas × R$ {HOURLY_RATE_BRL}/h) − custo dos
              departamentos ativos ({formatBRL(metrics.deptCost)}/mês).
              <br />
              Estimativa conservadora, calculada só sobre execuções bem-sucedidas.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border/50 rounded-xl overflow-hidden border border-border/60">
        <Metric
          icon={CheckCircle2}
          label="Tarefas entregues"
          value={isLoading ? "…" : String(metrics.tasks)}
          hint={isEmpty ? "Atribua a primeira" : "com sucesso este mês"}
          accent={!isEmpty}
        />
        <Metric
          icon={Clock}
          label="Horas poupadas"
          value={isLoading ? "…" : `${metrics.hoursSaved}h`}
          hint={
            isEmpty
              ? "—"
              : `equivalente a ~${Math.max(1, Math.round(metrics.hoursSaved / 8))} dia(s) de analista`
          }
        />
        <Metric
          icon={TrendingUp}
          label="Economia estimada"
          value={isLoading ? "…" : formatBRL(metrics.savings)}
          hint={
            isEmpty
              ? "—"
              : `vs. ${formatBRL(metrics.humanEquivalent)} de equivalente humano`
          }
        />
      </div>

      {isEmpty && onCTA && (
        <button
          type="button"
          onClick={onCTA}
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Enviar a primeira tarefa a um agente →
        </button>
      )}
    </motion.section>
  );
}

// ── Sub-componente do bloco métrico (isola markup + tokens) ──
interface MetricProps {
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}

function Metric({ icon: Icon, label, value, hint, accent }: MetricProps) {
  return (
    <div className="bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
        <span className="text-[10px] uppercase tracking-[0.14em] font-medium">
          {label}
        </span>
      </div>
      <div
        className={cn(
          "text-3xl font-semibold tracking-tight mb-1",
          accent ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </div>
      <p className="text-xs text-muted-foreground leading-snug">{hint}</p>
    </div>
  );
}
