import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Briefcase, Headphones, Megaphone, Scale, Wallet, Users, ArrowUpRight, ArrowRight } from "lucide-react";

const DEPTS = [
  { icon: Briefcase, label: "Comercial", active: true, badge: 3 },
  { icon: Headphones, label: "Atendimento", active: false, badge: 12 },
  { icon: Megaphone, label: "Marketing", active: false, badge: 1 },
  { icon: Scale, label: "Jurídico", active: false },
  { icon: Wallet, label: "Financeiro", active: false, badge: 2 },
  { icon: Users, label: "RH", active: false },
];

const AGENT_LINES = [
  "Cadenciando 47 leads qualificados do ICP fintech...",
  "Sequência de e-mail personalizada disparada para 32 contas.",
  "3 reuniões agendadas · handoff para o closer aprovado.",
];

const Typewriter = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [shown, setShown] = useState("");
  useEffect(() => {
    let cancelled = false;
    const start = setTimeout(() => {
      let i = 0;
      const tick = () => {
        if (cancelled) return;
        i += 1;
        setShown(text.slice(0, i));
        if (i < text.length) setTimeout(tick, 18 + Math.random() * 22);
      };
      tick();
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(start);
    };
  }, [text, delay]);
  return <span>{shown}</span>;
};

interface LiveKpiProps {
  label: string;
  base: number;
  incrementEvery: number;
  step?: number;
  formatter?: (v: number) => string;
  delta: string;
  accent?: boolean;
  delay?: number;
}

const LiveKpi = ({ label, base, incrementEvery, step = 1, formatter, delta, accent, delay = 0 }: LiveKpiProps) => {
  const [value, setValue] = useState(base);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setValue((v) => +(v + step).toFixed(2));
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }, incrementEvery);
    return () => clearInterval(id);
  }, [incrementEvery, step]);

  const display = formatter ? formatter(value) : value.toLocaleString("pt-BR");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="p-3.5 rounded-xl bg-black/40 border border-white/10"
    >
      <div className="text-[10px] uppercase tracking-[0.12em] text-white/45 mb-2">{label}</div>
      <div
        className={`text-2xl font-semibold tracking-tight transition-colors duration-500 ${
          accent ? "text-primary" : "text-white"
        } ${pulse ? "!text-primary" : ""}`}
      >
        {display}
      </div>
      <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-white/50">
        <ArrowUpRight className="h-2.5 w-2.5 text-primary" />
        {delta}
      </div>
    </motion.div>
  );
};

const PanelMockup = () => {
  return (
    <div className="relative rounded-t-3xl border-t border-x border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent overflow-hidden shadow-[0_-30px_80px_-30px_hsl(0_85%_55%/0.15)]">
      {/* Mobile: horizontal scroll preserves the desktop dashboard look
          without collapsing KPI labels over values. */}
      <div className="overflow-x-auto md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="min-w-[720px] md:min-w-0">
      {/* Chrome */}
      <div className="flex items-center gap-1.5 px-5 py-3 border-b border-white/10 bg-black/40">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <div className="ml-4 flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.04] border border-white/10">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-mono text-white/60">clauthor.com/dashboard</span>
        </div>
        <span className="ml-auto text-[10px] font-mono uppercase tracking-[0.14em] text-white/40">
          live · 24/7
        </span>
      </div>

      <div className="grid grid-cols-12 h-[440px] overflow-hidden">

        {/* Sidebar */}
        <aside className="col-span-3 border-r border-white/10 p-4 space-y-1 bg-black/20">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40 px-2 pb-2">
            Departamentos
          </div>
          {DEPTS.map((d) => (
            <div
              key={d.label}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                d.active
                  ? "bg-white/[0.08] text-white border border-white/10"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <d.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                <span className="truncate">{d.label}</span>
              </div>
              {d.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                    d.active ? "bg-primary text-primary-foreground" : "bg-white/10 text-white/60"
                  }`}
                >
                  {d.badge}
                </span>
              )}
            </div>
          ))}
        </aside>

        {/* Main */}
        <main className="col-span-9 p-5 space-y-4 overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-[10px] uppercase tracking-[0.14em] text-white/40">
                  Departamento Comercial
                </div>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                  R$ 1.700/mês
                </span>
              </div>
              <div className="text-lg font-semibold text-white tracking-tight">
                Operando · 12 agentes ativos
              </div>
              <div className="mt-0.5 text-[10px] text-white/45">
                Primeiro lead qualificado em <span className="text-white/70 font-semibold">4h 12min</span>
              </div>
            </div>
            <Link
              to="/preview-dashboard"
              className="shrink-0 text-[11px] font-semibold px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground inline-flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
            >
              Ver painel real
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-3 gap-3">
            <LiveKpi
              label="Leads qualificados"
              base={1284}
              incrementEvery={7000}
              delta="+38%"
              delay={0}
            />
            <LiveKpi
              label="Receita gerada"
              base={2.4}
              formatter={(v) => `R$ ${v.toFixed(2).replace(".", ",")}M`}
              incrementEvery={18000}
              step={0.01}
              delta="+62%"
              accent
              delay={0.08}
            />
            <LiveKpi
              label="Tempo economizado"
              base={184}
              formatter={(v) => `${Math.round(v)}h`}
              incrementEvery={11000}
              delta="esta semana"
              delay={0.16}
            />
          </div>


          {/* Live agent output */}
          <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 pb-1">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              </div>
              <span className="text-[11px] font-mono text-white/70">SDR-Prospecção · Agora</span>
              <span className="ml-auto text-[9px] font-semibold uppercase tracking-[0.12em] text-primary">
                Executando
              </span>
            </div>
            {AGENT_LINES.map((line, i) => (
              <div key={i} className="text-[11px] font-mono text-white/70 leading-relaxed pl-8">
                <span className="text-white/30">›</span>{" "}
                <Typewriter text={line} delay={i * 900} />
              </div>
            ))}
          </div>
        </main>
      </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
    </div>

  );
};

export default PanelMockup;
