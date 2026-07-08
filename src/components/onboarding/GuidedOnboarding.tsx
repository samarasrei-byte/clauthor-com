import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Users, Building2, Bot, Check, ArrowRight, ArrowLeft,
  ShoppingCart, Headphones, DollarSign, Megaphone, Scale, Settings2,
  Coins, HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useGuidedOnboarding, type OnboardingAnswers, type OnboardingPath } from "@/hooks/useGuidedOnboarding";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Draft = Partial<Omit<OnboardingAnswers, "completedAt">>;

interface Option {
  value: string;
  label: string;
  desc?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const PATH_OPTIONS: (Option & { value: OnboardingPath })[] = [
  { value: "team", label: "Montar um time", desc: "Vários agentes trabalhando juntos", icon: Users },
  { value: "department", label: "Criar um departamento", desc: "Uma área inteira da empresa automatizada", icon: Building2 },
  { value: "agent", label: "Contratar um agente", desc: "Começar com um único especialista", icon: Bot },
];

const DEPARTMENTS: Option[] = [
  { value: "marketing", label: "Marketing", icon: Megaphone },
  { value: "vendas", label: "Vendas", icon: ShoppingCart },
  { value: "suporte", label: "Suporte", icon: Headphones },
  { value: "financeiro", label: "Financeiro", icon: DollarSign },
  { value: "juridico", label: "Jurídico", icon: Scale },
  { value: "outro", label: "Outro", icon: Settings2 },
];

const COMPANY_SIZE: Option[] = [
  { value: "1-10", label: "1–10 pessoas" },
  { value: "11-50", label: "11–50 pessoas" },
  { value: "51-200", label: "51–200 pessoas" },
  { value: "200+", label: "Mais de 200" },
];

const TOKEN_BUDGET: Option[] = [
  { value: "100", label: "Até R$ 100/mês", desc: "Explorar" },
  { value: "500", label: "R$ 500/mês", desc: "Operação leve" },
  { value: "1000", label: "R$ 1.000/mês", desc: "Time ativo" },
  { value: "5000+", label: "R$ 5.000+/mês", desc: "Escala" },
];

const TEAM_GOAL: Option[] = [
  { value: "vendas", label: "Crescer vendas", icon: ShoppingCart },
  { value: "atendimento", label: "Atender clientes", icon: Headphones },
  { value: "conteudo", label: "Criar conteúdo", icon: Megaphone },
  { value: "financeiro", label: "Operar financeiro", icon: DollarSign },
];

const PROCESS: Option[] = [
  { value: "sim", label: "Sim, bem definidos" },
  { value: "parcial", label: "Alguns, outros não" },
  { value: "nao", label: "Ainda não" },
];

const AGENT_AREA: Option[] = [
  { value: "vendas", label: "Vendas", icon: ShoppingCart },
  { value: "marketing", label: "Marketing", icon: Megaphone },
  { value: "suporte", label: "Suporte", icon: Headphones },
  { value: "financeiro", label: "Financeiro", icon: DollarSign },
  { value: "juridico", label: "Jurídico", icon: Scale },
  { value: "operacoes", label: "Operações", icon: Settings2 },
];

const FREQUENCY: Option[] = [
  { value: "diario", label: "Todo dia" },
  { value: "semanal", label: "Algumas vezes por semana" },
  { value: "eventual", label: "De vez em quando" },
];

interface ChoiceGridProps {
  options: Option[];
  value?: string;
  onChange: (v: string) => void;
  columns?: 2 | 3;
}

const ChoiceGrid = ({ options, value, onChange, columns = 2 }: ChoiceGridProps) => (
  <div className={cn("grid gap-2.5", columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2")}>
    {options.map((o) => {
      const Icon = o.icon;
      const selected = value === o.value;
      return (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "group relative text-left p-3.5 rounded-xl border transition-all",
            "hover:border-primary/40 hover:bg-primary/[0.03]",
            selected
              ? "border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]"
              : "border-border bg-card/50"
          )}
        >
          <div className="flex items-start gap-2.5">
            {Icon && (
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                selected ? "bg-primary/15 text-primary" : "bg-muted/50 text-muted-foreground group-hover:text-foreground"
              )}>
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight">{o.label}</p>
              {o.desc && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{o.desc}</p>}
            </div>
            {selected && (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
              </div>
            )}
          </div>
        </button>
      );
    })}
  </div>
);

const GuidedOnboarding = () => {
  const { isOpen, setIsOpen, save, skip } = useGuidedOnboarding();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({});
  const navigate = useNavigate();

  const path = draft.path;
  const totalSteps = path === "agent" ? 3 : 4; // path + 2 or 3 questions

  const canAdvance = () => {
    if (step === 0) return !!draft.path;
    if (path === "department") {
      if (step === 1) return !!draft.department;
      if (step === 2) return !!draft.companySize;
      if (step === 3) return !!draft.tokenBudget;
    }
    if (path === "team") {
      if (step === 1) return !!draft.teamGoal;
      if (step === 2) return !!draft.companySize;
      if (step === 3) return !!draft.processMaturity;
    }
    if (path === "agent") {
      if (step === 1) return !!draft.agentArea;
      if (step === 2) return !!draft.usageFrequency;
    }
    return false;
  };

  const finish = async () => {
    if (!path) return;
    await save(draft as Omit<OnboardingAnswers, "completedAt">);
    if (path === "team") navigate("/team-builder");
    else if (path === "department") navigate(`/departamentos${draft.department ? `?dept=${draft.department}` : ""}`);
    else if (path === "agent") navigate(`/library${draft.agentArea ? `?area=${draft.agentArea}` : ""}`);
  };

  const next = () => {
    if (step === totalSteps - 1) { finish(); return; }
    setStep((s) => s + 1);
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const renderStep = () => {
    if (step === 0) {
      return (
        <StepFrame
          title="O que você precisa hoje?"
          subtitle="Vamos direto ao ponto — em menos de 1 minuto sua conta estará pronta."
        >
          <ChoiceGrid
            options={PATH_OPTIONS}
            value={draft.path}
            onChange={(v) => setDraft((d) => ({ path: v as OnboardingPath }))}
          />
        </StepFrame>
      );
    }

    if (path === "department") {
      if (step === 1) return (
        <StepFrame title="Qual departamento você quer criar?" subtitle="Escolha a área que mais dói hoje. Você pode criar outras depois.">
          <ChoiceGrid options={DEPARTMENTS} value={draft.department} onChange={(v) => setDraft({ ...draft, department: v })} columns={3} />
        </StepFrame>
      );
      if (step === 2) return (
        <StepFrame title="Qual o tamanho da sua empresa?" subtitle="Isso nos ajuda a dimensionar o time ideal.">
          <ChoiceGrid options={COMPANY_SIZE} value={draft.companySize} onChange={(v) => setDraft({ ...draft, companySize: v })} />
        </StepFrame>
      );
      if (step === 3) return (
        <StepFrame
          title="Quanto você pretende investir em tokens?"
          subtitle={
            <span className="inline-flex items-center gap-1.5">
              Token = unidade de trabalho do agente.
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    Cada ação (responder email, criar post, analisar lead) consome tokens. Mais tokens = mais tarefas por mês.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
          }
          icon={Coins}
        >
          <ChoiceGrid options={TOKEN_BUDGET} value={draft.tokenBudget} onChange={(v) => setDraft({ ...draft, tokenBudget: v })} />
        </StepFrame>
      );
    }

    if (path === "team") {
      if (step === 1) return (
        <StepFrame title="Qual o objetivo do time?" subtitle="Vamos montar um squad focado nesse resultado.">
          <ChoiceGrid options={TEAM_GOAL} value={draft.teamGoal} onChange={(v) => setDraft({ ...draft, teamGoal: v })} />
        </StepFrame>
      );
      if (step === 2) return (
        <StepFrame title="Qual o tamanho da sua empresa?" subtitle="Para calibrar o esforço do time.">
          <ChoiceGrid options={COMPANY_SIZE} value={draft.companySize} onChange={(v) => setDraft({ ...draft, companySize: v })} />
        </StepFrame>
      );
      if (step === 3) return (
        <StepFrame title="Você já tem processos definidos?" subtitle="Sem problema se ainda não — os agentes ajudam a estruturar.">
          <ChoiceGrid options={PROCESS} value={draft.processMaturity} onChange={(v) => setDraft({ ...draft, processMaturity: v })} />
        </StepFrame>
      );
    }

    if (path === "agent") {
      if (step === 1) return (
        <StepFrame title="Em qual área você precisa de ajuda?" subtitle="Mostramos os melhores agentes dessa área.">
          <ChoiceGrid options={AGENT_AREA} value={draft.agentArea} onChange={(v) => setDraft({ ...draft, agentArea: v })} columns={3} />
        </StepFrame>
      );
      if (step === 2) return (
        <StepFrame title="Com que frequência vai usar?" subtitle="Para sugerir o plano de tokens certo.">
          <ChoiceGrid options={FREQUENCY} value={draft.usageFrequency} onChange={(v) => setDraft({ ...draft, usageFrequency: v })} />
        </StepFrame>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="sm:max-w-[560px] p-0 gap-0 overflow-hidden border-border/50 rounded-2xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Progress dots */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-300",
                  i < step ? "bg-primary" : i === step ? "bg-primary/60" : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className="mt-2 text-[10px] font-mono tracking-wider text-muted-foreground/70">
            PASSO {step + 1} DE {totalSteps}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="px-6 pt-4 pb-6"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between gap-3 border-t border-border/50 px-6 py-4 bg-muted/20">
          {step > 0 ? (
            <Button variant="ghost" size="sm" onClick={back} className="gap-1.5 text-muted-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </Button>
          ) : (
            <button
              onClick={skip}
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              Pular por agora
            </button>
          )}
          <Button size="sm" onClick={next} disabled={!canAdvance()} className="gap-1.5 min-w-[120px]">
            {step === totalSteps - 1 ? "Concluir" : "Continuar"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface StepFrameProps {
  title: string;
  subtitle?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

const StepFrame = ({ title, subtitle, children }: StepFrameProps) => (
  <div>
    <h2 className="font-display text-2xl font-bold leading-tight tracking-tight">{title}</h2>
    {subtitle && <p className="text-sm text-muted-foreground mt-1.5 mb-5 leading-relaxed">{subtitle}</p>}
    {!subtitle && <div className="mb-5" />}
    {children}
  </div>
);

export default GuidedOnboarding;
