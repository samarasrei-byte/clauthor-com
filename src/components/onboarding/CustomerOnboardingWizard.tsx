import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Zap, Target, Plug, Rocket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  SETUP_STEPS,
  STEP_LABELS,
  useCustomerOnboarding,
  type SubjectType,
  type SetupAnswers,
  type SetupStep,
} from "@/hooks/useCustomerOnboarding";

interface Props {
  subjectType: SubjectType;
  subjectRef: string;
  subjectName?: string;
  onFinish?: () => void;
}

const URGENCY_OPTIONS = [
  { value: "high", label: "Alta", hint: "Preciso operar em dias" },
  { value: "medium", label: "Média", hint: "Nas próximas semanas" },
  { value: "low", label: "Baixa", hint: "Sem pressa, escalar aos poucos" },
] as const;

const CHANNEL_OPTIONS = ["WhatsApp", "E-mail", "LinkedIn", "Instagram", "Site", "CRM"];

const CREDENTIAL_HINTS: Record<SubjectType, string[]> = {
  agent: ["Login da ferramenta principal", "API key (se aplicável)"],
  squad: ["CRM/planilha de leads", "E-mail corporativo", "WhatsApp Business"],
  department: ["CRM", "ERP/financeiro", "Canal de atendimento", "Base de conhecimento"],
};

export default function CustomerOnboardingWizard({ subjectType, subjectRef, subjectName, onFinish }: Props) {
  const navigate = useNavigate();
  const { row, prefill, loading, saving, progress, goToStep, complete, skip } = useCustomerOnboarding({
    subjectType,
    subjectRef,
    subjectName,
  });

  const [draft, setDraft] = useState<SetupAnswers>({});

  const step = (row?.current_step ?? "welcome") as SetupStep;
  const answers: SetupAnswers = useMemo(() => ({ ...(row?.answers ?? {}), ...draft }), [row, draft]);

  const detectedPain = (prefill?.detected_pain as string | undefined) ?? undefined;
  const businessSummary = (prefill?.business_summary as string | undefined) ?? undefined;

  const patch = (p: Partial<SetupAnswers>) => setDraft((d) => ({ ...d, ...p }));

  const handleNext = async (next: SetupStep) => {
    await goToStep(next, draft);
    setDraft({});
  };

  const handleComplete = async () => {
    await complete(draft);
    toast.success("Setup concluído. Bem-vindo à operação.");
    onFinish?.();
    navigate("/dashboard");
  };

  const handleSkip = async () => {
    await skip();
    toast("Você pode retomar depois em Configurações.");
    navigate("/dashboard");
  };

  if (loading || !row) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#050505] text-white/60">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#050505] text-white flex flex-col">
      {/* HUD */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
              Setup · {subjectType === "agent" ? "Agente" : subjectType === "squad" ? "Squad" : "Departamento"}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {SETUP_STEPS.map((s, i) => {
              const done = row.steps_completed.includes(s);
              const active = s === step;
              return (
                <div key={s} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      done ? "bg-emerald-400" : active ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" : "bg-white/20",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-mono uppercase tracking-widest",
                      active ? "text-cyan-400" : done ? "text-white/60" : "text-white/30",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")} {STEP_LABELS[s]}
                  </span>
                </div>
              );
            })}
          </div>
          <button onClick={handleSkip} className="text-[11px] font-mono text-white/40 hover:text-white/70 transition-colors">
            pular
          </button>
        </div>
        <div className="h-0.5 bg-white/5">
          <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {step === "welcome" && (
              <motion.section
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" /> Contratação confirmada
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent leading-[1.05]">
                  {subjectName ?? "Sua solução"} está pronto para operar.
                </h1>
                <p className="text-white/60 leading-relaxed">
                  Vou te guiar em 4 minutos para deixar {subjectName ?? "isso"} rodando no seu contexto.
                  {businessSummary && (
                    <>
                      {" "}Já sei que <span className="text-white">{businessSummary}</span>.
                    </>
                  )}
                </p>
                {detectedPain && (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-sm text-white/70">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block mb-1">Dor mapeada</span>
                    {detectedPain}
                  </div>
                )}
                <div className="pt-2 flex justify-end">
                  <Button onClick={() => handleNext("diagnostic")} disabled={saving} className="bg-white text-black hover:bg-cyan-300 rounded-2xl h-12 px-6 gap-2 font-bold">
                    Começar setup <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.section>
            )}

            {step === "diagnostic" && (
              <motion.section
                key="diagnostic"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <StepHeader index={2} title="Aprofunde a necessidade" icon={<Target className="w-5 h-5" />} />
                <div className="space-y-5">
                  <Field label="Qual é o objetivo #1 nos próximos 30 dias?">
                    <Textarea
                      placeholder="Ex: aumentar reuniões qualificadas em 3x"
                      defaultValue={(answers.primary_goal as string) ?? ""}
                      onChange={(e) => patch({ primary_goal: e.target.value })}
                      className="bg-white/5 border-white/15 rounded-xl min-h-[80px]"
                      maxLength={500}
                    />
                  </Field>
                  <Field label="Qual a urgência?">
                    <div className="grid grid-cols-3 gap-2">
                      {URGENCY_OPTIONS.map((o) => {
                        const active = answers.urgency === o.value;
                        return (
                          <button
                            key={o.value}
                            onClick={() => patch({ urgency: o.value })}
                            className={cn(
                              "p-3 rounded-xl border text-left transition-all",
                              active
                                ? "bg-cyan-500/10 border-cyan-400 text-white"
                                : "bg-white/[0.03] border-white/10 text-white/70 hover:border-white/25",
                            )}
                          >
                            <p className="text-sm font-semibold">{o.label}</p>
                            <p className="text-[10px] text-white/40 mt-1">{o.hint}</p>
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  {subjectType !== "agent" && (
                    <Field label="Algo específico que ainda não capturamos?">
                      <Input
                        placeholder="Opcional"
                        defaultValue={(answers.extra_pain as string) ?? ""}
                        onChange={(e) => patch({ extra_pain: e.target.value })}
                        className="bg-white/5 border-white/15 rounded-xl h-11"
                        maxLength={300}
                      />
                    </Field>
                  )}
                </div>
                <NavRow onBack={() => goToStep("welcome")} onNext={() => handleNext("credentials")} nextDisabled={!answers.primary_goal || !answers.urgency || saving} />
              </motion.section>
            )}

            {step === "credentials" && (
              <motion.section
                key="credentials"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <StepHeader index={3} title="Conexões necessárias" icon={<Plug className="w-5 h-5" />} />
                <p className="text-white/60 text-sm">
                  Vamos precisar destes acessos para operar. Você pode configurar depois em Integrações — aqui só marcamos o que você já tem em mãos.
                </p>
                <div className="space-y-2.5">
                  {CREDENTIAL_HINTS[subjectType].map((c) => {
                    const arr = (answers.main_channels as string[] | undefined) ?? [];
                    const active = arr.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() =>
                          patch({
                            main_channels: active ? arr.filter((x) => x !== c) : [...arr, c],
                          })
                        }
                        className={cn(
                          "w-full p-4 rounded-2xl border flex items-center gap-3 text-left transition-all",
                          active ? "bg-emerald-500/10 border-emerald-400/50" : "bg-white/[0.03] border-white/10 hover:border-white/25",
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                          active ? "bg-emerald-400 border-emerald-400" : "border-white/25",
                        )}>
                          {active && <CheckCircle2 className="w-4 h-4 text-black" />}
                        </div>
                        <span className="text-sm text-white/90 font-medium">{c}</span>
                      </button>
                    );
                  })}
                </div>
                <Field label="Canais principais onde a operação acontece">
                  <div className="flex flex-wrap gap-2">
                    {CHANNEL_OPTIONS.map((ch) => {
                      const arr = (answers.main_channels as string[] | undefined) ?? [];
                      const active = arr.includes(ch);
                      return (
                        <button
                          key={ch}
                          onClick={() =>
                            patch({
                              main_channels: active ? arr.filter((x) => x !== ch) : [...arr, ch],
                            })
                          }
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                            active
                              ? "bg-cyan-500/15 border-cyan-400/50 text-cyan-100"
                              : "bg-white/[0.03] border-white/10 text-white/60 hover:border-white/25",
                          )}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <NavRow onBack={() => goToStep("diagnostic")} onNext={() => handleNext("kpis")} nextDisabled={saving} />
              </motion.section>
            )}

            {step === "kpis" && (
              <motion.section
                key="kpis"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <StepHeader index={4} title="Meta de sucesso" icon={<Zap className="w-5 h-5" />} />
                <Field label="Qual métrica vamos usar para dizer que valeu a pena?">
                  <Input
                    placeholder="Ex: 15 reuniões qualificadas / semana"
                    defaultValue={(answers.success_metric as string) ?? ""}
                    onChange={(e) => patch({ success_metric: e.target.value })}
                    className="bg-white/5 border-white/15 rounded-xl h-11"
                    maxLength={200}
                  />
                </Field>
                <Field label="Faixa de investimento mensal (aproximada)">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {["< R$ 500", "R$ 500–2k", "R$ 2k–10k", "> R$ 10k"].map((b) => {
                      const active = answers.budget_range === b;
                      return (
                        <button
                          key={b}
                          onClick={() => patch({ budget_range: b })}
                          className={cn(
                            "p-3 rounded-xl border text-sm font-semibold transition-all",
                            active
                              ? "bg-violet-500/15 border-violet-400/50 text-white"
                              : "bg-white/[0.03] border-white/10 text-white/60 hover:border-white/25",
                          )}
                        >
                          {b}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <NavRow onBack={() => goToStep("credentials")} onNext={() => handleNext("first_action")} nextDisabled={!answers.success_metric || saving} />
              </motion.section>
            )}

            {step === "first_action" && (
              <motion.section
                key="first_action"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <StepHeader index={5} title="Primeira ação" icon={<Rocket className="w-5 h-5" />} />
                <p className="text-white/60 text-sm">
                  Descreva a primeira tarefa que você quer que <span className="text-white">{subjectName ?? "seu agente"}</span> execute assim que entrar no dashboard.
                </p>
                <Field label="Primeira tarefa">
                  <Textarea
                    placeholder="Ex: gerar 20 mensagens de outbound para leads que baixaram nosso material"
                    defaultValue={(answers.first_task as string) ?? ""}
                    onChange={(e) => patch({ first_task: e.target.value })}
                    className="bg-white/5 border-white/15 rounded-xl min-h-[100px]"
                    maxLength={800}
                  />
                </Field>
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-400/20 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <p className="text-sm text-white/80">
                    Ao concluir, essa tarefa aparece pré-preenchida no dashboard para você aprovar e executar.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" onClick={() => goToStep("kpis")} className="text-white/60 hover:text-white hover:bg-white/5">
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar
                  </Button>
                  <Button onClick={handleComplete} disabled={saving || !answers.first_task} className="bg-white text-black hover:bg-cyan-300 rounded-2xl h-12 px-6 gap-2 font-bold">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />} Ativar agora
                  </Button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

/* ─────────────── helpers ─────────────── */

function StepHeader({ index, title, icon }: { index: number; title: string; icon: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
        Etapa {String(index).padStart(2, "0")} / 05
      </p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-cyan-300">
          {icon}
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">{title}</h2>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-mono uppercase tracking-widest text-white/50">{label}</label>
      {children}
    </div>
  );
}

function NavRow({ onBack, onNext, nextDisabled }: { onBack: () => void; onNext: () => void; nextDisabled?: boolean }) {
  return (
    <div className="flex items-center justify-between pt-2">
      <Button variant="ghost" onClick={onBack} className="text-white/60 hover:text-white hover:bg-white/5">
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar
      </Button>
      <Button onClick={onNext} disabled={nextDisabled} className="bg-white text-black hover:bg-cyan-300 rounded-2xl h-11 px-5 gap-2 font-bold disabled:opacity-40">
        Continuar <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
