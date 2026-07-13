/**
 * MonthlyROICard · P2 · prova visível de resultado.
 *
 * Card compacto e destacado no topo do dashboard, com 3 números do mês
 * corrente:
 *   1. Tarefas entregues  · execution_logs.status = 'success'
 *   2. Horas poupadas     · Σ (tarefas_do_depto × minutesSavedPerTask_do_depto) / 60
 *   3. Economia estimada  · Σ (horas_do_depto × hourlyRateBRL_do_depto) − custo dos departamentos
 *
 * Fórmula por departamento (não mais constante global):
 *   - Cada `contracted_departments.department_id` tem sua própria taxa via
 *     `src/config/departmentRoi.ts`. Departamentos sem config caem no
 *     DEFAULT_ROI_CONFIG.
 *   - Executions são atribuídas ao departamento cujo `agent_ids` contém o
 *     agent_id do log. Execuções órfãs (agente fora de qualquer depto)
 *     também caem no default.
 *
 * Regras de honestidade:
 *   - Só usa dados reais (nada de mock).
 *   - Estimativas são conservadoras e explicadas no card.
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
import {
  DEFAULT_ROI_CONFIG,
  getDepartmentRoiConfig,
} from "@/config/departmentRoi";

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

      // Paralelo · logs de execução do mês + departamentos ativos (com agent_ids).
      const [logsRes, deptsRes] = await Promise.all([
        supabase
          .from("execution_logs")
          .select("agent_id, status")
          .eq("user_id", user!.id)
          .eq("status", "success")
          .gte("created_at", since),
        supabase
          .from("contracted_departments")
          .select("department_id, monthly_price_cents, agent_ids, status")
          .eq("user_id", user!.id)
          .eq("status", "active"),
      ]);

      const logs = logsRes.data ?? [];
      const depts = deptsRes.data ?? [];

      const monthlyDeptCostBRL = depts.reduce(
        (acc, d) => acc + (d.monthly_price_cents ?? 0) / 100,
        0,
      );

      // Índice agent_id → department_id (primeiro depto que contém o agente vence).
      const agentToDept = new Map<string, string>();
      for (const d of depts) {
        for (const aid of (d.agent_ids ?? []) as string[]) {
          if (!agentToDept.has(aid)) agentToDept.set(aid, d.department_id);
        }
      }

      // Agrega tarefas por depto (ou "__default__" pra órfãs).
      const tasksByDept = new Map<string, number>();
      for (const l of logs) {
        const key = agentToDept.get(l.agent_id as string) ?? "__default__";
        tasksByDept.set(key, (tasksByDept.get(key) ?? 0) + 1);
      }

      // Calcula minutos poupados e equivalente humano ponderado por depto.
      let tasksDelivered = 0;
      let minutesSaved = 0;
      let humanEquivalentBRL = 0;
      for (const [deptId, count] of tasksByDept) {
        const cfg =
          deptId === "__default__"
            ? DEFAULT_ROI_CONFIG
            : getDepartmentRoiConfig(deptId);
        tasksDelivered += count;
        minutesSaved += count * cfg.minutesSavedPerTask;
        humanEquivalentBRL += (count * cfg.minutesSavedPerTask / 60) * cfg.hourlyRateBRL;
      }

      return {
        tasksDelivered,
        minutesSaved,
        humanEquivalentBRL,
        monthlyDeptCostBRL,
      };
    },
  });

  const metrics = useMemo(() => {
    const tasks = data?.tasksDelivered ?? 0;
    const deptCost = data?.monthlyDeptCostBRL ?? 0;
    const hoursSaved = Math.round((data?.minutesSaved ?? 0) / 60);
    const humanEquivalent = Math.round(data?.humanEquivalentBRL ?? 0);
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
