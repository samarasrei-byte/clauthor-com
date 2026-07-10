import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Globe, Target, Building2, Zap, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatPrice } from "@/lib/pricing";
import { getRegion } from "@/lib/pricing";
import {
  PAIN_TO_RECOMMENDATION,
  PAIN_TO_DEPT_ID,
  markDiagnosisRecapSeen,
  type DiagnosisAnswers,
} from "@/lib/diagnosis-routing";
import type { HireIntent } from "@/pages/Auth";
import { trackKpi } from "@/lib/kpiTracker";

interface Props {
  open: boolean;
  diagnosis: DiagnosisAnswers;
  briefing?: string | null;
  siteSummary?: string | null;
  onClose: () => void;
  /** Called after we drop a hireIntent into localStorage so parent can trigger checkout flow. */
  onActivateDepartment: () => void;
}

const PAIN_LABELS: Record<string, string> = {
  leads: "Falta de leads e vendas",
  ops: "Operações repetitivas",
  content: "Marketing e conteúdo",
  support: "Atendimento ao cliente",
  legal: "Fluxo jurídico",
  other: "Outro desafio",
};

const DiagnosisRecapDialog = ({
  open,
  diagnosis,
  briefing,
  siteSummary,
  onClose,
  onActivateDepartment,
}: Props) => {
  const { i18n } = useTranslation();
  const rec = PAIN_TO_RECOMMENDATION[diagnosis.pain];
  const deptId = PAIN_TO_DEPT_ID[diagnosis.pain];

  const { price, currency, lang } = useMemo(() => {
    const l = i18n.language || "pt";
    const region = getRegion(l);
    const p = deptId ? (region.departments as Record<string, number>)[deptId] ?? 0 : 0;
    return { price: p, currency: region.currency, lang: l };
  }, [i18n.language, deptId]);

  const canActivate = !!deptId && price > 0;
  const formattedPrice = canActivate ? formatPrice(price, lang) : null;

  const handleActivate = () => {
    if (!canActivate || !deptId) return;
    const intent: HireIntent = {
      type: "department",
      label: rec.departmentLabel,
      departmentId: deptId,
      slugs: [deptId],
    };
    try {
      localStorage.setItem("hireIntent", JSON.stringify(intent));
    } catch {
      /* noop */
    }
    trackKpi("diagnosis_recap_activate", {
      department_id: deptId,
      department_name: rec.departmentLabel,
      source: "diagnosis_recap",
      price_monthly: price,
      pain: diagnosis.pain,
      has_briefing: !!briefing,
      has_site_summary: !!siteSummary,
    });
    markDiagnosisRecapSeen();
    onActivateDepartment();
  };

  const handleTalkToThor = () => {
    trackKpi("diagnosis_recap_talk_thor", {
      department_id: deptId ?? undefined,
      department_name: rec.departmentLabel,
      source: "diagnosis_recap",
      price_monthly: canActivate ? price : undefined,
      pain: diagnosis.pain,
      has_briefing: !!briefing,
      has_site_summary: !!siteSummary,
    });
    markDiagnosisRecapSeen();
    onClose();
  };


  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleTalkToThor()}>
      <DialogContent className="sm:max-w-xl bg-background border-border/20 p-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Diagnóstico Thor</DialogTitle>
          <DialogDescription>Resumo do diagnóstico e departamento recomendado.</DialogDescription>
        </VisuallyHidden>

        {/* Hero */}
        <div className="relative px-6 pt-7 pb-5 bg-gradient-to-b from-primary/8 to-transparent">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[320px] h-[200px] bg-primary/10 blur-[100px] rounded-full" />
          </div>
          <div className="relative z-10 text-center space-y-2">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="relative flex h-3 w-3 mx-auto"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
            </motion.div>
            <h2 className="font-display text-xl font-bold">Thor analisou o seu contexto</h2>
            <p className="text-sm text-muted-foreground">Confirme o diagnóstico antes de ativar o time.</p>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Briefing */}
          {briefing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-primary/15 bg-primary/[0.03] p-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/80 mb-2">
                Briefing do Thor
              </p>
              <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                {briefing.length > 480 ? `${briefing.slice(0, 480)}…` : briefing}
              </p>
            </motion.div>
          )}

          {/* Quiz recap */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border/10 bg-card/40 p-4 space-y-3"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Suas respostas
            </p>
            <div className="grid gap-2.5">
              {diagnosis.company && (
                <div className="flex items-start gap-2.5 text-sm">
                  <Building2 className="h-4 w-4 text-primary/60 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-muted-foreground text-xs">Empresa: </span>
                    <span className="font-medium">{diagnosis.company}</span>
                  </div>
                </div>
              )}
              {diagnosis.website && (
                <div className="flex items-start gap-2.5 text-sm">
                  <Globe className="h-4 w-4 text-primary/60 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-muted-foreground text-xs">Site: </span>
                    <span className="font-medium truncate">{diagnosis.website}</span>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2.5 text-sm">
                <Target className="h-4 w-4 text-primary/60 mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground text-xs">Prioridade: </span>
                  <span className="font-medium">{PAIN_LABELS[diagnosis.pain] ?? diagnosis.pain}</span>
                </div>
              </div>
            </div>

            {siteSummary && (
              <div className="pt-2 border-t border-border/10">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5">
                  O que o Thor leu do seu site
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {siteSummary.length > 280 ? `${siteSummary.slice(0, 280)}…` : siteSummary}
                </p>
              </div>
            )}
          </motion.div>

          {/* Recommended department */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <Badge variant="secondary" className="bg-primary/10 text-primary gap-1 text-[10px]">
                  <Zap className="h-3 w-3" /> Pré-ativado pelo Thor
                </Badge>
                <p className="font-display font-bold text-lg leading-tight">{rec.departmentLabel}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{rec.tagline}</p>
              </div>
              {canActivate && (
                <div className="text-right shrink-0">
                  <p className="font-display text-2xl font-bold text-primary">{formattedPrice}</p>
                  <p className="text-[10px] text-muted-foreground">/mês</p>
                </div>
              )}
            </div>

            <ul className="space-y-1.5 pt-1">
              {rec.does.slice(0, 3).map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-foreground/80">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary/70 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="space-y-2 pt-1"
          >
            {canActivate ? (
              <Button
                onClick={handleActivate}
                size="lg"
                className="w-full font-semibold h-12 rounded-xl"
              >
                <Zap className="h-4 w-4 mr-2" />
                Ativar {rec.departmentLabel} e ir pro pagamento
              </Button>
            ) : (
              <Button
                onClick={handleTalkToThor}
                size="lg"
                className="w-full font-semibold h-12 rounded-xl"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Continuar conversa com o Thor
              </Button>
            )}
            {canActivate && (
              <Button
                onClick={handleTalkToThor}
                variant="ghost"
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Falar com o Thor primeiro
              </Button>
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiagnosisRecapDialog;
