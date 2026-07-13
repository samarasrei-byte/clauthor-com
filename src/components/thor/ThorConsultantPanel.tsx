/**
 * ThorConsultantPanel — Thor atua como consultor antes da criação.
 *
 * Recebe o objetivo do usuário, chama a edge function `workforce-architect`
 * e devolve uma recomendação estruturada: escala sugerida (agente/squad/
 * departamento/org), lista de departamentos envolvidos, gaps identificados
 * e racional. O usuário pode aceitar (aplicar recomendação) ou seguir com a
 * criação direta.
 *
 * Não substitui os fluxos existentes — é um passo consultivo opcional que
 * aparece no topo de CreateAgent e CreateWorkforce.
 */
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { WORKFORCE_CATALOG, DEPARTMENTS } from "@/data/workforceCatalog";
import { cn } from "@/lib/utils";
import type { WorkforceScale, DepartmentKey } from "@/lib/workforce/types";

export interface ThorRecommendation {
  scale: WorkforceScale;
  selectedTemplates: string[];
  departments: { key: DepartmentKey; label: string; count: number }[];
  rationale: string;
  tools: string[];
  integrations: string[];
  channels: string[];
  autonomy: string;
  name: string;
}

interface Props {
  /** Contexto do usuário para pré-popular o objetivo. */
  defaultObjective?: string;
  /** Departamentos que o usuário já possui, se conhecidos. */
  existingDepartments?: DepartmentKey[];
  /** Escala que o usuário estava prestes a criar (para comparar). */
  intendedScale?: WorkforceScale;
  /** Callback quando o usuário aceita a recomendação do Thor. */
  onAccept?: (rec: ThorRecommendation) => void;
  /** Callback quando o usuário decide seguir sem consulta. */
  onSkip?: () => void;
  className?: string;
}

const SCALE_LABEL: Record<WorkforceScale, string> = {
  agent: "Agente único",
  squad: "Squad (3–4 agentes)",
  department: "Departamento completo (6–9 agentes)",
  org: "Organização multi-departamento",
};

const SCALE_UPGRADE_HINT: Partial<Record<WorkforceScale, string>> = {
  agent: "Um agente sozinho tende a virar gargalo. Considere squad ou departamento.",
  squad: "Squad enxuta funciona para times pequenos, mas cresce rápido.",
  department: "Departamento completo cobre a operação ponta a ponta.",
  org: "Multi-departamento exige governança e hierarquia bem definidas.",
};

export default function ThorConsultantPanel({
  defaultObjective = "",
  existingDepartments = [],
  intendedScale,
  onAccept,
  onSkip,
  className,
}: Props) {
  const [objective, setObjective] = useState(defaultObjective);
  const [loading, setLoading] = useState(false);
  const [rec, setRec] = useState<ThorRecommendation | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const analyze = async () => {
    const trimmed = objective.trim();
    if (trimmed.length < 15) {
      toast.error("Descreva seu objetivo com pelo menos 15 caracteres.");
      return;
    }
    setLoading(true);
    setRec(null);
    try {
      const { data, error } = await supabase.functions.invoke("workforce-architect", {
        body: { objective: trimmed, scale: intendedScale ?? "auto" },
      });
      if (error) throw error;
      const bp = (data as { blueprint?: any })?.blueprint;
      if (!bp || !Array.isArray(bp.selectedTemplates)) {
        throw new Error("Resposta inválida do consultor.");
      }
      // Aggregate departments from selected templates
      const deptCount = new Map<DepartmentKey, number>();
      for (const id of bp.selectedTemplates as string[]) {
        const tpl = WORKFORCE_CATALOG.find((t) => t.id === id);
        if (tpl) deptCount.set(tpl.department, (deptCount.get(tpl.department) ?? 0) + 1);
      }
      const departments = Array.from(deptCount.entries())
        .map(([key, count]) => ({
          key,
          label: DEPARTMENTS.find((d) => d.key === key)?.label ?? String(key),
          count,
        }))
        .sort((a, b) => b.count - a.count);

      setRec({
        scale: bp.scale,
        selectedTemplates: bp.selectedTemplates,
        departments,
        rationale: bp.rationale ?? "",
        tools: bp.tools ?? [],
        integrations: bp.integrations ?? [],
        channels: bp.channels ?? [],
        autonomy: bp.autonomy ?? "specialist",
        name: bp.name ?? "",
      });
    } catch (e: any) {
      toast.error(e?.message || "Não consegui analisar agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const gaps = useMemo(() => {
    if (!rec) return [];
    const existing = new Set(existingDepartments);
    return rec.departments.filter((d) => !existing.has(d.key));
  }, [rec, existingDepartments]);

  const scaleMismatch = rec && intendedScale && rec.scale !== intendedScale;

  if (collapsed) {
    return (
      <div className={cn("flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-2", className)}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Brain className="h-4 w-4 text-primary" />
          Thor consultor dispensado.
        </div>
        <Button size="sm" variant="ghost" onClick={() => setCollapsed(false)}>
          Reabrir
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background", className)}>
      <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.25),transparent_60%)]" />
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Thor consultor
                <Badge variant="secondary" className="text-[10px]">Recomendado</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Antes de criar, deixa eu analisar seu contexto e sugerir a estrutura ideal.
              </p>
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={() => { setCollapsed(true); onSkip?.(); }} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Qual é o objetivo de negócio? Seja específico.
          </label>
          <Textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="Ex: Quero triplicar o pipeline de vendas B2B em 90 dias sem contratar mais SDRs."
            rows={3}
            className="glass"
            disabled={loading}
          />
          {existingDepartments.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Já ativos: {existingDepartments.map((d) => DEPARTMENTS.find((x) => x.key === d)?.label ?? d).join(" · ")}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={analyze} disabled={loading || objective.trim().length < 15} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Analisando…" : "Analisar meu contexto"}
          </Button>
          <Button variant="ghost" onClick={() => { setCollapsed(true); onSkip?.(); }}>
            Já sei o que quero criar
          </Button>
        </div>

        <AnimatePresence>
          {rec && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3 pt-2 border-t border-border/60"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Recomendação do Thor</p>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/50 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Escala ideal</span>
                  <Badge className="text-xs">{SCALE_LABEL[rec.scale]}</Badge>
                </div>
                {scaleMismatch && (
                  <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>
                      Você ia criar <strong>{SCALE_LABEL[intendedScale!]}</strong>, mas seu objetivo pede <strong>{SCALE_LABEL[rec.scale]}</strong>. {SCALE_UPGRADE_HINT[intendedScale!] ?? ""}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Departamentos envolvidos ({rec.departments.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {rec.departments.map((d) => {
                    const isGap = gaps.some((g) => g.key === d.key);
                    return (
                      <Badge
                        key={d.key}
                        variant={isGap ? "default" : "secondary"}
                        className={cn("text-xs gap-1", isGap && "bg-primary/15 text-primary border border-primary/30")}
                      >
                        {d.label} · {d.count}
                        {isGap && <span className="text-[9px] uppercase tracking-wider">novo</span>}
                      </Badge>
                    );
                  })}
                </div>
                {existingDepartments.length > 0 && gaps.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Thor sugere ativar <strong>{gaps.length}</strong> departamento(s) que você ainda não tem: {gaps.map((g) => g.label).join(", ")}.
                  </p>
                )}
              </div>

              {rec.rationale && (
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Racional</p>
                  <p className="text-sm leading-relaxed">{rec.rationale}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {onAccept && (
                  <Button onClick={() => onAccept(rec)} className="gap-2">
                    Aplicar recomendação <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" onClick={analyze} disabled={loading} className="gap-2">
                  Refazer análise
                </Button>
                <Button variant="ghost" onClick={() => { setCollapsed(true); onSkip?.(); }}>
                  Ignorar e criar do meu jeito
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
