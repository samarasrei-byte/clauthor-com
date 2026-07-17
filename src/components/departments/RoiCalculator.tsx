/**
 * RoiCalculator · calculadora interativa de ROI por departamento.
 *
 * UX pensada para não-técnico:
 *   - 2 sliders (tarefas/mês e custo/hora) com defaults sensatos por depto.
 *   - Saída em 3 números grandes: economia mensal, break-even em dias, ROI %.
 *   - Sem jargão. Sem gráfico. Sem log-in obrigatório.
 *
 * Defaults derivam de `department_roi_config` no admin quando disponível, senão
 * caem no heurístico embutido — o cliente pode ajustar os sliders manualmente
 * e vê o número mudar em tempo real.
 */

import { useEffect, useMemo, useState } from "react";
import { Calculator, TrendingUp, Clock, Share2, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RoiDefaults {
  tasksPerMonth: number;
  minutesPerTask: number;
  hourlyRate: number;
  taskLabel: string;
}

// Heurística por departamento. Números redondos e defensáveis — não fingir precisão.
const DEPT_DEFAULTS: Record<string, RoiDefaults> = {
  comercial:      { tasksPerMonth: 200, minutesPerTask: 25, hourlyRate: 60, taskLabel: "leads qualificados" },
  marketing:      { tasksPerMonth: 40,  minutesPerTask: 90, hourlyRate: 70, taskLabel: "peças de conteúdo" },
  suporte:        { tasksPerMonth: 400, minutesPerTask: 12, hourlyRate: 45, taskLabel: "atendimentos" },
  prospeccao:     { tasksPerMonth: 300, minutesPerTask: 18, hourlyRate: 55, taskLabel: "prospecções" },
  criacao:        { tasksPerMonth: 30,  minutesPerTask: 120, hourlyRate: 80, taskLabel: "criativos" },
  financeiro:     { tasksPerMonth: 150, minutesPerTask: 20, hourlyRate: 70, taskLabel: "lançamentos" },
  rh:             { tasksPerMonth: 60,  minutesPerTask: 30, hourlyRate: 65, taskLabel: "triagens" },
  juridico:       { tasksPerMonth: 40,  minutesPerTask: 45, hourlyRate: 120, taskLabel: "análises de contrato" },
  comunicacao:    { tasksPerMonth: 50,  minutesPerTask: 60, hourlyRate: 65, taskLabel: "comunicados" },
  operacoes:      { tasksPerMonth: 100, minutesPerTask: 25, hourlyRate: 60, taskLabel: "processos" },
  ecommerce_growth: { tasksPerMonth: 120, minutesPerTask: 20, hourlyRate: 55, taskLabel: "otimizações" },
  compras:        { tasksPerMonth: 80,  minutesPerTask: 30, hourlyRate: 55, taskLabel: "cotações" },
  logistica:      { tasksPerMonth: 150, minutesPerTask: 15, hourlyRate: 50, taskLabel: "rastreamentos" },
  qualidade:      { tasksPerMonth: 90,  minutesPerTask: 25, hourlyRate: 60, taskLabel: "auditorias" },
  dados:          { tasksPerMonth: 40,  minutesPerTask: 60, hourlyRate: 90, taskLabel: "relatórios" },
  produto:        { tasksPerMonth: 30,  minutesPerTask: 90, hourlyRate: 90, taskLabel: "especificações" },
  inovacao:       { tasksPerMonth: 20,  minutesPerTask: 120, hourlyRate: 100, taskLabel: "iniciativas" },
  sustentabilidade: { tasksPerMonth: 40, minutesPerTask: 45, hourlyRate: 70, taskLabel: "análises" },
  parcerias:      { tasksPerMonth: 30,  minutesPerTask: 60, hourlyRate: 80, taskLabel: "acordos" },
  tecnologia:     { tasksPerMonth: 100, minutesPerTask: 30, hourlyRate: 100, taskLabel: "tickets técnicos" },
};

const FALLBACK: RoiDefaults = {
  tasksPerMonth: 100,
  minutesPerTask: 30,
  hourlyRate: 60,
  taskLabel: "tarefas",
};

function formatBRL(n: number): string {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

interface RoiCalculatorProps {
  departmentId: string;
  monthlyPrice: number;
  className?: string;
}

export default function RoiCalculator({ departmentId, monthlyPrice, className }: RoiCalculatorProps) {
  const defaults = DEPT_DEFAULTS[departmentId] ?? FALLBACK;
  const [tasks, setTasks] = useState<number>(defaults.tasksPerMonth);
  const [rate, setRate] = useState<number>(defaults.hourlyRate);

  const { humanCost, savings, savingsPct, breakEvenDays, roiPct, hoursSaved } = useMemo(() => {
    const totalMinutes = tasks * defaults.minutesPerTask;
    const hoursSaved = totalMinutes / 60;
    const humanCost = hoursSaved * rate;
    const savings = Math.max(0, humanCost - monthlyPrice);
    const savingsPct = humanCost > 0 ? Math.round((savings / humanCost) * 100) : 0;
    // Break-even: quantos dias do mês trabalhando pra pagar o depto
    const dailyHumanCost = humanCost / 30;
    const breakEvenDays = dailyHumanCost > 0 ? Math.max(1, Math.round(monthlyPrice / dailyHumanCost)) : 30;
    const roiPct = monthlyPrice > 0 ? Math.round((savings / monthlyPrice) * 100) : 0;
    return { humanCost, savings, savingsPct, breakEvenDays, roiPct, hoursSaved: Math.round(hoursSaved) };
  }, [tasks, rate, monthlyPrice, defaults.minutesPerTask]);

  const worthIt = savings > 0;

  return (
    <section className={cn("space-y-4", className)} aria-labelledby="roi-calc-title">
      <div className="flex items-center gap-2">
        <Calculator className="w-5 h-5 text-primary" />
        <h2 id="roi-calc-title" className="text-2xl font-display font-semibold">
          Calcule o seu ROI
        </h2>
      </div>
      <p className="text-sm text-white/60 max-w-2xl">
        Ajuste os números pro seu contexto. A conta é feita em tempo real —
        sem cadastro, sem pegadinha. Você vê exatamente quando o departamento se paga.
      </p>

      <Card className="p-6 bg-white/[0.02] border-white/10 rounded-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="space-y-6">
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <label className="text-sm text-white/70">
                  Quantos <span className="text-white font-medium">{defaults.taskLabel}</span> por mês?
                </label>
                <span className="text-lg font-semibold text-white tabular-nums">
                  {tasks.toLocaleString("pt-BR")}
                </span>
              </div>
              <Slider
                value={[tasks]}
                onValueChange={(v) => setTasks(v[0] ?? 0)}
                min={10}
                max={Math.max(1000, defaults.tasksPerMonth * 5)}
                step={10}
                aria-label="Tarefas por mês"
              />
              <div className="flex justify-between text-[10px] text-white/30 mt-1 tabular-nums">
                <span>10</span>
                <span>{(Math.max(1000, defaults.tasksPerMonth * 5)).toLocaleString("pt-BR")}</span>
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-2">
                <label className="text-sm text-white/70">
                  Custo médio por hora da sua equipe
                </label>
                <span className="text-lg font-semibold text-white tabular-nums">
                  {formatBRL(rate)}
                </span>
              </div>
              <Slider
                value={[rate]}
                onValueChange={(v) => setRate(v[0] ?? 0)}
                min={20}
                max={250}
                step={5}
                aria-label="Custo por hora"
              />
              <div className="flex justify-between text-[10px] text-white/30 mt-1 tabular-nums">
                <span>R$ 20</span>
                <span>R$ 250</span>
              </div>
            </div>

            <div className="text-xs text-white/40 leading-relaxed pt-2 border-t border-white/5">
              Base: cada {defaults.taskLabel.replace(/s$/, "")} consome ~{defaults.minutesPerTask} min do seu time hoje.
              Total: {hoursSaved.toLocaleString("pt-BR")} h/mês que a IA absorve.
            </div>
          </div>

          {/* Outputs */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
                  Sua equipe hoje
                </div>
                <div className="text-xl font-semibold text-white/70 line-through decoration-white/30 tabular-nums">
                  {formatBRL(humanCost)}
                </div>
                <div className="text-[11px] text-white/40">por mês</div>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
                  Com Clauthor
                </div>
                <div className="text-xl font-semibold text-white tabular-nums">
                  {formatBRL(monthlyPrice)}
                </div>
                <div className="text-[11px] text-white/40">por mês, ilimitado</div>
              </div>
            </div>

            <div
              className={cn(
                "rounded-2xl border p-5 transition-colors",
                worthIt
                  ? "bg-emerald-500/[0.06] border-emerald-500/30"
                  : "bg-amber-500/[0.06] border-amber-500/30",
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className={cn("w-4 h-4", worthIt ? "text-emerald-400" : "text-amber-400")} />
                <div className="text-[10px] uppercase tracking-wider text-white/60">
                  Você economiza
                </div>
              </div>
              <div
                className={cn(
                  "text-3xl font-display font-semibold tabular-nums",
                  worthIt ? "text-emerald-400" : "text-amber-400",
                )}
              >
                {formatBRL(savings)}
                {worthIt && (
                  <span className="text-base font-normal text-white/50"> · {savingsPct}%</span>
                )}
              </div>
              <div className="text-xs text-white/50 mt-1">
                por mês, líquido do custo da assinatura
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3 h-3 text-white/40" />
                  <div className="text-[10px] uppercase tracking-wider text-white/40">
                    Se paga em
                  </div>
                </div>
                <div className="text-2xl font-semibold text-white tabular-nums">
                  {breakEvenDays}<span className="text-sm text-white/40"> dias</span>
                </div>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
                  ROI mensal
                </div>
                <div className="text-2xl font-semibold text-white tabular-nums">
                  {roiPct}<span className="text-sm text-white/40">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 text-[11px] text-white/40 leading-relaxed">
          Estimativa baseada nos seus inputs. Cálculo:
          ({defaults.taskLabel} × {defaults.minutesPerTask} min) ÷ 60 × custo/hora − {formatBRL(monthlyPrice)}.
          Não inclui ganhos indiretos (velocidade, redução de erro, escala).
        </div>
      </Card>
    </section>
  );
}
