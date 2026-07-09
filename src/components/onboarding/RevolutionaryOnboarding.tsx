import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Globe, ClipboardPaste, FileText, ArrowRight, ArrowLeft,
  Loader2, CheckCircle2, Bot, Users, Building2, Zap, ShieldCheck, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Step = "welcome" | "input" | "describe" | "analyzing" | "reveal" | "claim" | "done";

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
  agent: { icon: Bot, label: "Agente Individual", color: "#a78bfa", gradient: "from-violet-500/30 to-fuchsia-500/10" },
  squad: { icon: Users, label: "Squad Coordenado", color: "#e11d48", gradient: "from-rose-500/30 to-orange-500/10" },
  department: { icon: Building2, label: "Departamento Completo", color: "#22d3ee", gradient: "from-cyan-500/30 to-blue-500/10" },
} as const;

/** Holographic aurora background with drifting particles. */
function HolographicBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Deep base */}
      <div className="absolute inset-0 bg-[#05050a]" />
      {/* Aurora blobs */}
      <motion.div
        className="absolute -top-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle, #e11d48 0%, transparent 60%)" }}
        animate={{ x: [0, 60, -20, 0], y: [0, 40, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 w-[70vw] h-[70vw] rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle, #a78bfa 0%, transparent 60%)" }}
        animate={{ x: [0, -50, 30, 0], y: [0, -40, 20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[50vw] h-[50vw] rounded-full blur-3xl opacity-25"
        style={{ background: "radial-gradient(circle, #22d3ee 0%, transparent 60%)" }}
        animate={{ scale: [1, 1.2, 0.9, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />
      {/* Particles */}
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/60"
          style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%` }}
          animate={{ opacity: [0.1, 0.9, 0.1], y: [0, -30, 0] }}
          transition={{ duration: 4 + (i % 6), repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
    </div>
  );
}

/** Pulsing holographic orb representing Thor. */
function ThorOrb({ pulsing = true }: { pulsing?: boolean }) {
  return (
    <div className="relative w-24 h-24 mx-auto">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: "conic-gradient(from 0deg, #e11d48, #a78bfa, #22d3ee, #e11d48)" }}
        animate={pulsing ? { rotate: 360 } : {}}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-[3px] rounded-full bg-[#05050a] flex items-center justify-center">
        <motion.div
          animate={pulsing ? { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] } : {}}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-8 h-8 text-white" strokeWidth={1.4} />
        </motion.div>
      </div>
      {pulsing && (
        <motion.div
          className="absolute inset-0 rounded-full border border-white/20"
          animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </div>
  );
}

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
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && step === "input") setTimeout(() => firstInputRef.current?.focus(), 300);
  }, [isOpen, step]);

  useEffect(() => {
    if (user?.email) setClaim((c) => ({ ...c, email: user.email ?? c.email }));
  }, [user?.email]);

  // Aceita "site.com", "www.site.com.br", "https://site.com/pagina" — normaliza depois.
  const normalizedUrl = useMemo(() => {
    const raw = url.trim();
    if (!raw) return "";
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, "")}`;
  }, [url]);

  const isValidUrl = useMemo(() => {
    if (!normalizedUrl) return false;
    try {
      const u = new URL(normalizedUrl);
      // precisa ter um domínio com ponto (ex: algo.com, algo.com.br)
      return /^[^\s.]+\.[^\s.]+/.test(u.hostname);
    } catch {
      return false;
    }
  }, [normalizedUrl]);

  const canAnalyze = useMemo(() => {
    if (method === "url") return isValidUrl;
    if (method === "text") return text.trim().length > 40;
    return false;
  }, [method, isValidUrl, text]);

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
      setResult(data as Classification);
      setStep("reveal");
    } catch (e: any) {
      toast.error("Não consegui analisar agora. Tente novamente.", { description: e?.message });
      setStep("describe");
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
      toast.error("Preencha email e WhatsApp para garantir sua vaga.");
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
      setTimeout(() => {
        onComplete();
        navigate("/dashboard");
      }, 2400);
    } catch (e: any) {
      toast.error("Não consegui salvar sua vaga.", { description: e?.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleSkip() {
    await markOnboarded();
    onSkip();
  }

  if (!isOpen) return null;

  const NeedIcon = result ? NEED_META[result.need_type].icon : Bot;
  const needMeta = result ? NEED_META[result.need_type] : NEED_META.agent;

  return (
    <AnimatePresence>
      <motion.div
        key="rev-onboarding"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] text-white"
      >
        <HolographicBackdrop />

        {/* Skip */}
        <button
          onClick={handleSkip}
          className="absolute top-5 right-5 z-10 flex items-center gap-1.5 text-xs text-white/50 hover:text-white/90 transition"
        >
          Pular por enquanto <X className="w-3.5 h-3.5" />
        </button>

        <div className="relative z-10 h-full w-full flex items-center justify-center px-6">
          <div className="w-full max-w-2xl">
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
                  <ThorOrb />
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                      CLAUTHOR · Primeira interação
                    </p>
                    <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight">
                      Oi, eu sou o <span className="bg-gradient-to-r from-rose-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">Thor</span>.
                    </h1>
                    <p className="text-lg md:text-xl text-white/70 max-w-lg mx-auto leading-relaxed">
                      Em 60 segundos eu vou entender seu negócio, sua dor real e montar a solução perfeita — um agente, um squad ou um departamento inteiro.
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <Button
                      size="lg"
                      onClick={() => setStep("input")}
                      className="h-14 px-8 text-base bg-white text-black hover:bg-white/90 rounded-full gap-2 shadow-[0_0_60px_rgba(225,29,72,0.35)]"
                    >
                      Começar a jornada <ArrowRight className="w-4 h-4" />
                    </Button>
                    <p className="text-xs text-white/40">Sem cartão · Sem compromisso</p>
                  </div>
                </motion.div>
              )}

              {/* INPUT METHOD */}
              {step === "input" && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Passo 1 de 3</p>
                    <h2 className="font-display text-3xl md:text-4xl font-bold">
                      Como quer me apresentar sua empresa?
                    </h2>
                    <p className="text-white/60">Escolha o caminho mais rápido pra você.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      { key: "url" as const, icon: Globe, title: "Cole a URL do site", desc: "Eu leio tudo automaticamente", time: "~15s" },
                      { key: "text" as const, icon: ClipboardPaste, title: "Cole um texto sobre", desc: "Descrição, pitch ou proposta", time: "~30s" },
                    ].map((m) => {
                      const active = method === m.key;
                      return (
                        <button
                          key={m.key}
                          onClick={() => setMethod(m.key)}
                          className={cn(
                            "group relative text-left p-5 rounded-2xl border transition-all backdrop-blur-xl",
                            active
                              ? "border-white/40 bg-white/10 shadow-[0_0_40px_rgba(167,139,250,0.25)]"
                              : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "w-11 h-11 rounded-xl flex items-center justify-center border transition",
                              active ? "border-white/40 bg-white/15" : "border-white/10 bg-white/5"
                            )}>
                              <m.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold">{m.title}</p>
                              <p className="text-sm text-white/60">{m.desc}</p>
                              <p className="text-[10px] text-white/40 mt-2 uppercase tracking-widest">{m.time}</p>
                            </div>
                            {active && <CheckCircle2 className="w-5 h-5 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {method === "url" && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
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
                        className="h-14 bg-white/5 border-white/15 text-white placeholder:text-white/30 text-base rounded-xl"
                      />
                      <p className="text-[11px] text-white/40">
                        {url.trim().length === 0
                          ? "Pode colar com ou sem www — eu ajusto pra você."
                          : isValidUrl
                            ? `✓ Vou analisar ${normalizedUrl}`
                            : "Hmm, esse endereço não parece completo. Ex: minhaempresa.com.br"}
                      </p>
                    </motion.div>
                  )}
                  {method === "text" && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <Textarea
                        placeholder="Ex: Somos uma clínica de estética em SP com 3 unidades. Vendemos harmonização e pele. Nossa dor é agendamento e follow-up de leads..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={5}
                        className="bg-white/5 border-white/15 text-white placeholder:text-white/30 rounded-xl resize-none"
                      />
                      <p className="text-[11px] text-white/40 mt-1.5">{text.length} caracteres · mínimo 40</p>
                    </motion.div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <Button variant="ghost" onClick={() => setStep("welcome")} className="text-white/60 hover:text-white hover:bg-white/5">
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

              {/* DESCRIBE PAIN */}
              {step === "describe" && (
                <motion.div
                  key="describe"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Passo 2 de 3</p>
                    <h2 className="font-display text-3xl md:text-4xl font-bold">Qual é a sua maior dor hoje?</h2>
                    <p className="text-white/60">Em uma frase, o que mais te tira o sono. Opcional, mas ajuda muito.</p>
                  </div>

                  <Textarea
                    autoFocus
                    placeholder="Ex: Perco leads porque ninguém responde no WhatsApp em menos de 1h..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="bg-white/5 border-white/15 text-white placeholder:text-white/30 rounded-xl resize-none"
                  />

                  <div className="flex items-center justify-between pt-2">
                    <Button variant="ghost" onClick={() => setStep("input")} className="text-white/60 hover:text-white hover:bg-white/5">
                      <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar
                    </Button>
                    <Button
                      onClick={runAnalysis}
                      className="bg-gradient-to-r from-rose-500 to-violet-500 text-white hover:opacity-90 rounded-full gap-2 h-11 px-6"
                    >
                      Analisar meu negócio <Sparkles className="w-4 h-4" />
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
                  className="text-center space-y-6"
                >
                  <ThorOrb />
                  <div className="space-y-3">
                    <h2 className="font-display text-2xl md:text-3xl font-bold">
                      Analisando sua realidade…
                    </h2>
                    <div className="max-w-md mx-auto space-y-2 text-sm text-white/60">
                      {[
                        "Mapeando seu modelo de negócio",
                        "Identificando a dor real",
                        "Cruzando com 225 agentes disponíveis",
                        "Montando a recomendação perfeita",
                      ].map((s, i) => (
                        <motion.div
                          key={s}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.6 }}
                          className="flex items-center gap-2 justify-center"
                        >
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white/60" />
                          {s}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* REVEAL */}
              {step === "reveal" && result && (
                <motion.div
                  key="reveal"
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Match encontrado</p>
                    <h2 className="font-display text-3xl md:text-4xl font-bold">
                      Você precisa de <span style={{ color: needMeta.color }}>{needMeta.label.toLowerCase()}</span>.
                    </h2>
                  </div>

                  <motion.div
                    layout
                    className={cn(
                      "relative rounded-3xl border border-white/15 backdrop-blur-2xl overflow-hidden",
                      "bg-gradient-to-br", needMeta.gradient
                    )}
                  >
                    <div className="p-6 md:p-8 space-y-5 bg-black/40">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/20"
                          style={{ background: `${needMeta.color}22` }}
                        >
                          <NeedIcon className="w-7 h-7" style={{ color: needMeta.color }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] uppercase tracking-widest text-white/50">Recomendação</p>
                          <h3 className="font-display text-2xl font-bold">{result.recommendation_name}</h3>
                          <p className="text-sm text-white/70 mt-1">{result.recommendation_pitch}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 pt-2">
                        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Seu negócio</p>
                          <p className="text-sm text-white/90">{result.business_summary}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Dor detectada</p>
                          <p className="text-sm text-white/90">{result.detected_pain}</p>
                        </div>
                      </div>

                      {result.agents?.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Agentes envolvidos</p>
                          <div className="flex flex-wrap gap-1.5">
                            {result.agents.slice(0, 8).map((a) => (
                              <span key={a} className="text-xs px-2.5 py-1 rounded-full bg-white/10 border border-white/15">
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.expected_outcome && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-400/20">
                          <Zap className="w-5 h-5 text-emerald-300 shrink-0" />
                          <p className="text-sm"><span className="text-white/60">Em 30 dias: </span>{result.expected_outcome}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  <div className="flex items-center justify-between pt-2">
                    <Button variant="ghost" onClick={() => setStep("describe")} className="text-white/60 hover:text-white hover:bg-white/5">
                      <ArrowLeft className="w-4 h-4 mr-1.5" /> Refinar
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => setStep("claim")}
                      className="bg-white text-black hover:bg-white/90 rounded-full gap-2 h-12 px-6 shadow-[0_0_50px_rgba(225,29,72,0.35)]"
                    >
                      Garantir minha vaga <ArrowRight className="w-4 h-4" />
                    </Button>
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
                  <div className="text-center space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Passo 3 de 3</p>
                    <h2 className="font-display text-3xl md:text-4xl font-bold">Garanta sua vaga prioritária</h2>
                    <p className="text-white/60 max-w-md mx-auto">
                      Vou reservar {result?.recommendation_name ? <span className="text-white">“{result.recommendation_name}”</span> : "sua solução"} pra você e liberar acesso imediato ao dashboard.
                    </p>
                  </div>

                  <div className="space-y-3 max-w-md mx-auto">
                    <Input
                      type="email"
                      placeholder="Email"
                      value={claim.email}
                      onChange={(e) => setClaim({ ...claim, email: e.target.value })}
                      className="h-12 bg-white/5 border-white/15 text-white placeholder:text-white/30 rounded-xl"
                    />
                    <Input
                      placeholder="WhatsApp com DDD"
                      value={claim.whatsapp}
                      onChange={(e) => setClaim({ ...claim, whatsapp: e.target.value })}
                      className="h-12 bg-white/5 border-white/15 text-white placeholder:text-white/30 rounded-xl"
                    />
                    <Input
                      placeholder="Empresa (opcional)"
                      value={claim.company}
                      onChange={(e) => setClaim({ ...claim, company: e.target.value })}
                      className="h-12 bg-white/5 border-white/15 text-white placeholder:text-white/30 rounded-xl"
                    />
                    <div className="flex items-center gap-2 text-xs text-white/50 pt-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Seus dados são criptografados. Nunca compartilhamos.
                    </div>
                  </div>

                  <div className="flex items-center justify-between max-w-md mx-auto pt-2">
                    <Button variant="ghost" onClick={() => setStep("reveal")} className="text-white/60 hover:text-white hover:bg-white/5">
                      <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar
                    </Button>
                    <Button
                      onClick={submitClaim}
                      disabled={loading}
                      size="lg"
                      className="bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-500 text-white hover:opacity-90 rounded-full gap-2 h-12 px-6"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Garantir minha vaga
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
                    className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-[0_0_80px_rgba(52,211,153,0.4)]"
                  >
                    <CheckCircle2 className="w-10 h-10 text-black" />
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="font-display text-3xl md:text-4xl font-bold">Vaga garantida.</h2>
                    <p className="text-white/70">Levando você pro dashboard…</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
