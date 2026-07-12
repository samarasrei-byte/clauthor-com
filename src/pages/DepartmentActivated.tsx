import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Calendar, CheckCircle2, MessageCircle, Newspaper,
  Sparkles, ListChecks, Activity, X, ThumbsUp, ThumbsDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PremiumCTAButton } from "@/components/ui/premium-cta-button";
import { getDepartmentById } from "@/data/departmentPackages";
import { WORKFORCE_CATALOG } from "@/data/workforceCatalog";
import AgentsWorkingScene from "@/components/departments/AgentsWorkingScene";
import SEO from "@/components/SEO";

/* -------------------------------------------------- */
/* Thor Guided Tour                                    */
/* -------------------------------------------------- */

const TOUR_STEPS = [
  { title: "Bem-vindo ao seu novo departamento", body: "O Thor vai te guiar pelas 4 áreas onde você acompanha a operação. Leva 30 segundos." },
  { title: "Second Brain", body: "Aqui você vê agenda, notícias e tarefas em andamento — o cérebro externo do seu negócio." },
  { title: "Aprovações", body: "Toda ação de impacto passa por você. Aprovar ou recusar em 1 clique." },
  { title: "Agentes ao vivo", body: "Veja seus agentes trabalhando e conversando em tempo real. Isso é o dia a dia do departamento." },
];

function ThorTour({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const s = TOUR_STEPS[step];
  const last = step === TOUR_STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-background shadow-2xl p-6 relative"
        >
          <button onClick={onDone} className="absolute top-3 right-3 p-1 rounded-md text-white/40 hover:text-white hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-[10px] font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="w-3 h-3" /> Thor · Passo {step + 1}/{TOUR_STEPS.length}
          </div>
          <h3 className="mt-3 text-xl font-display font-semibold text-white">{s.title}</h3>
          <p className="mt-2 text-sm text-white/60 leading-relaxed">{s.body}</p>

          <div className="mt-6 flex items-center justify-between">
            <button onClick={onDone} className="text-xs text-white/40 hover:text-white">Pular tour</button>
            <Button size="sm" onClick={() => last ? onDone() : setStep(step + 1)} className="gap-1.5">
              {last ? <>Pronto <CheckCircle2 className="w-3.5 h-3.5" /></> : <>Próximo <ArrowRight className="w-3.5 h-3.5" /></>}
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-white/20"}`} />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* -------------------------------------------------- */
/* Second Brain Panel (mock data — plug real feeds later) */
/* -------------------------------------------------- */

function SecondBrain({ deptName }: { deptName: string }) {
  const [approvals, setApprovals] = useState([
    { id: "a1", title: "Proposta comercial para Acme Corp", type: "Contrato" },
    { id: "a2", title: "Campanha de anúncios · Meta Ads", type: "Marketing" },
  ]);
  const [tasks] = useState([
    { id: "t1", agent: "SDR Outbound", action: "Prospectando 42 leads no LinkedIn", progress: 68 },
    { id: "t2", agent: "Redator de Propostas", action: "Gerando proposta para lead #218", progress: 34 },
    { id: "t3", agent: "Rev Ops", action: "Atualizando forecast do trimestre", progress: 91 },
  ]);
  const agenda = [
    { time: "10:30", title: "Reunião de demo · lead Enterprise" },
    { time: "14:00", title: "Follow-up com decisor Acme" },
    { time: "16:15", title: "Review semanal do pipeline" },
  ];
  const news = [
    `Nova onda de investimento em automação B2B — impacto direto no ${deptName}`,
    "Concorrente lançou funcionalidade similar — oportunidade de diferenciação",
    "Mudança regulatória em vigor a partir de janeiro",
  ];

  const handleApprove = (id: string) => setApprovals((a) => a.filter((x) => x.id !== id));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-5 bg-white/[0.02] border-white/10 rounded-2xl">
        <div className="flex items-center gap-2 mb-3"><Calendar className="w-4 h-4 text-white/60" /><h3 className="font-semibold text-white">Agenda de hoje</h3></div>
        <ul className="space-y-2">
          {agenda.map((e) => (
            <li key={e.time} className="flex items-center gap-3 text-sm">
              <span className="text-white/40 font-mono text-xs w-12">{e.time}</span>
              <span className="text-white/80">{e.title}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5 bg-white/[0.02] border-white/10 rounded-2xl">
        <div className="flex items-center gap-2 mb-3"><Newspaper className="w-4 h-4 text-white/60" /><h3 className="font-semibold text-white">Notícias relevantes</h3></div>
        <ul className="space-y-2 text-sm text-white/70">
          {news.map((n, i) => <li key={i} className="leading-relaxed">• {n}</li>)}
        </ul>
      </Card>

      <Card className="p-5 bg-white/[0.02] border-white/10 rounded-2xl">
        <div className="flex items-center gap-2 mb-3"><ListChecks className="w-4 h-4 text-white/60" /><h3 className="font-semibold text-white">Tarefas em andamento</h3></div>
        <ul className="space-y-3">
          {tasks.map((t) => (
            <li key={t.id} className="text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/80"><span className="text-white/40">{t.agent} ·</span> {t.action}</span>
                <span className="text-xs text-white/40">{t.progress}%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${t.progress}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5 bg-white/[0.02] border-white/10 rounded-2xl">
        <div className="flex items-center gap-2 mb-3"><CheckCircle2 className="w-4 h-4 text-white/60" /><h3 className="font-semibold text-white">Aprovações pendentes</h3>{approvals.length > 0 && <Badge variant="outline" className="ml-auto border-white/10 text-white/60 text-[10px]">{approvals.length}</Badge>}</div>
        {approvals.length === 0 ? (
          <p className="text-xs text-white/40">Nenhuma aprovação pendente.</p>
        ) : (
          <ul className="space-y-2">
            {approvals.map((a) => (
              <li key={a.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{a.title}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">{a.type}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => handleApprove(a.id)} className="h-7 w-7 text-emerald-400 hover:bg-emerald-500/10"><ThumbsUp className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" onClick={() => handleApprove(a.id)} className="h-7 w-7 text-white/40 hover:bg-white/5"><ThumbsDown className="w-3.5 h-3.5" /></Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* -------------------------------------------------- */
/* Agents Live Panel                                   */
/* -------------------------------------------------- */

const CONVERSATIONS = [
  { from: 0, to: 1, msg: "Passei 3 leads quentes pra você fechar." },
  { from: 1, to: 0, msg: "Recebido. Vou agendar demo com o primeiro em 15min." },
  { from: 2, to: 1, msg: "Gerei a proposta pro lead #218. Revisa?" },
  { from: 1, to: 2, msg: "Aprovada. Envia via DocuSign." },
  { from: 0, to: 2, msg: "Enriqueci a lista com 42 novos ICPs." },
  { from: 2, to: 0, msg: "Perfeito. Estou personalizando as sequências." },
];

function AgentsLive({ agentSlugs }: { agentSlugs: readonly string[] }) {
  const agents = useMemo(() => {
    return agentSlugs.slice(0, 3).map((s) => WORKFORCE_CATALOG.find((a) => a.id === s)).filter(Boolean) as any[];
  }, [agentSlugs]);

  const [log, setLog] = useState<{ from: number; to: number; msg: string; ts: string }[]>([]);

  useEffect(() => {
    let i = 0;
    const now = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const push = () => {
      const c = CONVERSATIONS[i % CONVERSATIONS.length];
      setLog((l) => [...l.slice(-7), { ...c, ts: now() }]);
      i++;
    };
    push();
    const id = setInterval(push, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <Card className="p-5 bg-white/[0.02] border-white/10 rounded-2xl">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
        <h3 className="font-semibold text-white">Agentes trabalhando ao vivo</h3>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-emerald-400/70 font-semibold">Live</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {agents.map((a, i) => (
          <div key={a.id} className="p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-center">
            <div className="w-8 h-8 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/70">
              {a.role.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-[11px] text-white/80 mt-1.5 font-medium truncate">{a.role}</div>
            <div className="mt-1 flex items-center justify-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-[9px] text-white/40 uppercase tracking-wider">Ativo</span></div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 min-h-[240px] max-h-[300px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {log.map((entry, idx) => {
            const author = agents[entry.from]?.role ?? "Agente";
            const target = agents[entry.to]?.role ?? "Agente";
            return (
              <motion.div
                key={idx + entry.msg}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2 text-xs p-2 rounded-md hover:bg-white/[0.02]"
              >
                <MessageCircle className="w-3 h-3 text-white/30 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-white/40">
                    <span className="text-white/80 font-medium">{author}</span> → <span className="text-white/60">{target}</span>
                    <span className="ml-2 text-white/25 text-[10px]">{entry.ts}</span>
                  </div>
                  <div className="text-white/70 mt-0.5">{entry.msg}</div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Card>
  );
}

/* -------------------------------------------------- */
/* Page                                                */
/* -------------------------------------------------- */

export default function DepartmentActivated() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const dept = slug ? getDepartmentById(slug) : undefined;
  const [tourDone, setTourDone] = useState(() => localStorage.getItem(`tour_dept_${slug}`) === "1");

  useEffect(() => {
    if (tourDone && slug) localStorage.setItem(`tour_dept_${slug}`, "1");
  }, [tourDone, slug]);

  if (!dept) return <Navigate to="/departamentos" replace />;
  const Icon = dept.icon;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SEO title={`${dept.name} ativo · Clauthor`} description={`Painel operacional do ${dept.name}.`} />

      {!tourDone && <ThorTour onDone={() => setTourDone(true)} />}

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl border border-emerald-400/30 bg-emerald-500/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
            </div>
            <div>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[10px] mb-1">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Ativo
              </Badge>
              <h1 className="text-2xl md:text-3xl font-display font-semibold text-white">{dept.name}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to="/dashboard">Ir para o dashboard</Link></Button>
            <PremiumCTAButton variant="red" onClick={() => navigate("/departamentos")}>Contratar outro</PremiumCTAButton>
          </div>
        </motion.div>

        {/* Second Brain */}
        <section>
          <h2 className="text-lg font-display font-semibold mb-3 text-white/90 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Second Brain
          </h2>
          <SecondBrain deptName={dept.name} />
        </section>

        {/* Agents Live */}
        <section>
          <h2 className="text-lg font-display font-semibold mb-3 text-white/90">Operação em tempo real</h2>
          <AgentsLive agentSlugs={dept.agentSlugs} />
        </section>

        {/* Scene */}
        <section>
          <AgentsWorkingScene agentSlugs={dept.agentSlugs} />
        </section>
      </div>
    </div>
  );
}
