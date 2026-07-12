/**
 * /experience — Mesa Redonda dos Agentes.
 *
 * Showcase cinematográfico: um departamento inteiro em ação, com agentes
 * dispostos em círculo, conversando entre si e produzindo resultado em
 * tempo real. Simulação 100% orquestrada a partir de `timelineDemo` de
 * `departmentPackages` — sem custo de LLM, sem backend.
 *
 * Estética: minimalista/futurista (Apple × Tesla × Arrival), acento vermelho
 * `--destructive`, glass sutil, halo animado, tipografia display generosa.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Play, Pause, RotateCcw, Sparkles, Send, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackKpi } from "@/lib/kpiTracker";
import {
  DEPARTMENT_PACKAGES,
  DEPT_COLOR_TOKENS,
  formatBRL,
  type DepartmentPackage,
  type DepartmentTimelineEvent,
  type DeptColorKey,
} from "@/data/departmentPackages";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type ChatEntry = DepartmentTimelineEvent & { idx: number };

/** Diretiva injetada ao vivo pelo usuário — aparece no feed como comando. */
interface Directive {
  id: string;
  text: string;
  time: string;
  afterIdx: number;
}

/* -------------------------------------------------------------------------- */
/*  Utilities                                                                 */
/* -------------------------------------------------------------------------- */

/** Deriva iniciais para o avatar do agente. */
const initialsFrom = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

/** Distribui N agentes em um círculo — retorna posições relativas [0..1]. */
const circleLayout = (n: number, radius: number) =>
  Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });

/* -------------------------------------------------------------------------- */
/*  Agent Node                                                                */
/* -------------------------------------------------------------------------- */

interface AgentNodeProps {
  name: string;
  slug: string;
  x: number;
  y: number;
  active: boolean;
  spoken: boolean;
  colorKey: DeptColorKey;
}

const AgentNode = ({ name, x, y, active, spoken, colorKey }: AgentNodeProps) => {
  const tone = DEPT_COLOR_TOKENS[colorKey];
  return (
    <motion.div
      className="absolute z-20"
      initial={false}
      animate={{
        x,
        y,
        translateX: "-50%",
        translateY: "-50%",
        scale: active ? 1.08 : 1,
      }}
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
      style={{ left: "50%", top: "50%" }}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          {/* halo ativo */}
          {active && (
            <motion.span
              className="absolute inset-0 rounded-full bg-[hsl(var(--destructive))/0.4] blur-xl"
              animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0.2, 0.6] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            />
          )}
          <div
            className={cn(
              "relative h-14 w-14 rounded-full flex items-center justify-center text-[13px] font-semibold font-display transition-colors",
              "border backdrop-blur bg-gradient-to-br",
              tone.gradient,
              active
                ? "border-[hsl(var(--destructive))] text-foreground shadow-[0_0_24px_hsl(var(--destructive)/0.5)]"
                : spoken
                  ? cn(tone.border, tone.text)
                  : "border-white/[0.08] text-muted-foreground",
            )}
          >
            {initialsFrom(name)}
          </div>
          {active && (
            <motion.span
              className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[hsl(var(--destructive))]"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              aria-hidden
            />
          )}
        </div>
        <div
          className={cn(
            "text-[10.5px] uppercase tracking-[0.14em] text-center max-w-[90px] leading-tight transition-colors",
            active ? "text-foreground" : "text-muted-foreground/70",
          )}
        >
          {name}
        </div>
      </div>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Center Core                                                               */
/* -------------------------------------------------------------------------- */

const CenterCore = ({ metric, value, suffix }: { metric: string; value: number; suffix?: string }) => (
  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center pointer-events-none">
    <motion.div
      className="h-40 w-40 rounded-full border border-white/10 bg-gradient-to-br from-[hsl(var(--destructive))/0.15] via-transparent to-transparent backdrop-blur-xl"
      animate={{ rotate: 360 }}
      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      aria-hidden
    >
      <div className="absolute inset-2 rounded-full border border-white/[0.06]" />
      <div className="absolute inset-6 rounded-full border border-[hsl(var(--destructive))/0.25]" />
    </motion.div>
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{metric}</p>
      <motion.p
        key={value}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-1 text-3xl font-semibold font-display tracking-tight text-foreground"
      >
        {value}
        {suffix && <span className="ml-0.5 text-lg text-muted-foreground">{suffix}</span>}
      </motion.p>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Speech Bubble (floating from active agent)                                */
/* -------------------------------------------------------------------------- */

const SpeechBubble = ({ x, y, text }: { x: number; y: number; text: string }) => {
  // Push bubble slightly outward from the agent
  const bx = x * 1.35;
  const by = y * 1.35;
  const rightSide = x >= 0;
  return (
    <motion.div
      key={text}
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="absolute z-30 pointer-events-none"
      style={{
        left: "50%",
        top: "50%",
        transform: `translate(calc(-50% + ${bx}px), calc(-50% + ${by}px))`,
      }}
    >
      <div
        className={cn(
          "max-w-[240px] rounded-2xl px-3.5 py-2 text-[12.5px] leading-snug",
          "border border-white/[0.08] bg-background/85 backdrop-blur-xl",
          "shadow-[0_18px_50px_-24px_hsl(var(--destructive)/0.6)]",
          rightSide ? "rounded-tl-sm" : "rounded-tr-sm",
        )}
      >
        <p className="text-foreground">{text}</p>
      </div>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Feed Item (right column)                                                  */
/* -------------------------------------------------------------------------- */

const FeedItem = ({ entry, active }: { entry: ChatEntry; active: boolean }) => (
  <motion.div
    layout
    initial={{ opacity: 0, x: 12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.35 }}
    className={cn(
      "rounded-2xl border p-3.5 transition-colors",
      active
        ? "border-[hsl(var(--destructive))/0.6] bg-[hsl(var(--destructive))/0.06]"
        : "border-white/[0.06] bg-white/[0.02]",
    )}
  >
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-[10px] font-semibold text-foreground">
          {initialsFrom(entry.agentName)}
        </div>
        <span className="text-[12px] font-medium text-foreground">{entry.agentName}</span>
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground tracking-wider">{entry.time}</span>
    </div>
    <p className="mt-2 text-[12.5px] leading-snug text-foreground/90">{entry.action}</p>
    <p className="mt-1.5 text-[11.5px] text-[hsl(var(--destructive))]">→ {entry.outcome}</p>
  </motion.div>
);

/* -------------------------------------------------------------------------- */
/*  Round Table stage                                                         */
/* -------------------------------------------------------------------------- */

const RoundTable = ({
  dept,
  currentIdx,
  playedIdxs,
}: {
  dept: DepartmentPackage;
  currentIdx: number;
  playedIdxs: Set<number>;
}) => {
  // Agentes únicos que aparecem no timeline
  const agents = useMemo(() => {
    const seen = new Map<string, { slug: string; name: string }>();
    dept.timelineDemo.forEach((e) => {
      if (!seen.has(e.agentSlug)) seen.set(e.agentSlug, { slug: e.agentSlug, name: e.agentName });
    });
    return Array.from(seen.values());
  }, [dept]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState(180);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const size = Math.min(el.clientWidth, el.clientHeight);
      setRadius(Math.max(140, Math.min(260, size / 2 - 60)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const positions = useMemo(() => circleLayout(agents.length, radius), [agents.length, radius]);

  const current = currentIdx >= 0 ? dept.timelineDemo[currentIdx] : null;
  const activeAgentIdx = current ? agents.findIndex((a) => a.slug === current.agentSlug) : -1;
  const bubblePos =
    activeAgentIdx >= 0 && positions[activeAgentIdx]
      ? positions[activeAgentIdx]
      : { x: 0, y: 0 };

  const spokenSlugs = useMemo(() => {
    const set = new Set<string>();
    playedIdxs.forEach((i) => {
      const e = dept.timelineDemo[i];
      if (e) set.add(e.agentSlug);
    });
    return set;
  }, [playedIdxs, dept]);

  const metricProgression = dept.outcomeMetric.progression;
  const metricValue =
    currentIdx >= 0 ? metricProgression[currentIdx] ?? metricProgression[0] : metricProgression[0];

  return (
    <div ref={containerRef} className="relative w-full aspect-square max-h-[640px] mx-auto">
      {/* Anéis concêntricos decorativos */}
      <div className="absolute inset-6 rounded-full border border-white/[0.04]" />
      <div className="absolute inset-16 rounded-full border border-white/[0.04]" />
      <div className="absolute inset-28 rounded-full border border-white/[0.04]" />

      {/* Linhas de conexão do agente ativo com o núcleo */}
      {activeAgentIdx >= 0 && (
        <svg className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
          <motion.line
            x1="50%"
            y1="50%"
            x2={`calc(50% + ${positions[activeAgentIdx].x}px)`}
            y2={`calc(50% + ${positions[activeAgentIdx].y}px)`}
            stroke="hsl(var(--destructive))"
            strokeOpacity="0.5"
            strokeWidth="1"
            strokeDasharray="3 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6 }}
          />
        </svg>
      )}

      <CenterCore
        metric={dept.outcomeMetric.label}
        value={metricValue}
        suffix={dept.outcomeMetric.suffix}
      />

      {agents.map((a, i) => (
        <AgentNode
          key={a.slug}
          name={a.name}
          slug={a.slug}
          x={positions[i]?.x ?? 0}
          y={positions[i]?.y ?? 0}
          active={i === activeAgentIdx}
          spoken={spokenSlugs.has(a.slug)}
          colorKey={dept.color}
        />
      ))}

      <AnimatePresence>
        {current && (
          <SpeechBubble
            key={`${current.time}-${current.agentSlug}`}
            x={bubblePos.x}
            y={bubblePos.y}
            text={current.action}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

const ExperiencePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ctxId = searchParams.get("ctx");
  const [deptId, setDeptId] = useState<string>(DEPARTMENT_PACKAGES[0].id);
  const [currentIdx, setCurrentIdx] = useState<number>(-1);
  const [played, setPlayed] = useState<Set<number>>(new Set());
  const [playing, setPlaying] = useState<boolean>(true);
  const [directives, setDirectives] = useState<Directive[]>([]);
  const [directiveDraft, setDirectiveDraft] = useState<string>("");
  const [ctxCompany, setCtxCompany] = useState<string | null>(null);
  const [ctxPain, setCtxPain] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hidratação via ?ctx=<id> — vem do Thor Concierge
  useEffect(() => {
    if (!ctxId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("thor-concierge", {
          body: { action: "get_context", ctx_id: ctxId },
        });
        if (error || cancelled) return;
        const ctx = (data as { context?: Record<string, unknown> })?.context;
        if (!ctx) return;
        if (typeof ctx.dept_id === "string" && DEPARTMENT_PACKAGES.some((d) => d.id === ctx.dept_id)) {
          setDeptId(ctx.dept_id);
        }
        if (typeof ctx.empresa === "string") setCtxCompany(ctx.empresa);
        if (typeof ctx.dor === "string") setCtxPain(ctx.dor);
        const leads = (ctx.context as { leads?: Array<{ name: string; role: string; signal: string }> })?.leads;
        if (Array.isArray(leads) && leads.length > 0) {
          const now = new Date();
          const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
          setDirectives(
            leads.slice(0, 3).map((l, i) => ({
              id: `ctx-lead-${i}`,
              text: `${l.name} · ${l.role} — ${l.signal}`,
              time,
              afterIdx: -1,
            })),
          );
        }
      } catch (err) {
        console.warn("[experience] ctx hydrate failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ctxId]);


  const dept: DepartmentPackage =
    DEPARTMENT_PACKAGES.find((d) => d.id === deptId) ?? DEPARTMENT_PACKAGES[0];

  const total = dept.timelineDemo.length;

  // Reset ao trocar de departamento (preserva diretivas quando vindo de ctx)
  useEffect(() => {
    setCurrentIdx(-1);
    setPlayed(new Set());
    setPlaying(true);
    if (!ctxId) setDirectives([]);
  }, [deptId, ctxId]);


  // Loop de reprodução
  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    const nextIdx = currentIdx + 1;
    const delay = currentIdx === -1 ? 600 : dept.timelineDemo[currentIdx]?.delayMs ?? 3500;

    timerRef.current = setTimeout(() => {
      if (nextIdx >= total) {
        // Loop
        setCurrentIdx(-1);
        setPlayed(new Set());
        return;
      }
      setCurrentIdx(nextIdx);
      setPlayed((prev) => {
        const next = new Set(prev);
        next.add(nextIdx);
        return next;
      });
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, currentIdx, dept, total]);

  const handleReset = () => {
    setCurrentIdx(-1);
    setPlayed(new Set());
    setPlaying(true);
    setDirectives([]);
  };

  const handleInjectDirective = () => {
    const text = directiveDraft.trim();
    if (!text) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setDirectives((prev) => [
      ...prev,
      { id: `${Date.now()}`, text, time, afterIdx: currentIdx },
    ]);
    setDirectiveDraft("");
  };

  const feedEntries: ChatEntry[] = useMemo(
    () =>
      Array.from(played)
        .sort((a, b) => b - a)
        .map((idx) => ({ ...dept.timelineDemo[idx], idx })),
    [played, dept],
  );

  const progressPct = currentIdx >= 0 ? Math.round(((currentIdx + 1) / total) * 100) : 0;

  return (
    <div className="relative min-h-dvh bg-background text-foreground overflow-hidden">
      <Helmet>
        <title>Experience — Mesa Redonda dos Agentes · Clauthor</title>
        <meta
          name="description"
          content="Veja um departamento inteiro de IA em ação: agentes conversando na mesma tela, produzindo resultado em tempo real."
        />
      </Helmet>

      {/* Backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_50%_30%,hsl(var(--destructive)/0.16),transparent_55%),radial-gradient(circle_at_15%_85%,hsl(var(--primary)/0.08),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(hsl(var(--foreground)/0.5)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.5)_1px,transparent_1px)] [background-size:64px_64px]"
      />

      {/* Top bar */}
      <header className="relative z-30 flex items-center justify-between px-5 sm:px-8 pt-6">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar
        </button>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--destructive))] animate-pulse" />
          Live · Mesa redonda
        </div>
        <div className="w-16" />
      </header>

      <main className="relative z-20 mx-auto max-w-7xl px-5 sm:px-8 pt-8 pb-16">
        {/* Título */}
        <div className="text-center mb-8">
          {ctxCompany && (
            <p className="mb-3 text-[11px] uppercase tracking-[0.24em] text-[hsl(var(--destructive))]">
              Mesa redonda · {ctxCompany}
            </p>
          )}
          <h1 className="text-4xl sm:text-6xl font-semibold font-display tracking-[-0.02em] text-foreground">
            {ctxCompany ? (
              <>
                O squad de <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-[hsl(var(--destructive))] to-foreground">{ctxCompany}</span>
              </>
            ) : (
              <>
                Um departamento.{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-[hsl(var(--destructive))] to-foreground">
                  Múltiplos agentes.
                </span>
              </>
            )}
          </h1>
          <p className="mt-3 text-[14px] sm:text-[16px] text-muted-foreground max-w-xl mx-auto">
            {ctxPain ? `${ctxPain} — ${dept.outcome}.` : `${dept.painPoint} — ${dept.outcome}.`}
          </p>
        </div>


        {/* Seletor de departamento */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {DEPARTMENT_PACKAGES.map((d) => {
            const active = d.id === deptId;
            return (
              <button
                key={d.id}
                onClick={() => setDeptId(d.id)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-[12px] transition",
                  active
                    ? "border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))/0.12] text-foreground"
                    : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:text-foreground hover:border-white/20",
                )}
              >
                <span className="font-medium">{d.name.replace(/^Departamento\s+(de\s+)?/i, "")}</span>
                <span className="ml-2 text-[10px] opacity-60">{formatBRL(d.priceMonthly)}/mês</span>
              </button>
            );
          })}
        </div>

        {/* Palco + Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-10 items-start">
          {/* Palco */}
          <div className="relative rounded-3xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-sm p-4 sm:p-6">
            <RoundTable dept={dept} currentIdx={currentIdx} playedIdxs={played} />

            {/* Controles + progresso */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setPlaying((v) => !v)}
                aria-label={playing ? "Pausar" : "Reproduzir"}
                className="h-9 w-9 rounded-full border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition"
              >
                {playing ? (
                  <Pause className="h-4 w-4 text-foreground" />
                ) : (
                  <Play className="h-4 w-4 text-foreground" fill="currentColor" />
                )}
              </button>
              <button
                onClick={handleReset}
                aria-label="Reiniciar"
                className="h-9 w-9 rounded-full border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition"
              >
                <RotateCcw className="h-4 w-4 text-foreground" />
              </button>
              <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full bg-[hsl(var(--destructive))]"
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <span className="tabular-nums text-[11px] text-muted-foreground">
                {Math.max(0, currentIdx + 1)}/{total}
              </span>
            </div>
          </div>

          {/* Feed */}
          <aside className="lg:sticky lg:top-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Feed de execução
              </h2>
              <span className="text-[10px] text-muted-foreground/70">tempo real</span>
            </div>

            {/* Injetor de diretiva ao vivo */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleInjectDirective();
              }}
              className="mb-3 flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 focus-within:border-[hsl(var(--destructive))/0.5] transition"
            >
              <Zap className="h-3.5 w-3.5 text-[hsl(var(--destructive))] shrink-0" />
              <input
                value={directiveDraft}
                onChange={(e) => setDirectiveDraft(e.target.value)}
                placeholder="Injetar diretiva ao squad…"
                aria-label="Injetar diretiva no squad"
                className="flex-1 bg-transparent text-[12.5px] text-foreground placeholder:text-muted-foreground/60 outline-none"
                maxLength={140}
              />
              <button
                type="submit"
                disabled={!directiveDraft.trim()}
                aria-label="Enviar diretiva"
                className="h-6 w-6 rounded-full bg-[hsl(var(--destructive))/0.15] border border-[hsl(var(--destructive))/0.4] flex items-center justify-center text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))/0.25] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <Send className="h-3 w-3" />
              </button>
            </form>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {directives.slice().reverse().map((d) => (
                  <motion.div
                    key={d.id}
                    layout
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="rounded-2xl border border-[hsl(var(--destructive))/0.5] bg-[hsl(var(--destructive))/0.08] p-3.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-[hsl(var(--destructive))/0.2] border border-[hsl(var(--destructive))/0.5] flex items-center justify-center">
                          <Zap className="h-3 w-3 text-[hsl(var(--destructive))]" />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--destructive))]">
                          Diretiva
                        </span>
                      </div>
                      <span className="text-[10px] tabular-nums text-muted-foreground tracking-wider">{d.time}</span>
                    </div>
                    <p className="mt-2 text-[12.5px] leading-snug text-foreground">{d.text}</p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">→ Squad recalibrando prioridades</p>
                  </motion.div>
                ))}
                {feedEntries.length === 0 && directives.length === 0 ? (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[12px] text-muted-foreground italic px-1"
                  >
                    Aguardando primeiros movimentos do squad…
                  </motion.p>
                ) : (
                  feedEntries.map((e) => (
                    <FeedItem key={`${dept.id}-${e.idx}`} entry={e} active={e.idx === currentIdx} />
                  ))
                )}
              </AnimatePresence>
            </div>
          </aside>
        </div>

        {/* CTA final */}
        <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(`/departamentos#${dept.id}`)}
            className="inline-flex items-center gap-2 rounded-full bg-destructive px-6 py-3 text-[13px] font-medium text-destructive-foreground shadow-[0_0_40px_hsl(var(--destructive)/0.35)] transition hover:brightness-110"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Contratar {dept.name} · {formatBRL(dept.priceMonthly)}/mês
          </button>
          <button
            onClick={() => navigate("/simulador-social")}
            className="rounded-full border border-white/[0.1] bg-white/[0.03] px-6 py-3 text-[13px] text-foreground/80 transition hover:text-foreground hover:border-white/25"
          >
            Ver squad nas redes sociais
          </button>
        </div>
      </main>
    </div>
  );
};

export default ExperiencePage;
