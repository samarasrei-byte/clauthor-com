import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Bot, Sparkles, Play, RotateCcw, Mic, MicOff,
  Send, Lightbulb, Target, ListChecks,
  Loader2, Zap, Brain, Users, Workflow, BarChart3,
  Palette, ChevronRight, Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────── */

interface HolographicAgent {
  id: string;
  name: string;
  specialty: string;
  tier: string;
  role: "ceo" | "sales" | "marketing" | "analytics" | "design" | "automation";
  state: "idle" | "listening" | "processing" | "speaking";
  color: string;
}

interface MeetingMessage {
  id: string;
  agentId: string;
  agentName: string;
  agentRole: string;
  content: string;
  type: "analysis" | "strategy" | "creative" | "action" | "question";
  timestamp: Date;
}

interface ActionItem {
  id: string;
  task: string;
  assignedTo: string;
  priority: "high" | "medium" | "low";
}

/* ── Constants ─────────────────────────────────────── */

const AGENT_ROLES: Record<
  HolographicAgent["role"],
  { label: string; color: string; icon: typeof Brain; specialty: string }
> = {
  ceo: { label: "CEO AI", color: "hsl(var(--primary))", icon: Brain, specialty: "Estratégia Geral" },
  sales: { label: "Sales AI", color: "hsl(142,76%,36%)", icon: Target, specialty: "Vendas & Prospecção" },
  marketing: { label: "Marketing AI", color: "hsl(280,70%,50%)", icon: Sparkles, specialty: "Campanhas & Branding" },
  analytics: { label: "Data Analyst AI", color: "hsl(200,80%,50%)", icon: BarChart3, specialty: "Análise de Dados" },
  design: { label: "Design AI", color: "hsl(330,70%,50%)", icon: Palette, specialty: "Criação Visual" },
  automation: { label: "Automation AI", color: "hsl(45,90%,50%)", icon: Workflow, specialty: "Automação" },
};

/* ── Sub-components ────────────────────────────────── */

/** Ambient floating particle */
const Particle = ({ i }: { i: number }) => {
  const x = Math.random() * 100;
  const dur = 6 + Math.random() * 6;
  return (
    <motion.div
      className="absolute w-[2px] h-[2px] rounded-full bg-primary/20"
      style={{ left: `${x}%`, bottom: 0 }}
      animate={{ y: [0, -800], opacity: [0, 0.5, 0] }}
      transition={{ duration: dur, delay: i * 0.4, repeat: Infinity, ease: "linear" }}
    />
  );
};

/** Single agent seat around the table */
const AgentSeat = ({
  agent,
  angle,
  radius,
  isSelected,
}: {
  agent: HolographicAgent;
  angle: number; // radians
  radius: number; // px from center
  isSelected: boolean;
}) => {
  const roleInfo = AGENT_ROLES[agent.role];
  const Icon = roleInfo.icon;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius * 0.55; // squash for perspective

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1, x, y }}
      transition={{ type: "spring", stiffness: 80, damping: 14 }}
      className="absolute cursor-pointer group"
      style={{ zIndex: y > 0 ? 10 : 30 }} // depth sorting
    >
      {/* Outer glow pulses */}
      <motion.div
        className="absolute -inset-6 rounded-full blur-2xl pointer-events-none"
        style={{ backgroundColor: roleInfo.color }}
        animate={{
          opacity:
            agent.state === "speaking" ? [0.25, 0.5, 0.25] :
            agent.state === "processing" ? [0.08, 0.2, 0.08] : 0.06,
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Speaking rings */}
      {agent.state === "speaking" && (
        <>
          {[0, 0.4].map((d) => (
            <motion.div
              key={d}
              className="absolute -inset-5 rounded-full border"
              style={{ borderColor: roleInfo.color }}
              animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: d }}
            />
          ))}
        </>
      )}

      {/* Processing orbit */}
      {agent.state === "processing" && (
        <motion.svg className="absolute -inset-5 w-full h-full pointer-events-none" viewBox="0 0 80 80">
          <motion.circle
            cx="40" cy="40" r="34"
            fill="none" stroke={roleInfo.color} strokeWidth="1"
            strokeDasharray="6,8" opacity={0.5}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "center" }}
          />
        </motion.svg>
      )}

      {/* Head orb */}
      <motion.div
        className="relative w-14 h-14 rounded-full flex items-center justify-center mx-auto"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${roleInfo.color}, ${roleInfo.color}40 70%, transparent)`,
          boxShadow:
            agent.state === "speaking"
              ? `0 0 40px ${roleInfo.color}, 0 0 80px ${roleInfo.color}40`
              : `0 0 20px ${roleInfo.color}30`,
        }}
        animate={{
          scale: agent.state === "speaking" ? [1, 1.12, 1] : 1,
        }}
        transition={{ duration: 1, repeat: agent.state === "speaking" ? Infinity : 0 }}
      >
        <Icon className="w-6 h-6 text-white/90" strokeWidth={1.5} />

        {/* Inner particle sparkle when speaking */}
        {agent.state === "speaking" &&
          [...Array(6)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white/80"
              style={{
                left: `${25 + Math.random() * 50}%`,
                top: `${15 + Math.random() * 70}%`,
              }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 0.6 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.12 }}
            />
          ))}
      </motion.div>

      {/* Body trapezoid */}
      <motion.div
        className="relative w-12 h-8 mx-auto -mt-1"
        style={{
          background: `linear-gradient(180deg, ${roleInfo.color}35 0%, transparent 100%)`,
          clipPath: "polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)",
        }}
      />

      {/* Name tag */}
      <motion.div
        className="mt-2 text-center whitespace-nowrap"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <span
          className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide backdrop-blur-md border"
          style={{
            backgroundColor: `${roleInfo.color}12`,
            borderColor: `${roleInfo.color}30`,
            color: roleInfo.color,
          }}
        >
          {roleInfo.label}
        </span>
      </motion.div>

      {/* Speaking waveform */}
      {agent.state === "speaking" && (
        <div className="flex justify-center gap-[2px] mt-1">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="w-[3px] rounded-full"
              style={{ backgroundColor: roleInfo.color }}
              animate={{ height: [4, 14, 4] }}
              transition={{ duration: 0.35, repeat: Infinity, delay: i * 0.08 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

/** SVG energy line between two agents */
const EnergyLine = ({
  x1, y1, x2, y2, active, color,
}: {
  x1: number; y1: number; x2: number; y2: number; active: boolean; color: string;
}) => {
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2 - 30;
  const pathD = `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;

  return (
    <g>
      <motion.path
        d={pathD}
        fill="none"
        stroke={active ? color : "hsl(var(--border))"}
        strokeWidth={active ? 2 : 0.5}
        strokeDasharray={active ? "none" : "4,6"}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1, opacity: active ? 0.7 : 0.15 }}
        transition={{ duration: 0.8 }}
      />
      {active && (
        <motion.circle
          r="3"
          fill={color}
          animate={{ offsetDistance: ["0%", "100%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          style={{ offsetPath: `path('${pathD}')` } as any}
        />
      )}
    </g>
  );
};

/* ── Main Component ────────────────────────────────── */

const HolographicMeetingRoom = () => {
  const { user } = useAuth();
  const [meetingActive, setMeetingActive] = useState(false);
  const [topic, setTopic] = useState("");
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  const [speakingAgentId, setSpeakingAgentId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"setup" | "discussion" | "planning" | "conclusion">("setup");
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { data: dbAgents = [], isLoading } = useQuery({
    queryKey: ["holographic-meeting-agents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .limit(6);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const assignRole = (name: string, idx: number): HolographicAgent["role"] => {
    const n = name.toLowerCase();
    if (n.includes("ceo") || n.includes("chief")) return "ceo";
    if (n.includes("sales") || n.includes("vend")) return "sales";
    if (n.includes("market")) return "marketing";
    if (n.includes("data") || n.includes("analy")) return "analytics";
    if (n.includes("design") || n.includes("creat")) return "design";
    if (n.includes("auto") || n.includes("process")) return "automation";
    const roles: HolographicAgent["role"][] = ["ceo", "sales", "marketing", "analytics", "design", "automation"];
    return roles[idx % roles.length];
  };

  const agents: HolographicAgent[] = dbAgents.map((a, i) => {
    const role = assignRole(a.name, i);
    return {
      id: a.id,
      name: a.name,
      specialty: AGENT_ROLES[role].specialty,
      tier: a.tier,
      role,
      state:
        speakingAgentId === a.id ? "speaking" :
        selectedAgents.includes(a.id) ? "processing" : "idle",
      color: AGENT_ROLES[role].color,
    };
  });

  /* ── Voice ──────────────────────────────────────── */
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SR = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "pt-BR";
      recognitionRef.current.onresult = (e: any) => {
        const t = Array.from(e.results).map((r: any) => r[0].transcript).join("");
        if (meetingActive) setInputValue(t);
        else setTopic(t);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [meetingActive]);

  const toggleVoice = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    else { recognitionRef.current?.start(); setIsListening(true); }
  };

  /* ── Agent selection ────────────────────────────── */
  const selectRelevantAgents = (text: string) => {
    const t = text.toLowerCase();
    const relevant: string[] = [];
    agents.forEach((a) => {
      if ((t.includes("campanha") || t.includes("marketing")) && ["marketing", "design", "automation"].includes(a.role)) relevant.push(a.id);
      if ((t.includes("venda") || t.includes("lead") || t.includes("conversão")) && ["sales", "analytics", "automation"].includes(a.role)) relevant.push(a.id);
      if ((t.includes("dados") || t.includes("análise")) && ["analytics", "ceo"].includes(a.role)) relevant.push(a.id);
      if ((t.includes("design") || t.includes("visual")) && ["design", "marketing"].includes(a.role)) relevant.push(a.id);
      if ((t.includes("automação") || t.includes("processo")) && ["automation", "analytics"].includes(a.role)) relevant.push(a.id);
    });
    const ceo = agents.find((a) => a.role === "ceo");
    if (ceo && !relevant.includes(ceo.id)) relevant.unshift(ceo.id);
    if (relevant.length < 3) agents.forEach((a) => { if (!relevant.includes(a.id) && relevant.length < 3) relevant.push(a.id); });
    return [...new Set(relevant)].slice(0, 5);
  };

  /* ── Simulation ─────────────────────────────────── */
  const runMeeting = async () => {
    if (!topic || agents.length === 0) return;
    const ids = selectRelevantAgents(topic);
    setSelectedAgents(ids);
    setPhase("discussion");
    await delay(1200);

    const active = agents.filter((a) => ids.includes(a.id));
    const script: Array<{ role: HolographicAgent["role"]; type: MeetingMessage["type"]; content: string }> = [
      { role: "ceo", type: "analysis", content: `Analisando: "${topic}". Vamos estruturar uma abordagem coordenada.` },
      { role: "analytics", type: "analysis", content: "Dados históricos indicam oportunidades significativas de otimização nesse contexto." },
      { role: "marketing", type: "strategy", content: "Recomendo estratégia multicanal com narrativa focada em engajamento do público-alvo." },
      { role: "sales", type: "strategy", content: "Integrar pontos de conversão em cada etapa do funil é essencial." },
      { role: "design", type: "creative", content: "Vou desenvolver conceitos visuais impactantes para comunicar a proposta de valor." },
      { role: "automation", type: "action", content: "Configuro automações para escalar e garantir consistência nos pontos de contato." },
      { role: "ceo", type: "action", content: "Consolidando estratégias em plano de ação executável com métricas de sucesso." },
    ];

    for (const s of script) {
      const agent = active.find((a) => a.role === s.role) || active[0];
      if (!agent) continue;
      setSpeakingAgentId(agent.id);
      await delay(500);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-${Math.random()}`,
          agentId: agent.id,
          agentName: agent.name,
          agentRole: AGENT_ROLES[agent.role].label,
          content: s.content,
          type: s.type,
          timestamp: new Date(),
        },
      ]);
      await delay(2200);
      setSpeakingAgentId(null);
      await delay(350);
    }

    setPhase("planning");
    await delay(800);
    setPhase("conclusion");
    setActionItems([
      { id: "1", task: "Criar estratégia multicanal", assignedTo: "Marketing AI", priority: "high" },
      { id: "2", task: "Desenvolver assets visuais", assignedTo: "Design AI", priority: "high" },
      { id: "3", task: "Configurar funil automatizado", assignedTo: "Automation AI", priority: "medium" },
      { id: "4", task: "Dashboard de métricas real-time", assignedTo: "Data Analyst AI", priority: "medium" },
      { id: "5", task: "Sequência de follow-up para leads", assignedTo: "Sales AI", priority: "high" },
    ]);
  };

  const startMeeting = () => {
    if (!topic) return;
    setMeetingActive(true);
    setMessages([]);
    setActionItems([]);
    runMeeting();
  };

  const resetMeeting = () => {
    setMeetingActive(false);
    setPhase("setup");
    setMessages([]);
    setActionItems([]);
    setSpeakingAgentId(null);
    setSelectedAgents([]);
    setTopic("");
    setInputValue("");
  };

  const handleSendInput = () => {
    if (!inputValue.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        agentId: "user",
        agentName: "Você",
        agentRole: "Líder",
        content: inputValue,
        type: "question",
        timestamp: new Date(),
      },
    ]);
    setInputValue("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  /* ── Positions for agents around the table ────── */
  const TABLE_RADIUS = 200; // px from visual center
  const getAngle = (idx: number, total: number) =>
    (idx / total) * 2 * Math.PI - Math.PI / 2;

  const agentPositions = agents.map((_, idx) => {
    const angle = getAngle(idx, agents.length);
    return {
      x: Math.cos(angle) * TABLE_RADIUS,
      y: Math.sin(angle) * TABLE_RADIUS * 0.55,
    };
  });

  /* ── Message styling ────────────────────────────── */
  const msgStyle = (t: MeetingMessage["type"]) => {
    switch (t) {
      case "analysis": return "border-l-[hsl(200,80%,50%)] bg-[hsl(200,80%,50%)]/5";
      case "strategy": return "border-l-[hsl(280,70%,50%)] bg-[hsl(280,70%,50%)]/5";
      case "creative": return "border-l-[hsl(330,70%,50%)] bg-[hsl(330,70%,50%)]/5";
      case "action": return "border-l-[hsl(142,76%,36%)] bg-[hsl(142,76%,36%)]/5";
      case "question": return "border-l-primary bg-primary/5";
    }
  };

  const priorityBadge = (p: string) => {
    switch (p) {
      case "high": return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium": return "bg-accent-amber/10 text-accent-amber border-accent-amber/20";
      default: return "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20";
    }
  };

  /* ── RENDER ─────────────────────────────────────── */
  return (
    <div className="relative flex flex-col h-[calc(100vh-8rem)] bg-gradient-to-b from-background via-background/95 to-background overflow-hidden">
      {/* ── Ambient layer ─────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => <Particle key={i} i={i} />)}
        {/* Central glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-primary/[0.04] blur-[120px]" />
        {/* Grid floor */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1/2 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)/0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 100%)",
          }}
        />
      </div>

      <AnimatePresence mode="wait">
        {!meetingActive ? (
          /* ════════════════════════════════════════════
             SETUP SCREEN
             ════════════════════════════════════════════ */
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            className="relative z-10 flex-1 flex flex-col items-center justify-center gap-8 px-4"
          >
            {/* Header */}
            <div className="text-center space-y-3">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20"
              >
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary tracking-wide">SALA DE ESTRATÉGIA IA</span>
              </motion.div>
              <h1 className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                Mesa de Reunião
              </h1>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Convoque seu time de IA para uma reunião estratégica. Descreva um objetivo e seus agentes irão colaborar.
              </p>
            </div>

            {/* Preview of agents */}
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {agents.slice(0, 6).map((a) => {
                const Icon = AGENT_ROLES[a.role].icon;
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.1, y: -4 }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center border"
                      style={{
                        background: `radial-gradient(circle at 35% 35%, ${AGENT_ROLES[a.role].color}60, transparent 70%)`,
                        borderColor: `${AGENT_ROLES[a.role].color}30`,
                        boxShadow: `0 0 20px ${AGENT_ROLES[a.role].color}20`,
                      }}
                    >
                      <Icon className="w-5 h-5 text-white/80" strokeWidth={1.5} />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{AGENT_ROLES[a.role].label}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* Input area */}
            <div className="w-full max-w-xl space-y-4">
              <div className="relative">
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder='Descreva seu objetivo… Ex: "Criar campanha para a Copa do Mundo"'
                  rows={3}
                  className="w-full resize-none rounded-2xl bg-card/40 backdrop-blur-md border border-border/40 px-5 py-4 pr-14 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); startMeeting(); } }}
                />
                <button
                  onClick={toggleVoice}
                  className={cn(
                    "absolute right-3 top-3 w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isListening ? "bg-primary/20 text-primary animate-pulse" : "text-muted-foreground hover:text-foreground hover:bg-card"
                  )}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-2 justify-center">
                {["Lançar novo produto", "Aumentar conversão de leads", "Campanha Black Friday", "Reduzir churn"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setTopic(s)}
                    className="text-xs px-4 py-2 rounded-full bg-card/50 border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="text-center">
                <Button
                  onClick={startMeeting}
                  disabled={!topic || agents.length < 2}
                  size="lg"
                  className="gap-3 px-10 py-6 text-base rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                >
                  <Play className="h-5 w-5" />
                  Iniciar Reunião com {agents.length} Agentes
                </Button>
                {agents.length < 2 && (
                  <p className="text-[11px] text-muted-foreground mt-3">Mínimo de 2 agentes ativos necessários</p>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* ════════════════════════════════════════════
             ACTIVE MEETING
             ════════════════════════════════════════════ */
          <motion.div
            key="meeting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 flex-1 flex flex-col overflow-hidden"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className={cn("w-2 h-2 rounded-full", phase === "conclusion" ? "bg-accent-emerald" : "bg-primary animate-pulse")} />
                <span className="text-sm font-display font-semibold text-foreground/80">
                  {phase === "discussion" ? "Discussão" : phase === "planning" ? "Planejando…" : phase === "conclusion" ? "Plano Pronto" : "Preparando…"}
                </span>
                <Badge variant="secondary" className="text-[9px]">{selectedAgents.length} agentes</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={resetMeeting} className="gap-2 text-xs text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5" /> Nova Reunião
              </Button>
            </div>

            {/* Main content: table + chat side-by-side */}
            <div className="flex-1 flex min-h-0">
              {/* ── Holographic Table Area ──────────── */}
              <div className="hidden lg:flex flex-1 items-center justify-center relative">
                {/* Table surface – large ellipse */}
                <div className="relative" style={{ width: 520, height: 340 }}>
                  {/* Table base glow */}
                  <motion.div
                    className="absolute inset-0 rounded-[50%] bg-primary/[0.03] border border-primary/10"
                    animate={{ boxShadow: ["0 0 60px hsl(var(--primary)/0.05)", "0 0 100px hsl(var(--primary)/0.1)", "0 0 60px hsl(var(--primary)/0.05)"] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  {/* Inner ring */}
                  <div className="absolute inset-8 rounded-[50%] border border-primary/[0.06]" />
                  {/* Glass surface */}
                  <div className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-primary/[0.02] via-transparent to-primary/[0.01]" />

                  {/* Center hologram content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="text-center px-16 max-w-xs"
                    >
                      {phase === "conclusion" ? (
                        <div className="space-y-2">
                          <ListChecks className="h-6 w-6 text-accent-emerald mx-auto" />
                          <p className="text-xs font-semibold text-accent-emerald">Plano Gerado</p>
                          <p className="text-[10px] text-muted-foreground">{actionItems.length} tarefas criadas</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Lightbulb className="h-5 w-5 text-primary/60 mx-auto" />
                          <p className="text-[10px] text-primary/50 uppercase tracking-widest">Objetivo</p>
                          <p className="text-xs font-medium text-primary/80 leading-relaxed line-clamp-3">{topic}</p>
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* Phase progress */}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {(["setup", "discussion", "planning", "conclusion"] as const).map((p, i) => {
                      const phaseIdx = ["setup", "discussion", "planning", "conclusion"].indexOf(phase);
                      return (
                        <div key={p} className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full transition-all", i <= phaseIdx ? "bg-primary shadow-lg shadow-primary/50" : "bg-muted/40")} />
                          {i < 3 && <div className={cn("w-6 h-px transition-colors", i < phaseIdx ? "bg-primary/50" : "bg-border/20")} />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Connection lines SVG layer */}
                  <svg
                    className="absolute pointer-events-none"
                    style={{ left: "50%", top: "50%", width: 600, height: 400, marginLeft: -300, marginTop: -200, overflow: "visible" }}
                  >
                    {selectedAgents.length > 1 &&
                      agents
                        .filter((a) => selectedAgents.includes(a.id))
                        .map((a, i, arr) => {
                          if (i >= arr.length - 1) return null;
                          const next = arr[i + 1];
                          const aIdx = agents.indexOf(a);
                          const nIdx = agents.indexOf(next);
                          const p1 = agentPositions[aIdx];
                          const p2 = agentPositions[nIdx];
                          if (!p1 || !p2) return null;
                          return (
                            <EnergyLine
                              key={`${a.id}-${next.id}`}
                              x1={300 + p1.x}
                              y1={200 + p1.y}
                              x2={300 + p2.x}
                              y2={200 + p2.y}
                              active={speakingAgentId === a.id || speakingAgentId === next.id}
                              color={AGENT_ROLES[a.role].color}
                            />
                          );
                        })}
                  </svg>

                  {/* Agent seats */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {agents.map((a, idx) => (
                      <AgentSeat
                        key={a.id}
                        agent={{
                          ...a,
                          state:
                            speakingAgentId === a.id ? "speaking" :
                            selectedAgents.includes(a.id) ? "processing" : "idle",
                        }}
                        angle={getAngle(idx, agents.length)}
                        radius={TABLE_RADIUS}
                        isSelected={selectedAgents.includes(a.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Chat / Discussion Panel ────────── */}
              <div className="w-full lg:w-[420px] lg:border-l border-border/10 flex flex-col bg-card/20 backdrop-blur-sm">
                {/* Chat messages */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                  <AnimatePresence mode="popLayout">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={cn(
                          "p-3 rounded-xl border-l-2",
                          msg.agentId === "user"
                            ? "border-l-primary bg-primary/5 ml-8"
                            : msgStyle(msg.type)
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">{msg.agentRole}</span>
                          <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 border-border/30">
                            {msg.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{msg.content}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Speaking indicator */}
                  {speakingAgentId && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 px-3 py-2"
                    >
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-primary/60"
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {agents.find((a) => a.id === speakingAgentId)?.name || "Agente"} está analisando…
                      </span>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Action Items */}
                <AnimatePresence>
                  {phase === "conclusion" && actionItems.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="border-t border-border/10 bg-accent-emerald/[0.03] p-4 space-y-2 max-h-52 overflow-y-auto"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <ListChecks className="h-4 w-4 text-accent-emerald" />
                        <span className="text-xs font-semibold text-accent-emerald">Plano de Ação</span>
                      </div>
                      {actionItems.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-center gap-3 text-xs"
                        >
                          <ChevronRight className="h-3 w-3 text-accent-emerald shrink-0" />
                          <span className="flex-1 text-foreground/80">{item.task}</span>
                          <Badge variant="outline" className={cn("text-[8px] shrink-0", priorityBadge(item.priority))}>
                            {item.priority}
                          </Badge>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Chat input ─────────────────────── */}
                <div className="p-3 border-t border-border/10 shrink-0">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Pergunte algo ao seu time de IA… Use @Marketing, @Sales..."
                        className="w-full h-11 rounded-xl bg-card/50 border border-border/30 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all"
                        onKeyDown={(e) => { if (e.key === "Enter") handleSendInput(); }}
                      />
                    </div>
                    <button
                      onClick={toggleVoice}
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center border border-border/30 transition-all",
                        isListening ? "bg-primary/20 text-primary border-primary/30" : "text-muted-foreground hover:bg-card/60"
                      )}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                    <Button
                      onClick={handleSendInput}
                      disabled={!inputValue.trim()}
                      size="icon"
                      className="w-11 h-11 rounded-xl shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default HolographicMeetingRoom;
