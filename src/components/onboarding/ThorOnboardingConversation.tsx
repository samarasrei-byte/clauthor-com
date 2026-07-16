import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Send, Sparkles, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyDna, type BrandColors } from "@/hooks/useCompanyDna";
import { useToast } from "@/hooks/use-toast";
import ClauthorLogo from "@/components/ClauthorLogo";
import { fromHomeChat, type RecommendationResult } from "@/lib/onboarding-recommendation";
import { DEPARTMENT_PACKAGES } from "@/data/departmentPackages";

type Role = "assistant" | "user";
interface Bubble {
  id: string;
  role: Role;
  content: string;
}

interface HomeReco {
  kind: "departamento" | "squad" | "agente";
  deptId?: string;
  ts: number;
  company_name?: string | null;
  industry?: string | null;
  size?: string | null;
  budget?: string | null;
  main_pain?: string | null;
  business_summary?: string | null;
  last_user_message?: string | null;
}

interface Props {
  homeReco: HomeReco | null;
  onDone: (result: {
    dnaSaved: boolean;
    recommendation: RecommendationResult | null;
    pendingDeptId: string | null;
  }) => void;
  onSkip: () => void;
}

type StepId =
  | "greet"
  | "company_name"
  | "site"
  | "industry"
  | "colors"
  | "team_size"
  | "pain"
  | "confirm"
  | "done";

interface StepDef {
  id: StepId;
  ask: (ctx: Answers) => string;
  placeholder?: string;
  optional?: boolean;
  parse?: (raw: string) => string;
}

interface Answers {
  company_name?: string;
  site?: string;
  industry?: string;
  primary_color?: string;
  team_size?: string;
  pain?: string;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const STEPS: StepDef[] = [
  {
    id: "company_name",
    ask: () => "Qual é o nome da sua empresa? Se ainda não tem, pode escrever o nome do projeto.",
    placeholder: "Ex.: Acme Consultoria",
  },
  {
    id: "site",
    ask: (a) => `Perfeito, ${a.company_name ?? "beleza"}. Você tem site ou landing page? Cola a URL — se não tiver, escreve "não".`,
    placeholder: "https://...",
    optional: true,
  },
  {
    id: "industry",
    ask: () => "Em uma frase: qual é o segmento e o que a empresa entrega? (ex.: SaaS jurídico para pequenos escritórios)",
    placeholder: "Segmento + o que vocês fazem",
  },
  {
    id: "colors",
    ask: () => "Qual é a cor principal da marca? Cola o hex (#RRGGBB) ou o nome — a gente aplica no painel.",
    placeholder: "#3B82F6 · azul · vermelho...",
    optional: true,
    parse: (raw) => {
      const trimmed = raw.trim();
      const hex = trimmed.match(/#?([0-9a-fA-F]{6})/);
      if (hex) return `#${hex[1].toUpperCase()}`;
      const map: Record<string, string> = {
        azul: "#3B82F6", vermelho: "#DC2626", verde: "#059669",
        amarelo: "#F59E0B", roxo: "#7C3AED", preto: "#0F172A",
        branco: "#F8FAFC", laranja: "#EA580C", rosa: "#EC4899",
      };
      const key = trimmed.toLowerCase();
      return map[key] ?? trimmed;
    },
  },
  {
    id: "team_size",
    ask: () => "Quantas pessoas no time hoje? (solo · 2-10 · 11-50 · 50+)",
    placeholder: "solo · 2-10 · 11-50 · 50+",
  },
  {
    id: "pain",
    ask: () => "Última pergunta: qual é a maior dor da operação hoje? Fala com suas palavras.",
    placeholder: "Ex.: perdemos lead porque ninguém responde a tempo",
  },
];

export default function ThorOnboardingConversation({ homeReco, onDone, onSkip }: Props) {
  const { user } = useAuth();
  const { save, saving } = useCompanyDna();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [stepIdx, setStepIdx] = useState<number>(-1);
  const [answers, setAnswers] = useState<Answers>({});
  const [finishing, setFinishing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const recommendation = useMemo<RecommendationResult | null>(
    () => (homeReco ? fromHomeChat({ kind: homeReco.kind, deptId: homeReco.deptId }) : null),
    [homeReco],
  );

  // Kickoff: greeting + first question
  useEffect(() => {
    const greeting = recommendation
      ? `Oi! Sou o Thor. Você já me contou lá na home que precisa de **${recommendation.primary.title.toLowerCase()}** — legal. Antes de destravar seu painel, deixa eu conhecer sua empresa em 6 perguntas rápidas. Isso vai personalizar tudo daqui pra frente.`
      : "Oi! Sou o Thor, seu copiloto na Clauthor. Antes de montar seu time, deixa eu conhecer sua empresa em 6 perguntas rápidas. Você pode pular qualquer uma que quiser.";
    setMessages([
      { id: uid(), role: "assistant", content: greeting },
      { id: uid(), role: "assistant", content: STEPS[0].ask({}) },
    ]);
    setStepIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    inputRef.current?.focus();
  }, [messages]);

  const currentStep = stepIdx >= 0 && stepIdx < STEPS.length ? STEPS[stepIdx] : null;

  const persistDna = async (final: Answers) => {
    if (!user) return false;
    const brand_colors: BrandColors = {};
    if (final.primary_color?.startsWith("#")) brand_colors.primary = final.primary_color;
    const source_url = final.site && final.site.toLowerCase() !== "não" && final.site.toLowerCase() !== "nao"
      ? (final.site.startsWith("http") ? final.site : `https://${final.site}`)
      : null;
    const saved = await save({
      scope: "own",
      client_label: final.company_name ?? null,
      source_url,
      brand_colors,
      fonts: [],
      logo_url: null,
      favicon_url: null,
      core_business: final.industry ?? null,
      pain_points: final.pain ? [final.pain] : [],
      industry: final.industry ?? null,
    });
    return !!saved;
  };

  const createPendingDepartment = async (deptSlug: string, pain: string | null) => {
    if (!user) return null;
    const pkg = DEPARTMENT_PACKAGES.find((p) => p.id === deptSlug);
    if (!pkg) return null;
    const monthlyCents = Math.round((pkg.priceMonthly ?? 1700) * 100);
    const { data, error } = await supabase
      .from("contracted_departments")
      .insert({
        user_id: user.id,
        department_id: deptSlug,
        department_name: pkg.name ?? deptSlug,
        department_icon: null,
        monthly_price_cents: monthlyCents,
        currency: "BRL",
        agent_count: pkg.agentSlugs?.length ?? 0,
        agent_ids: [],
        pain_point: pain,
        company_snapshot: {
          name: answers.company_name ?? null,
          contact_name: user.user_metadata?.full_name ?? null,
          email: user.email ?? null,
        } as any,
        onboarding_snapshot: {
          site: answers.site ?? null,
          industry: answers.industry ?? null,
          team_size: answers.team_size ?? null,
          primary_color: answers.primary_color ?? null,
          from: "onboarding_conversation",
        } as any,
        status: "pending_payment",
      })
      .select("id")
      .maybeSingle();
    if (error) {
      console.warn("[onboarding] pending dept create failed", error);
      return null;
    }
    return data?.id ?? null;
  };

  const askAt = (idx: number, nextAnswers: Answers) => {
    if (idx >= STEPS.length) {
      // move to confirm step
      const dept = recommendation?.primary;
      const confirmMsg = dept
        ? `Perfeito, entendi tudo. Baseado no que você me contou, minha recomendação continua sendo **${dept.title}** — ${dept.pitch} Faz sentido pra você?`
        : "Perfeito, entendi tudo. Vou te levar ao painel pra você escolher o time ideal.";
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: confirmMsg },
      ]);
      setConfirming(true);
      setStepIdx(STEPS.length);
      return;
    }
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "assistant", content: STEPS[idx].ask(nextAnswers) },
    ]);
    setStepIdx(idx);
  };

  const handleSubmitAnswer = (raw: string) => {
    if (!currentStep || confirming || finishing) return;
    const trimmed = raw.trim();
    if (!trimmed && !currentStep.optional) return;
    const parsed = currentStep.parse ? currentStep.parse(trimmed) : trimmed;
    const visible = trimmed || "(pular)";
    setMessages((prev) => [...prev, { id: uid(), role: "user", content: visible }]);
    setInput("");
    const key: keyof Answers =
      currentStep.id === "company_name" ? "company_name" :
      currentStep.id === "site" ? "site" :
      currentStep.id === "industry" ? "industry" :
      currentStep.id === "colors" ? "primary_color" :
      currentStep.id === "team_size" ? "team_size" :
      "pain";
    const nextAnswers: Answers = { ...answers, [key]: parsed || undefined };
    setAnswers(nextAnswers);
    setTimeout(() => askAt(stepIdx + 1, nextAnswers), 350);
  };

  const finalize = async (confirmed: boolean) => {
    setFinishing(true);
    const dnaSaved = await persistDna(answers);
    let pendingDeptId: string | null = null;
    if (confirmed && recommendation?.primary.kind === "department") {
      pendingDeptId = await createPendingDepartment(
        recommendation.primary.targetId,
        answers.pain ?? null,
      );
    }
    if (dnaSaved) {
      toast({
        title: "Perfil da empresa salvo",
        description: "Thor vai usar essas informações para personalizar o painel.",
      });
    }
    setFinishing(false);
    onDone({ dnaSaved, recommendation: confirmed ? recommendation : null, pendingDeptId });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer(input);
    }
  };

  const progress = Math.min(100, Math.round(((stepIdx + (confirming ? 1 : 0)) / (STEPS.length + 1)) * 100));

  return (
    <main className="min-h-dvh bg-background text-foreground flex flex-col">
      <header className="w-full px-6 md:px-10 pt-8 pb-4 flex items-center justify-between">
        <ClauthorLogo size="md" />
        <button
          type="button"
          onClick={onSkip}
          className="type-caption text-muted-foreground hover:text-foreground transition-colors"
        >
          Pular por agora
        </button>
      </header>

      <div className="px-6 md:px-10">
        <div className="max-w-2xl mx-auto h-px bg-[hsl(var(--hairline))] relative overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>
      </div>

      <section className="flex-1 flex flex-col items-center px-6 md:px-10 py-8">
        <div className="w-full max-w-2xl flex-1 flex flex-col">
          <div className="flex-1 space-y-4 py-4">
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={m.role === "assistant" ? "flex items-start gap-3" : "flex items-start gap-3 justify-end"}
              >
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={
                    m.role === "assistant"
                      ? "type-body text-foreground leading-relaxed max-w-[85%]"
                      : "type-body bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%]"
                  }
                  dangerouslySetInnerHTML={{
                    __html: m.content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
                  }}
                />
              </motion.div>
            ))}
            <div ref={endRef} />
          </div>

          {confirming ? (
            <div className="pt-4 border-t border-[hsl(var(--hairline))]">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={finishing || saving}
                  onClick={() => finalize(true)}
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
                >
                  {finishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Sim, é isso · levar ao painel
                </button>
                <button
                  type="button"
                  disabled={finishing || saving}
                  onClick={() => finalize(false)}
                  className="inline-flex items-center justify-center h-11 px-5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors border border-[hsl(var(--hairline))]"
                >
                  Prefiro explorar antes
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </button>
              </div>
              <p className="type-caption text-muted-foreground mt-3">
                Você não paga nada agora · a ativação acontece no painel.
              </p>
            </div>
          ) : (
            <div className="pt-4 border-t border-[hsl(var(--hairline))]">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={currentStep?.placeholder ?? "Digite sua resposta..."}
                  className="flex-1 h-11 px-4 rounded-lg bg-background border border-[hsl(var(--hairline))] focus:border-primary/50 outline-none text-sm"
                  disabled={finishing}
                />
                <button
                  type="button"
                  onClick={() => handleSubmitAnswer(input)}
                  disabled={finishing || (!input.trim() && !currentStep?.optional)}
                  className="h-11 w-11 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-30"
                  aria-label="Enviar resposta"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {currentStep?.optional && (
                <button
                  type="button"
                  onClick={() => handleSubmitAnswer("")}
                  className="mt-2 type-caption text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pular esta pergunta
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
