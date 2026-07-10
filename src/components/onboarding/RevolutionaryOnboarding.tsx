import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, ClipboardPaste, ArrowRight, ArrowLeft,
  Loader2, CheckCircle2, Bot, Users, Building2, Zap, ShieldCheck, X,
  Radio, Cpu, Waves,
} from "lucide-react";

/** Núcleo Apple-like: dois círculos concêntricos monocromáticos, sem estrela. */
function CoreDot({ className = "", size = 14 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.95), rgba(255,255,255,0.15) 55%, transparent 70%)" }}
      />
      <span className="relative rounded-full bg-white" style={{ width: size * 0.35, height: size * 0.35 }} />
    </span>
  );
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FLAGSHIP_DEPARTMENTS, type DepartmentPackage } from "@/data/departmentPackages";
import { trackKpi } from "@/lib/kpiTracker";

type Step = "welcome" | "department" | "input" | "describe" | "analyzing" | "reveal" | "claim" | "done";

interface Classification {
  business_summary: string;
  detected_pain: string;
  need_type: "agent" | "squad" | "department";
  recommendation_name: string;
  recommendation_pitch: string;
  agents: string[];
  expected_outcome: string;
  confidence: number;
}

interface Props {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const NEED_META = {
  agent:      { icon: Bot,        label: "Agente Individual",     color: "#a78bfa", gradient: "from-violet-500/30 to-fuchsia-500/10" },
  squad:      { icon: Users,      label: "Squad Coordenado",      color: "#f43f5e", gradient: "from-rose-500/30 to-orange-500/10" },
  department: { icon: Building2,  label: "Departamento Completo", color: "#22d3ee", gradient: "from-cyan-500/30 to-blue-500/10" },
} as const;

const STEP_ORDER: Step[] = ["welcome", "department", "input", "describe", "analyzing", "reveal", "claim", "done"];
const STEP_LABELS: Record<Step, string> = {
  welcome:    "Contato",
  department: "Depto",
  input:      "Sinal",
  describe:   "Dor",
  analyzing:  "Fusão",
  reveal:     "Match",
  claim:      "Vaga",
  done:       "Online",
};

/* ─────────────────────────── Neural constellation ─────────────────────────── */

function NeuralBackdrop({ intensity }: { intensity: number }) {
  // intensity 0..1 grows as user progresses
  const nodes = useMemo(
    () =>
      Array.from({ length: 42 }).map((_, i) => ({
        id: i,
        x: (i * 71) % 100,
        y: (i * 43) % 100,
        d: 3 + (i % 5),
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[#04040a]" />
      {/* aurora estática, sem luzes viajando */}
      <div
        className="absolute -top-1/3 -left-1/4 w-[75vw] h-[75vw] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, #e11d48 0%, transparent 60%)", opacity: 0.18 + intensity * 0.12 }}
      />
      <div
        className="absolute -bottom-1/3 -right-1/4 w-[75vw] h-[75vw] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, #a78bfa 0%, transparent 60%)", opacity: 0.16 + intensity * 0.12 }}
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[55vw] h-[55vw] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, #22d3ee 0%, transparent 60%)", opacity: 0.10 + intensity * 0.10 }}
      />

      {/* SVG neural mesh (estático) */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.28]" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e11d48" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {nodes.map((a, i) =>
          nodes.slice(i + 1, i + 4).map((b) => {
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 22) return null;
            return (
              <line
                key={`${a.id}-${b.id}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="url(#line)"
                strokeWidth={0.08}
                opacity={0.35 + intensity * 0.35}
              />
            );
          })
        )}
        {nodes.map((n) => (
          <circle key={n.id} cx={n.x} cy={n.y} r={0.22} fill="#fff" opacity={0.5} />
        ))}
      </svg>

      {/* Grid sutil */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70" />
    </div>
  );
}

/* ─────────────────────────── Orb ─────────────────────────── */

function ThorOrb({ size = 96, pulsing = true }: { size?: number; pulsing?: boolean }) {
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: "conic-gradient(from 0deg, #e11d48, #a78bfa, #22d3ee, #e11d48)" }}
        animate={pulsing ? { rotate: 360 } : {}}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-[3px] rounded-full bg-[#04040a] flex items-center justify-center backdrop-blur-xl">
        <motion.div
          animate={pulsing ? { scale: [1, 1.12, 1], opacity: [0.75, 1, 0.75] } : {}}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <CoreDot size={size * 0.42} />
        </motion.div>
      </div>
      {pulsing && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border border-white/20"
            animate={{ scale: [1, 1.7], opacity: [0.6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-white/10"
            animate={{ scale: [1, 2.1], opacity: [0.4, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
          />
        </>
      )}
    </div>
  );
}

/* ─────────────────────────── Typewriter ─────────────────────────── */

function Typewriter({ text, speed = 18, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
  }, [text]);
  useEffect(() => {
    if (i >= text.length) { onDone?.(); return; }
    const t = setTimeout(() => setI((p) => p + 1), speed);
    return () => clearTimeout(t);
  }, [i, text, speed, onDone]);
  return (
    <span>
      {text.slice(0, i)}
      {i < text.length && <span className="inline-block w-[2px] h-[1em] align-middle bg-white/70 ml-0.5 animate-pulse" />}
    </span>
  );
}

/* ─────────────────────────── Step rail ─────────────────────────── */

function StepRail({ current }: { current: Step }) {
  const currentIdx = STEP_ORDER.indexOf(current);
  const visible: Step[] = ["welcome", "department", "input", "describe", "analyzing", "reveal", "claim"];
  return (
    <div className="flex items-center gap-2">
      {visible.map((s, i) => {
        const idx = STEP_ORDER.indexOf(s);
        const state = idx < currentIdx ? "done" : idx === currentIdx ? "active" : "pending";
        return (
          <div key={s} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={
                  state === "active"
                    ? { boxShadow: ["0 0 0 rgba(167,139,250,0)", "0 0 22px rgba(167,139,250,0.7)", "0 0 0 rgba(167,139,250,0)"] }
                    : {}
                }
                transition={{ duration: 1.8, repeat: Infinity }}
                className={cn(
                  "w-2.5 h-2.5 rounded-full border transition-colors",
                  state === "done" && "bg-cyan-300 border-cyan-200",
                  state === "active" && "bg-violet-400 border-violet-200",
                  state === "pending" && "bg-white/5 border-white/20"
                )}
              />
              <span className={cn(
                "text-[9px] uppercase tracking-widest font-mono",
                state === "pending" ? "text-white/25" : "text-white/70"
              )}>{STEP_LABELS[s]}</span>
            </div>
            {i < visible.length - 1 && (
              <div className={cn(
                "w-8 h-px transition-colors -mt-4",
                idx < currentIdx ? "bg-cyan-300/60" : "bg-white/10"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── Narrative rail (Thor messages) ─────────────────────────── */

function ThorLine({ children, delay = 0, typing = false }: { children: React.ReactNode; delay?: number; typing?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-start gap-2.5"
    >
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-500 via-violet-500 to-cyan-500 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_18px_rgba(167,139,250,0.5)]">
        <CoreDot size={10} />
      </div>
      <div className="text-[13px] text-white/75 leading-relaxed font-mono">
        {typing && typeof children === "string" ? <Typewriter text={children} /> : children}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────── Component ─────────────────────────── */

export default function RevolutionaryOnboarding({ isOpen, onComplete, onSkip }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("welcome");
  const [method, setMethod] = useState<"url" | "text" | null>(null);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<Classification | null>(null);
  const [loading, setLoading] = useState(false);
  const [claim, setClaim] = useState({ email: user?.email ?? "", whatsapp: "", company: "" });
  const [showAllAgents, setShowAllAgents] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const firstName = (user?.user_metadata?.full_name ?? "").split(" ")[0] || "";

  useEffect(() => {
    if (isOpen && step === "input") setTimeout(() => firstInputRef.current?.focus(), 350);
  }, [isOpen, step]);

  useEffect(() => {
    if (user?.email) setClaim((c) => ({ ...c, email: user.email ?? c.email }));
  }, [user?.email]);

  const normalizedUrl = useMemo(() => {
    const raw = url.trim();
    if (!raw) return "";
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, "")}`;
  }, [url]);

  const isValidUrl = useMemo(() => {
    if (!normalizedUrl) return false;
    try {
      const u = new URL(normalizedUrl);
      return /^[^\s.]+\.[^\s.]+/.test(u.hostname);
    } catch { return false; }
  }, [normalizedUrl]);

  const canAnalyze = useMemo(() => {
    if (method === "url") return isValidUrl;
    if (method === "text") return text.trim().length > 40;
    return false;
  }, [method, isValidUrl, text]);

  const intensity = useMemo(() => {
    const i = STEP_ORDER.indexOf(step);
    return Math.min(1, i / (STEP_ORDER.length - 1));
  }, [step]);

  function buildFallback(): Classification {
    const raw = `${description} ${text} ${normalizedUrl}`.toLowerCase();
    const has = (...ks: string[]) => ks.some((k) => raw.includes(k));
    let need_type: Classification["need_type"] = "agent";
    let name = "Agente Especialista";
    let agents = ["Especialista de Conteúdo"];
    if (has("marketing", "leads", "vendas", "prospec", "outbound", "linkedin")) {
      need_type = "squad";
      name = "Squad de Growth & Vendas";
      agents = ["Hunter LinkedIn", "SDR IA", "Copy Outbound", "Analista de Funil"];
    }
    if (has("operac", "processo", "financeiro", "juridic", "advocacia", "rh", "atendimento", "suporte")) {
      need_type = "department";
      name = "Departamento Operacional";
      agents = ["Ops Lead", "Analista Financeiro", "Compliance", "Atendimento N1", "Automação"];
    }
    return {
      business_summary: normalizedUrl ? `Negócio em ${new URL(normalizedUrl).hostname}` : "Negócio descrito pelo usuário",
      detected_pain: description || "Escalar operação sem contratar mais gente",
      need_type,
      recommendation_name: name,
      recommendation_pitch: "Recomendação baseada nos sinais que você compartilhou. Podemos refinar depois no painel.",
      agents,
      expected_outcome: "Primeiros resultados mensuráveis em 30 dias.",
      confidence: 0.55,
    };
  }

  /**
   * Fast path: usuário escolheu um departamento flagship no início do onboarding.
   * Pré-monta o `result` (sem chamar edge function) e pula direto para "reveal".
   */
  function pickDepartment(dept: DepartmentPackage) {
    const uniqueAgents = Array.from(new Set(dept.timelineDemo.map((e) => e.agentName)));
    setDescription(dept.painPoint);
    setResult({
      business_summary: `Empresa que precisa ativar um ${dept.name.toLowerCase()} pronto para operar.`,
      detected_pain: dept.painPoint,
      need_type: "department",
      recommendation_name: dept.name,
      recommendation_pitch: dept.outcome,
      agents: uniqueAgents,
      expected_outcome: dept.outcome,
      confidence: 0.92,
    });
    trackKpi("onboarding_department_picked", {
      department_id: dept.id,
      department_name: dept.name,
      price_monthly: dept.priceMonthly,
      source: "onboarding",
    });
    setStep("reveal");
  }



  async function runAnalysis() {
    setLoading(true);
    setStep("analyzing");
    try {
      const { data, error } = await supabase.functions.invoke("onboarding-classify", {
        body: {
          url: method === "url" ? normalizedUrl : undefined,
          text: method === "text" ? text : undefined,
          description,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setTimeout(() => {
        setResult(data as Classification);
        setStep("reveal");
      }, 800);
    } catch (e: any) {
      // Fallback local — nunca deixa o usuário travado
      console.warn("[onboarding] classify failed, using fallback", e);
      toast.message("Análise offline — usando recomendação inicial", {
        description: "Você pode refinar no painel depois.",
      });
      setTimeout(() => {
        setResult(buildFallback());
        setStep("reveal");
      }, 600);
    } finally {
      setLoading(false);
    }
  }

  async function markOnboarded() {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({
        onboarded_at: new Date().toISOString(),
        onboarding_completed: true,
        onboarding_answers: {
          path: result?.need_type ?? "agent",
          recommendation: result?.recommendation_name,
          pain: result?.detected_pain,
          source: method,
          completedAt: new Date().toISOString(),
        } as any,
      })
      .eq("user_id", user.id);
  }

  async function submitClaim() {
    if (!claim.email || !claim.whatsapp) {
      toast.error("Preencha email e WhatsApp para acessar seu dashboard.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("waitlist").insert({
        email: claim.email,
        whatsapp: claim.whatsapp,
        company: claim.company || null,
        name: user?.user_metadata?.full_name ?? null,
        status: "priority",
      });
      if (error && !String(error.message).includes("duplicate")) throw error;
      await markOnboarded();
      setStep("done");
      setTimeout(() => { onComplete(); navigate("/dashboard"); }, 2600);
    } catch (e: any) {
      toast.error("Não consegui liberar seu acesso.", { description: e?.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleSkip() {
    // Só marca como concluído se o usuário já passou pela descrição da dor.
    const idx = STEP_ORDER.indexOf(step);
    if (idx >= STEP_ORDER.indexOf("describe")) {
      await markOnboarded();
    }
    onSkip();
  }

  if (!isOpen) return null;

  const NeedIcon = result ? NEED_META[result.need_type].icon : Bot;
  const needMeta = result ? NEED_META[result.need_type] : NEED_META.agent;

  /* Narrative log — accumulates on the left */
  const narrative: { key: Step; lines: (string | React.ReactNode)[] }[] = [
    { key: "welcome",  lines: [`Estabelecendo canal seguro${firstName ? ` com ${firstName}` : ""}…`, "225 agentes online. Aguardando seu sinal."] },
    { key: "input",    lines: [method === "url" ? "Canal aberto. Aponte para o domínio." : method === "text" ? "Canal aberto. Descreva o negócio em texto." : "Escolha o vetor de entrada."] },
    { key: "describe", lines: ["Sinal capturado. Agora, o que mais dói?"] },
    { key: "analyzing",lines: ["Cruzando 20 departamentos × 225 agentes…"] },
    { key: "reveal",   lines: [result ? `Match localizado com ${Math.round((result.confidence ?? 0.8) * 100)}% de confiança.` : ""] },
    { key: "claim",    lines: ["Última etapa: liberar seu acesso ao dashboard."] },
  ];
  const currentIdx = STEP_ORDER.indexOf(step);

  return (
    <AnimatePresence>
      <motion.div
        key="rev-onboarding"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] text-white"
      >
        <NeuralBackdrop intensity={intensity} />

        {/* Top HUD bar */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 via-violet-500 to-cyan-500 flex items-center justify-center shadow-[0_0_16px_rgba(167,139,250,0.6)]">
              <CoreDot size={12} />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/50">CLAUTHOR · NEURAL LINK</p>
              <p className="text-xs font-mono text-white/70 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                thor.core :: online
              </p>
            </div>
          </div>
          <div className="hidden md:block">
            <StepRail current={step} />
          </div>
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/90 transition font-mono"
          >
            pular <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Layout: narrative rail (desktop) + main stage */}
        <div className="relative z-10 h-full w-full overflow-y-auto overflow-x-hidden flex justify-center px-4 md:px-10 pt-20 pb-16">
          <div className="w-full max-w-6xl grid md:grid-cols-[280px_1fr] gap-6 md:gap-10 items-start my-auto">

            {/* Narrative rail */}
            <aside className="hidden md:block">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 space-y-3.5 max-h-[70vh] overflow-hidden relative">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/50">Transmissão</p>
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                </div>
                <div className="space-y-3">
                  {narrative.slice(0, currentIdx + 1).map((n, ni) =>
                    n.lines.filter(Boolean).map((line, li) => (
                      <ThorLine
                        key={`${n.key}-${li}`}
                        delay={ni === currentIdx ? li * 0.4 : 0}
                        typing={ni === currentIdx && li === n.lines.filter(Boolean).length - 1}
                      >
                        {line}
                      </ThorLine>
                    ))
                  )}
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#04040a] to-transparent" />
              </div>
            </aside>

            {/* Stage */}
            <div className="w-full max-w-2xl mx-auto">
              <AnimatePresence mode="wait">
                {/* WELCOME */}
                {step === "welcome" && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-8"
                  >
                    <ThorOrb size={112} />
                    <div className="space-y-3">
                      <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/50">
                        Sessão · 001 · Primeira sincronização
                      </p>
                      <h1 className="font-display text-4xl md:text-6xl font-bold leading-[1.05]">
                        Oi{firstName ? `, ${firstName}` : ""}. Eu sou o{" "}
                        <span className="bg-gradient-to-r from-rose-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">Thor</span>.
                      </h1>
                      <p className="text-base md:text-lg text-white/70 max-w-xl mx-auto leading-relaxed">
                        <Typewriter
                          text="Em 60 segundos vou ler seu negócio, encontrar a dor real e montar a solução perfeita. Um agente, um squad ou um departamento inteiro."
                          speed={14}
                        />
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <Button
                        size="lg"
                        onClick={() => setStep("department")}
                        className="h-14 px-8 text-base bg-white text-black hover:bg-white/90 rounded-full gap-2 shadow-[0_0_60px_rgba(225,29,72,0.4)]"
                      >
                        Iniciar sincronização <ArrowRight className="w-4 h-4" />
                      </Button>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                        neural handshake · sem cartão
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* DEPARTMENT — escolha do departamento pronto (Bloco 5) */}
                {step === "department" && (
                  <motion.div
                    key="department"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-7"
                  >
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/50">Departamento pronto · 00 / 03</p>
                      <h2 className="font-display text-3xl md:text-4xl font-bold">
                        Qual departamento sua empresa precisa contratar?
                      </h2>
                      <p className="text-white/60 max-w-xl">
                        Escolha o departamento pronto que resolve sua dor agora. Cada um vem com agentes, timeline transparente e outcome garantido.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-3">
                      {FLAGSHIP_DEPARTMENTS.map((dept) => {
                        const Icon = dept.icon;
                        const agentCount = new Set(dept.timelineDemo.map((e) => e.agentName)).size;
                        return (
                          <button
                            key={dept.id}
                            onClick={() => pickDepartment(dept)}
                            className="group relative text-left p-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-white/30 hover:bg-white/[0.06] transition-all"
                          >
                            <div className="w-11 h-11 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition">
                              <Icon className="w-5 h-5 text-white/85" />
                            </div>
                            <p className="font-semibold text-white leading-tight">{dept.name}</p>
                            <p className="text-xs text-white/55 mt-1.5 leading-relaxed">{dept.painPoint}</p>
                            <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5">
                              <p className="text-[10px] font-mono text-emerald-300/80 uppercase tracking-widest">
                                {dept.outcome}
                              </p>
                              <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                                {agentCount} agentes · 60s para ver funcionando
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Button variant="ghost" onClick={() => setStep("welcome")} className="text-white/60 hover:text-white hover:bg-white/5">
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setStep("input")}
                        className="text-white/60 hover:text-white hover:bg-white/5 rounded-full gap-2 h-11 px-5"
                      >
                        Não sei ainda — deixe o Thor descobrir <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* INPUT */}
                {step === "input" && (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-7"
                  >
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/50">Vetor de entrada · 01 / 03</p>
                      <h2 className="font-display text-3xl md:text-4xl font-bold">
                        Me mostra sua empresa.
                      </h2>
                      <p className="text-white/60">Escolha o caminho mais rápido. Eu leio, decifro e conecto os pontos.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      {[
                        { key: "url" as const, icon: Globe, title: "Domínio do site", desc: "Vou fazer scan da sua presença", time: "~15s" },
                        { key: "text" as const, icon: ClipboardPaste, title: "Colar um texto", desc: "Pitch, descrição ou proposta", time: "~30s" },
                      ].map((m) => {
                        const active = method === m.key;
                        return (
                          <button
                            key={m.key}
                            onClick={() => setMethod(m.key)}
                            className={cn(
                              "group relative text-left p-5 rounded-2xl border transition-all backdrop-blur-xl overflow-hidden",
                              active
                                ? "border-white/40 bg-white/10 shadow-[0_0_50px_rgba(167,139,250,0.3)]"
                                : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
                            )}
                          >
                            {active && (
                              <motion.div
                                className="absolute inset-0 pointer-events-none"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{ background: "radial-gradient(400px circle at var(--x,50%) var(--y,50%), rgba(167,139,250,0.15), transparent 40%)" }}
                              />
                            )}
                            <div className="flex items-start gap-4 relative">
                              <div className={cn(
                                "w-11 h-11 rounded-xl flex items-center justify-center border transition",
                                active ? "border-white/40 bg-white/15" : "border-white/10 bg-white/5"
                              )}>
                                <m.icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold">{m.title}</p>
                                <p className="text-sm text-white/60">{m.desc}</p>
                                <p className="text-[9px] font-mono text-white/40 mt-2 uppercase tracking-widest">{m.time}</p>
                              </div>
                              {active && <CheckCircle2 className="w-5 h-5 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <AnimatePresence mode="wait">
                      {method === "url" && (
                        <motion.div key="u" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                          <div className="relative">
                            <Input
                              ref={firstInputRef}
                              placeholder="suaempresa.com.br"
                              value={url}
                              onChange={(e) => setUrl(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter" && canAnalyze) setStep("describe"); }}
                              inputMode="url"
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck={false}
                              className="h-14 pl-12 bg-white/5 border-white/15 text-white placeholder:text-white/30 text-base rounded-xl focus-visible:ring-violet-400/40"
                            />
                            <Globe className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
                            {isValidUrl && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-1/2 -translate-y-1/2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              </motion.div>
                            )}
                          </div>
                          <p className={cn(
                            "text-[11px] font-mono",
                            isValidUrl ? "text-emerald-300/80" : "text-white/40"
                          )}>
                            {url.trim().length === 0
                              ? "> pode colar com ou sem www. Eu normalizo o endereço."
                              : isValidUrl
                                ? `> alvo confirmado: ${normalizedUrl}`
                                : "> endereço incompleto. ex: minhaempresa.com.br"}
                          </p>
                        </motion.div>
                      )}
                      {method === "text" && (
                        <motion.div key="t" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                          <Textarea
                            placeholder="Ex: Somos uma clínica de estética em SP com 3 unidades. Vendemos harmonização e pele. Nossa dor é agendamento e follow-up de leads..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={5}
                            className="bg-white/5 border-white/15 text-white placeholder:text-white/30 rounded-xl resize-none focus-visible:ring-violet-400/40"
                          />
                          <p className="text-[11px] font-mono text-white/40 mt-1.5">
                            {"> "}{text.length} caracteres · mínimo 40
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between pt-2">
                      <Button variant="ghost" onClick={() => setStep("department")} className="text-white/60 hover:text-white hover:bg-white/5">
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar
                      </Button>
                      <Button
                        onClick={() => setStep("describe")}
                        disabled={!canAnalyze}
                        className="bg-white text-black hover:bg-white/90 rounded-full gap-2 h-11 px-6 disabled:opacity-30"
                      >
                        Continuar <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* DESCRIBE */}
                {step === "describe" && (
                  <motion.div
                    key="describe"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/50">Frequência da dor · 02 / 03</p>
                      <h2 className="font-display text-3xl md:text-4xl font-bold">Qual dor está tirando seu sono?</h2>
                      <p className="text-white/60">Uma frase basta. Eu sintonizo o resto.</p>
                    </div>

                    <div className="relative">
                      <Textarea
                        autoFocus
                        placeholder="Ex: Perco leads porque ninguém responde no WhatsApp em menos de 1h..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="bg-white/5 border-white/15 text-white placeholder:text-white/30 rounded-xl resize-none pl-4 pr-12 focus-visible:ring-violet-400/40"
                      />
                      <Waves className="w-4 h-4 text-white/30 absolute right-4 top-4" />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[
                        "Perco leads no WhatsApp",
                        "Meu time comercial trava",
                        "Não consigo escalar conteúdo",
                        "Cobrança e financeiro atrasam",
                      ].map((s) => (
                        <button
                          key={s}
                          onClick={() => setDescription(s)}
                          className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/10 hover:border-white/25 transition text-white/70"
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Button variant="ghost" onClick={() => setStep("input")} className="text-white/60 hover:text-white hover:bg-white/5">
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar
                      </Button>
                      <Button
                        onClick={runAnalysis}
                        className="bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-500 text-white hover:opacity-90 rounded-full gap-2 h-11 px-6 shadow-[0_0_40px_rgba(225,29,72,0.4)]"
                      >
                        Fundir com a rede <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ANALYZING */}
                {step === "analyzing" && (
                  <motion.div
                    key="analyzing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-8"
                  >
                    <ThorOrb size={120} />
                    <div className="space-y-3">
                      <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/50">Neural fusion em progresso</p>
                      <h2 className="font-display text-2xl md:text-3xl font-bold">Sintonizando +200 especialistas…</h2>
                    </div>
                    <div className="max-w-md mx-auto space-y-2.5 text-left">
                      {[
                        { icon: Globe, s: "Escaneando sua presença digital" },
                        { icon: Cpu,   s: "Mapeando modelo de negócio" },
                        { icon: Radio, s: "Detectando a dor real" },
                        { icon: Users, s: "Cruzando com 20 departamentos" },
                        { icon: Zap, s: "Montando recomendação perfeita" },
                      ].map(({ icon: I, s }, i) => (
                        <motion.div
                          key={s}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.45 }}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] font-mono text-[13px] text-white/75"
                        >
                          <I className="w-3.5 h-3.5 text-violet-300" />
                          <span className="flex-1">{s}</span>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* REVEAL */}
                {step === "reveal" && result && (
                  <motion.div
                    key="reveal"
                    initial={{ opacity: 0, y: 24, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-4xl mx-auto"
                  >
                    <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                      {/* Header */}
                      <div className="px-5 md:px-10 pt-6 md:pt-10 pb-5 md:pb-8 border-b border-white/5">
                        <motion.span
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 }}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-widest mb-4"
                          style={{
                            background: `${needMeta.color}12`,
                            borderColor: `${needMeta.color}33`,
                            color: needMeta.color,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Match · {Math.round((result.confidence ?? 0.85) * 100)}% de confiança
                        </motion.span>
                        <motion.h2
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.12 }}
                          className="font-display text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.05] bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent"
                        >
                          {result.recommendation_name}
                        </motion.h2>
                        <motion.p
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.18 }}
                          className="mt-3 text-sm md:text-base text-white/60 leading-relaxed max-w-2xl"
                        >
                          {result.recommendation_pitch}
                        </motion.p>
                      </div>

                      <div className="p-5 md:p-10 space-y-6 md:space-y-10">
                        {/* Contexto */}
                        <div className="grid md:grid-cols-2 gap-6 md:gap-12">
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.24 }}
                            className="space-y-2"
                          >
                            <h4 className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Seu negócio</h4>
                            <p className="text-white/75 leading-relaxed text-sm">{result.business_summary}</p>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-2"
                          >
                            <h4 className="text-[10px] font-mono text-rose-400 uppercase tracking-widest">Dor detectada</h4>
                            <p className="text-white/75 leading-relaxed text-sm">{result.detected_pain}</p>
                          </motion.div>
                        </div>

                        {/* Agentes */}
                        {result.agents?.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Seu squad</h4>
                              {result.agents.length > 6 && (
                                <button
                                  type="button"
                                  onClick={() => setShowAllAgents((v) => !v)}
                                  className="text-[10px] font-mono uppercase tracking-widest text-white/50 hover:text-white transition-colors"
                                >
                                  {showAllAgents ? "Ver menos" : `Ver todos · ${result.agents.length}`}
                                </button>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 md:gap-2.5">
                              {(showAllAgents ? result.agents : result.agents.slice(0, 6)).map((a, i) => {
                                const palette = [
                                  { bg: "bg-violet-500/10", border: "border-violet-500/30", dot: "bg-violet-400" },
                                  { bg: "bg-rose-500/10",   border: "border-rose-500/30",   dot: "bg-rose-400" },
                                  { bg: "bg-cyan-500/10",   border: "border-cyan-500/30",   dot: "bg-cyan-400" },
                                ][i % 3];
                                return (
                                  <motion.div
                                    key={a}
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: Math.min(0.35 + i * 0.04, 0.7) }}
                                    className={cn(
                                      "flex items-center gap-2 px-3 py-1.5 rounded-xl border",
                                      palette.bg, palette.border
                                    )}
                                  >
                                    <span className={cn("w-1.5 h-1.5 rounded-full", palette.dot)} />
                                    <span className="text-[11px] md:text-xs font-semibold text-white/90">{a}</span>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>

                        )}

                        {/* Outcome band with animated glow */}
                        {result.expected_outcome && (
                          <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55 }}
                            className="relative group"
                          >
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/25 to-cyan-500/25 blur opacity-60 group-hover:opacity-100 transition duration-700" />
                            <div className="relative bg-[#0A0A0A] border border-emerald-500/30 rounded-2xl p-5 md:p-6 flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-1">Resultado esperado em 30 dias</p>
                                <p className="text-base md:text-lg font-bold text-white leading-snug">{result.expected_outcome}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="block text-2xl md:text-3xl font-black text-emerald-400 tracking-tighter leading-none">
                                  {Math.round((result.confidence ?? 0.85) * 100)}%
                                </span>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Confiança</p>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* CTA */}
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 }}
                          className="pt-2 space-y-4"
                        >
                          <button
                            onClick={() => setStep("claim")}
                            className="w-full group relative flex items-center justify-center gap-3 bg-white text-black font-extrabold text-base md:text-lg py-4 md:py-5 rounded-2xl transition-all hover:bg-cyan-300 hover:scale-[1.01] active:scale-[0.99] shadow-[0_20px_50px_-15px_rgba(255,255,255,0.25)] cursor-pointer"
                          >
                            Seja bem-vindo · Entrar no dashboard
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                          </button>
                          <div className="flex items-center justify-between text-[11px] text-white/30 font-mono tracking-widest uppercase">
                            <button
                              onClick={() => setStep("describe")}
                              className="inline-flex items-center gap-1.5 hover:text-white/70 transition-colors"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" /> Refinar contexto
                            </button>
                            <span>Seu departamento te espera</span>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}


                {/* CLAIM */}
                {step === "claim" && (
                  <motion.div
                    key="claim"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/50">Última etapa · 03 / 03</p>
                      <h2 className="font-display text-3xl md:text-4xl font-bold">Seja bem-vindo à sua rede.</h2>
                      <p className="text-white/60 max-w-md">
                        Vou ativar {result?.recommendation_name ? <span className="text-white">“{result.recommendation_name}”</span> : "seu departamento"} e liberar acesso imediato ao seu dashboard.
                      </p>
                    </div>

                    <div className="space-y-3 max-w-md">
                      <Input
                        type="email"
                        placeholder="Email"
                        value={claim.email}
                        onChange={(e) => setClaim({ ...claim, email: e.target.value })}
                        className="h-12 bg-white/5 border-white/15 text-white placeholder:text-white/30 rounded-xl focus-visible:ring-violet-400/40"
                      />
                      <Input
                        placeholder="WhatsApp com DDD"
                        value={claim.whatsapp}
                        onChange={(e) => setClaim({ ...claim, whatsapp: e.target.value })}
                        className="h-12 bg-white/5 border-white/15 text-white placeholder:text-white/30 rounded-xl focus-visible:ring-violet-400/40"
                      />
                      <Input
                        placeholder="Empresa (opcional)"
                        value={claim.company}
                        onChange={(e) => setClaim({ ...claim, company: e.target.value })}
                        className="h-12 bg-white/5 border-white/15 text-white placeholder:text-white/30 rounded-xl focus-visible:ring-violet-400/40"
                      />
                      <div className="flex items-center gap-2 text-xs text-white/50 pt-1 font-mono">
                        <ShieldCheck className="w-3.5 h-3.5" /> criptografado end-to-end · nunca compartilhamos
                      </div>
                    </div>

                    <div className="flex items-center justify-between max-w-md pt-2">
                      <Button variant="ghost" onClick={() => setStep("reveal")} className="text-white/60 hover:text-white hover:bg-white/5">
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar
                      </Button>
                      <Button
                        onClick={submitClaim}
                        disabled={loading}
                        size="lg"
                        className="bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-500 text-white hover:opacity-90 rounded-full gap-2 h-12 px-6 shadow-[0_0_40px_rgba(225,29,72,0.4)]"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                        Entrar no dashboard
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* DONE */}
                {step === "done" && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-6"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 12 }}
                      className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-[0_0_100px_rgba(52,211,153,0.5)]"
                    >
                      <CheckCircle2 className="w-12 h-12 text-black" />
                    </motion.div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-emerald-300">Neural link estabelecido</p>
                      <h2 className="font-display text-3xl md:text-4xl font-bold">Vaga fixada.</h2>
                      <p className="text-white/70 font-mono text-sm">Redirecionando para o dashboard…</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
