import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Palette, Target, Users, Trophy, ExternalLink, AlertCircle, Wand } from "lucide-react";
import { useCompanyDna, type CompanyIntelligence } from "@/hooks/useCompanyDna";

export interface AgentBriefing {
  icpDemographics: string;
  icpPains: string;
  icpJourney: string;
  leadCriteria: string;
  deliverables: string;
  kpis: string;
}

export const emptyBriefing: AgentBriefing = {
  icpDemographics: "",
  icpPains: "",
  icpJourney: "",
  leadCriteria: "",
  deliverables: "",
  kpis: "",
};

interface Props {
  value: AgentBriefing;
  onChange: (v: AgentBriefing) => void;
}

/**
 * Espelha o onboarding da empresa (DNA + ICP + entregas) para
 * garantir que todo novo agente já nasça com o contexto corporativo.
 */
export default function AgentCompanyBriefing({ value, onChange }: Props) {
  const { dna, loading } = useCompanyDna();

  const brandSwatches = useMemo(() => {
    const c = dna?.brand_colors ?? {};
    return [c.primary, c.secondary, c.accent].filter(Boolean) as string[];
  }, [dna]);

  const intelligence = (dna?.intelligence ?? {}) as CompanyIntelligence;
  const hasIntel = Boolean(
    intelligence.icp?.who ||
    intelligence.persona?.role ||
    (intelligence.suggested_pain_points?.length ?? 0) > 0,
  );

  const set = (patch: Partial<AgentBriefing>) => onChange({ ...value, ...patch });

  const autoFillFromDna = () => {
    const icp = intelligence.icp ?? {};
    const persona = intelligence.persona ?? {};
    const tone = intelligence.tone_of_voice ?? {};
    const patch: Partial<AgentBriefing> = {};
    if (!value.icpDemographics && (icp.who || icp.segment)) {
      patch.icpDemographics = [icp.who, icp.segment].filter(Boolean).join(" · ");
    }
    if (!value.icpPains) {
      const pains = intelligence.suggested_pain_points?.filter(Boolean) ?? [];
      if (pains.length) patch.icpPains = pains.slice(0, 4).join("; ");
      else if (persona.pain) patch.icpPains = persona.pain;
    }
    if (!value.icpJourney && icp.trigger) {
      patch.icpJourney = `Gatilho de contratação: ${icp.trigger}`;
    }
    if (!value.leadCriteria && persona.role) {
      patch.leadCriteria = `Decisor: ${persona.role}${tone.primary ? ` · Tom preferido: ${tone.primary}` : ""}`;
    }
    if (Object.keys(patch).length) onChange({ ...value, ...patch });
  };

  return (
    <Card className="glass border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          Contexto da empresa para o agente
          <Badge variant="secondary" className="ml-2 text-[10px]">Espelha o onboarding corporativo</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          O agente herda o DNA da empresa e recebe o ICP + entregas esperadas antes de executar qualquer tarefa.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* DNA snapshot */}
        {loading ? (
          <div className="h-16 rounded-xl border border-dashed border-border animate-pulse" />
        ) : dna ? (
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{dna.client_label || "Sua empresa"}</span>
              </div>
              {dna.source_url && (
                <a
                  href={dna.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  {dna.source_url.replace(/^https?:\/\//, "").split("/")[0]}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {dna.industry && <Badge variant="outline" className="text-[10px]">{dna.industry}</Badge>}
            </div>
            {dna.core_business && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Core:</span> {dna.core_business}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Palette className="h-3.5 w-3.5 text-muted-foreground" />
              {brandSwatches.length ? (
                brandSwatches.map((c, i) => (
                  <span
                    key={i}
                    className="w-5 h-5 rounded-md border border-border"
                    style={{ background: c }}
                    title={c}
                  />
                ))
              ) : (
                <span className="text-[11px] text-muted-foreground">Sem paleta detectada</span>
              )}
              {dna.logo_url && (
                <img src={dna.logo_url} alt="logo" className="h-5 ml-2 opacity-80" />
              )}
            </div>
            {dna.pain_points?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {dna.pain_points.slice(0, 4).map((p, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">{p}</Badge>
                ))}
              </div>
            )}
            <Link
              to="/welcome?force=1"
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              Ajustar DNA da empresa <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium">DNA da empresa ainda não configurado.</p>
              <p className="text-muted-foreground mt-0.5">
                Sem ele, o agente nasce genérico. Leva 90s.{" "}
                <Link to="/welcome" className="text-primary hover:underline">
                  Configurar agora
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* ICP */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-primary" /> Perfil de Cliente Ideal (ICP)
            </div>
            {hasIntel && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={autoFillFromDna}
                className="h-7 text-[11px] gap-1.5"
              >
                <Wand className="h-3 w-3" /> Preencher com Thor
              </Button>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Demografia & psicografia</Label>
              <Textarea
                value={value.icpDemographics}
                onChange={(e) => set({ icpDemographics: e.target.value })}
                placeholder="Ex: CEOs e diretores de PMEs (20-200 funcionários), setor de serviços, Brasil, movidos por eficiência."
                className="glass min-h-[70px] text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Dores & necessidades</Label>
              <Textarea
                value={value.icpPains}
                onChange={(e) => set({ icpPains: e.target.value })}
                placeholder="Ex: Times operacionais sobrecarregados, falta previsibilidade em vendas, custo alto de folha."
                className="glass min-h-[70px] text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Jornada do cliente</Label>
              <Textarea
                value={value.icpJourney}
                onChange={(e) => set({ icpJourney: e.target.value })}
                placeholder="Ex: Descobre pelo LinkedIn → agenda demo → prova por 14 dias → contrata departamento."
                className="glass min-h-[70px] text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Critérios de qualificação</Label>
              <Textarea
                value={value.leadCriteria}
                onChange={(e) => set({ leadCriteria: e.target.value })}
                placeholder="Ex: Faturamento > R$500k/mês, decisor identificado, dor validada, orçamento disponível."
                className="glass min-h-[70px] text-sm"
              />
            </div>
          </div>
        </div>

        {/* Deliverables */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Target className="h-4 w-4 text-primary" /> Entregas esperadas do agente
          </div>
          <Textarea
            value={value.deliverables}
            onChange={(e) => set({ deliverables: e.target.value })}
            placeholder="Ex: 20 leads qualificados/semana, 5 propostas enviadas, resumo executivo diário às 18h."
            className="glass min-h-[80px] text-sm"
          />
          <div className="flex items-center gap-2 text-sm font-semibold pt-1">
            <Trophy className="h-4 w-4 text-primary" /> Métricas de sucesso (KPIs)
          </div>
          <Input
            value={value.kpis}
            onChange={(e) => set({ kpis: e.target.value })}
            placeholder="Ex: Taxa de resposta > 20%, SLA < 2h, CAC < R$300"
            className="glass"
          />
        </div>
      </CardContent>
    </Card>
  );
}

/** Formata o briefing em bloco de instruções pro system prompt do agente. */
export function briefingToInstructions(b: AgentBriefing, dnaSummary?: string): string {
  const parts: string[] = [];
  if (dnaSummary) parts.push(`# Contexto da empresa\n${dnaSummary}`);
  const icp = [
    b.icpDemographics && `- Demografia: ${b.icpDemographics}`,
    b.icpPains && `- Dores: ${b.icpPains}`,
    b.icpJourney && `- Jornada: ${b.icpJourney}`,
    b.leadCriteria && `- Qualificação: ${b.leadCriteria}`,
  ].filter(Boolean);
  if (icp.length) parts.push(`# Perfil de Cliente Ideal\n${icp.join("\n")}`);
  if (b.deliverables) parts.push(`# Entregas esperadas\n${b.deliverables}`);
  if (b.kpis) parts.push(`# KPIs de sucesso\n${b.kpis}`);
  return parts.join("\n\n");
}
